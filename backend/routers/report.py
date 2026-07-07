"""
POST /generate-report

Dedicated async report endpoint.
- Accepts detection JSON + optional image upload
- Fetches RC data automatically if plate is provided
- Generates PDF in-memory
- Streams bytes directly (no temp files on disk between calls)
- Never crashes on missing data
"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import Response
from typing import Optional
import json
import uuid
from datetime import datetime

from ..utils.reporter import generate_pdf_bytes
from ..services.vehicle_registry import get_registry_service

router = APIRouter(prefix="/report", tags=["report"])


@router.post("/generate")
async def generate_report(
    # Detection payload as JSON string (required)
    detections_json: str = Form(..., description="JSON array of detection objects"),
    # OCR / vehicle metadata
    plate_number: Optional[str] = Form(None),
    owner_name: Optional[str] = Form(None),
    vehicle_model: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    status: Optional[str] = Form("unknown"),
    binary_confidence: Optional[float] = Form(0.0),
    ocr_output: Optional[str] = Form(None),
    inference_time_ms: Optional[float] = Form(None),
    scan_id: Optional[str] = Form(None),
    # Optional vehicle image for annotation
    image: Optional[UploadFile] = File(None),
):
    """
    Generate and stream a professional PDF compliance report.

    Accepts a multipart/form-data POST with:
    - detections_json: JSON-encoded list of Detection objects
    - plate_number: OCR-extracted plate (triggers auto RC lookup)
    - image: Optional vehicle photo for visual evidence
    - Other metadata fields

    Returns:
        PDF bytes as application/pdf — downloads directly in browser.
    """
    # 1. Parse detections
    try:
        detections = json.loads(detections_json)
    except Exception:
        detections = []

    # 2. Auto-fetch RC data if plate given
    rc_data: dict = {}
    if plate_number:
        try:
            registry = get_registry_service()
            result = await registry.lookup_by_plate(plate_number)
            if result:
                rc_data = result
        except Exception as e:
            print(f"[Report] RC lookup failed (non-fatal): {e}")

    # 3. Build user_details merging manual fields + RC data
    user_details = {
        "plate_number":        plate_number or rc_data.get("plate_number"),
        "owner_name":          owner_name or rc_data.get("owner_masked"),
        "vehicle_model":       vehicle_model or rc_data.get("vehicle_model"),
        "manufacturer":        rc_data.get("manufacturer"),
        "fuel_type":           rc_data.get("fuel_type"),
        "registration_state":  rc_data.get("registration_state"),
        "registration_date":   rc_data.get("registration_date"),
        "insurance_valid_till":rc_data.get("insurance_valid_till"),
        "location":            location,
    }

    # 4. Build scan_data dict
    report_id = scan_id or uuid.uuid4().hex
    scan_data = {
        "id":                report_id,
        "status":            status,
        "binary_confidence": binary_confidence,
        "detections":        detections,
        "ocr_output":        ocr_output or plate_number,
        "plate_number":      plate_number,
        "vehicle_model":     vehicle_model or rc_data.get("vehicle_model"),
        "vehicle_owner":     owner_name or rc_data.get("owner_masked"),
        "inference_time_ms": inference_time_ms,
    }

    # 5. Read image bytes (optional)
    image_bytes: Optional[bytes] = None
    if image:
        try:
            image_bytes = await image.read()
        except Exception:
            image_bytes = None

    # 6. Generate PDF in-memory
    try:
        pdf_bytes = generate_pdf_bytes(
            scan_data=scan_data,
            user_details=user_details,
            image_bytes=image_bytes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    # 7. Stream back as downloadable PDF
    filename = f"VehicleModAI_Report_{(plate_number or report_id[:8]).replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
            "Cache-Control": "no-store",
        }
    )


@router.post("/quick")
async def quick_report(
    plate_number: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """
    Lightweight report for live camera captures.
    Auto-fetches RC data from plate and generates instant PDF.
    """
    rc_data: dict = {}
    if plate_number:
        try:
            registry = get_registry_service()
            result = await registry.lookup_by_plate(plate_number)
            if result:
                rc_data = result
        except Exception:
            pass

    scan_data = {
        "id": uuid.uuid4().hex,
        "status": "live_capture",
        "binary_confidence": 0.0,
        "detections": [],
        "ocr_output": plate_number,
        "plate_number": plate_number,
        "vehicle_model": rc_data.get("vehicle_model"),
        "vehicle_owner": rc_data.get("owner_masked"),
    }

    user_details = {
        "plate_number":  plate_number,
        "owner_name":    rc_data.get("owner_masked"),
        "vehicle_model": rc_data.get("vehicle_model"),
        "manufacturer":  rc_data.get("manufacturer"),
        "fuel_type":     rc_data.get("fuel_type"),
        "location":      location,
        "insurance_valid_till": rc_data.get("insurance_valid_till"),
        "registration_date":    rc_data.get("registration_date"),
    }

    image_bytes = None
    if image:
        try:
            image_bytes = await image.read()
        except Exception:
            pass

    pdf_bytes = generate_pdf_bytes(scan_data, user_details, image_bytes)
    filename = f"QuickCapture_{(plate_number or 'Unknown').replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
