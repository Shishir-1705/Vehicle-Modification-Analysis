from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
import time
from .. import schemas
from ..inference.pipeline.orchestrator import get_orchestrator
from loguru import logger

router = APIRouter(prefix="/predict", tags=["production"])

@router.post("/", response_model=schemas.PredictResponse)
async def predict_violation(
    file: UploadFile = File(...)
):
    """
    High-performance production inference endpoint.
    Orchestrates ONNX Model Inference, Plate OCR Extraction, Grad-CAM, and Compliance Explanation.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Payload must be an image.")

    content = await file.read()
    infer_start = time.time()
    
    try:
        orchestrator = get_orchestrator()
        # Use ONNX by default, but allow easy switching to YOLO if needed
        result = await orchestrator.predict_async(content, use_onnx=True, conf_threshold=0.4)
        
        processed_detections = []
        extracted_text = ""
        
        for det in result["detections"]:
            if "ocr_text" in det:
                extracted_text += f"{det['ocr_text']} "
                
            processed_detections.append(schemas.DetectionResponse(
                id=str(int(time.time()*1000)),
                component_name=det["component_name"],
                confidence=det["confidence"],
                bounding_box=det["bounding_box"],
                explanation=det["explanation"],
                heatmap=det.get("heatmap")
            ))

        inference_time = (time.time() - infer_start) * 1000
        
        return schemas.PredictResponse(
            status="success",
            inference_time_ms=round(inference_time, 2),
            detections=processed_detections,
            ocr_output=extracted_text.strip() if extracted_text else None,
            system_load=None
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Inference Pipeline Crash: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal ML Pipeline Error")
