from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from typing import Optional
from .. import crud, schemas
from .auth import get_current_user
from ..inference.yolo.engine import get_yolo_engine
from ..utils.storage import upload_image_to_cloud
from ..services.recommender import get_suggestions
from ..inference.gradcam.engine import get_gradcam_engine
from ..utils.reporter import generate_pdf_bytes
from ..inference.ocr.engine import get_ocr_engine
from ..services.vehicle_registry import get_registry_service
from ..utils.notifier import get_notifier

router = APIRouter(prefix="/scan", tags=["scanning"])

@router.post("/analyze", response_model=schemas.ScanResponse)
async def analyze_bike(
    file: UploadFile = File(...), 
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(415, "Unsupported File Type. Must be an Image.")
        
    img_bytes = await file.read()
    
    # 1. Store File to CDN (S3)
    file_url = upload_image_to_cloud(img_bytes, file.filename.split('.')[-1])
    
    # 2. Track Base Scan entry in MongoDB
    scan_entry = await crud.create_scan(str(current_user.id), file_url)
    
    # 3. Deep Classification Pass (Binary + Multi-Label)
    from ..inference.classifier import classify_bike
    clf_results = classify_bike(img_bytes)
    await crud.update_scan_classification(
        str(scan_entry.id), 
        clf_results["status"], 
        clf_results["confidence"], 
        clf_results["modifications"]
    )

    # 4. Yolo Engine Pass (Object Detection for ROI)
    yolo_engine = get_yolo_engine()
    detections = yolo_engine.predict(img_bytes)
    
    # 4. Generate Recommendations based on inferences
    suggestions = get_suggestions(detections)
    
    # 5. Save Relational Structure to Database with Expert XAI Explanations
    from ..inference.explainer import generate_explanation
    
    for det in detections:
        # Generate Human-Readable Explanation
        explanation = generate_explanation(
            det["component_name"], 
            det["confidence"]
        )
        
        # --- NEW: Automated Metadata Extraction (OCR + Registry) ---
        if "plate" in det["component_name"].lower():
            ocr_engine = get_ocr_engine()
            plate_text = ocr_engine.extract_text(img_bytes, det["bounding_box"])
            
            if plate_text:
                registry = get_registry_service()
                vehicle_info = registry.lookup_by_plate(plate_text)
                
                if vehicle_info:
                    await crud.update_scan_metadata(
                        str(scan_entry.id),
                        plate=plate_text,
                        model=vehicle_info["vehicle_model"],
                        owner=vehicle_info["owner_name"],
                        contact=vehicle_info["contact"]
                    )
                else:
                    # Found plate but no registry match - still save the plate number
                    await crud.update_scan_metadata(str(scan_entry.id), plate=plate_text)

        # NEW: Generate GRAD-CAM Heatmap for Visual Explanation
        heatmap_uri = None
        if yolo_engine.model and "class_id" in det:
            try:
                gc_engine = get_gradcam_engine()
                heatmap_uri = gc_engine.generate_heatmap(img_bytes, det["class_id"], det["bounding_box"])
            except Exception as e:
                print(f"❌ Grad-CAM failed: {e}")

        # Create detection record with XAI data
        det_record = await crud.add_detection_to_scan(
            str(scan_entry.id), 
            det["component_name"], 
            det["confidence"], 
            det["bounding_box"],
            explanation=explanation,
            segmentation=det.get("segmentation"),
            heatmap=heatmap_uri
        )
        # Filter and create associated recommendations
        related_sugs = [s for s in suggestions if s["trigger_component"] == det["component_name"]]
        for sug in related_sugs:
            await crud.add_recommendation(
                str(det_record.id), 
                sug["product_name"], 
                sug["reason"], 
                sug["affiliate_link"]
            )

        # Fire alerts for high/critical violations
        if explanation and explanation.get("severity") in ("high", "critical"):
            try:
                notifier = get_notifier()
                plate = scan_entry.plate_number or "Unknown"
                await notifier.alert_violation(
                    plate=plate,
                    violation=explanation.get("violation", det["component_name"]),
                    severity=explanation["severity"],
                    confidence=det["confidence"]
                )
            except Exception:
                pass  # alerts are non-blocking
            
    # Fetch final object to include relationships
    final_scan = await crud.get_scan(str(scan_entry.id))
    detections = await crud.get_detections_for_scan(str(scan_entry.id))
    
    scan_dict = final_scan.dict()
    scan_dict['id'] = str(final_scan.id)
    scan_dict['detections'] = []
    
    for d in detections:
        d_dict = d.dict()
        d_dict['id'] = str(d.id)
        d_dict['recommendations'] = [] # Need to fetch recommendations if needed, leaving empty for now
        scan_dict['detections'].append(d_dict)
        
    return scan_dict

@router.get("/{scan_id}/report")
async def get_scan_report(
    scan_id: str,
    owner_name: Optional[str] = None,
    plate_number: Optional[str] = None,
    location: Optional[str] = None,
    token: Optional[str] = None, # Allow token in query string
):
    # Manual authentication check for file downloads (supports query param)
    from .auth import get_current_user
    try:
        # If token is provided in query, use it. Otherwise, get_current_user will look for headers.
        current_user = await get_current_user(token=token) if token else None
        if not current_user:
             raise HTTPException(status_code=401, detail="Authentication required for report generation")
    except Exception:
         raise HTTPException(status_code=401, detail="Invalid session token. Please re-login.")
    # 1. Fetch scan with all relationships
    scan_entry = await crud.get_scan(scan_id)
    if not scan_entry:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    if scan_entry.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
    scan_data = scan_entry.dict()
    scan_data['id'] = str(scan_entry.id)
    
    # Also fetch detections
    detections = await crud.get_detections_for_scan(str(scan_entry.id))
    scan_data['detections'] = []
    for d in detections:
        d_dict = d.dict()
        d_dict['id'] = str(d.id)
        scan_data['detections'].append(d_dict)
    
    try:
        user_meta = {
            "owner_name": scan_entry.vehicle_owner or owner_name,
            "plate_number": scan_entry.plate_number or plate_number,
            "location": location,
            "vehicle_model": scan_entry.vehicle_model,
        }
        pdf_bytes = generate_pdf_bytes(scan_data, user_details=user_meta)
        plate_str = (scan_entry.plate_number or scan_id[:8]).replace(' ', '_')
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="Inspection_{plate_str}.pdf"',
                "Content-Length": str(len(pdf_bytes)),
                "Cache-Control": "no-store"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report Generation Failed: {str(e)}")
