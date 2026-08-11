from fastapi import APIRouter, Query, Depends

from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timedelta
import csv
import io
from .. import models, schemas, crud


router = APIRouter(prefix="/analytics", tags=["analytics"])

def is_db_connected() -> bool:
    try:
        from ..main import db_status
        return db_status.get("connected", False)
    except Exception:
        return False

from .auth import get_current_user

@router.get("/metrics")
async def get_platform_metrics(current_user: schemas.UserResponse = Depends(get_current_user)):
    """
    Calculates KPI statistics and trends directly from SQLite DB (modai.db) scoped to current_user.
    """
    return await crud.get_metrics(user_id=str(current_user.id))

@router.get("/history")
async def get_detection_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    plate: Optional[str] = Query(None, description="Filter by plate number"),
    status: Optional[str] = Query(None, description="Filter by status: stock | modified"),
    search: Optional[str] = Query(None, description="Search term"),
    sort_by: Optional[str] = Query("newest", description="Sort order"),
    current_user: schemas.UserResponse = Depends(get_current_user)
):
    """
    Paginated detection history scoped strictly to the authenticated user.
    """
    return await crud.get_history(
        page=page,
        limit=limit,
        plate=plate,
        status=status,
        search=search,
        sort_by=sort_by or "newest",
        user_id=str(current_user.id)
    )





@router.get("/vehicle/{plate}")
async def lookup_vehicle(plate: str):
    """
    Look up all scans for a given plate number.
    Also returns cached RC data if available.
    """
    clean_plate = plate.upper().replace(" ", "")

    if not is_db_connected():
        from ..crud import _in_memory_scans
        scans_list = list(_in_memory_scans.values())
        filtered = [s for s in scans_list if s.plate_number and clean_plate in s.plate_number.upper().replace(" ", "")]
        
        from ..services.vehicle_registry import get_registry_service
        registry = get_registry_service()
        rc_data = registry._mock_db.get(clean_plate)
        
        return {
            "plate": clean_plate,
            "total_scans": len(filtered),
            "rc_data": rc_data,
            "scan_history": [{"id": str(s.id), "scanned_at": s.scanned_at, "status": s.status,
                              "confidence": s.binary_confidence} for s in filtered]
        }

    scans = await models.Scan.find(
        {"plate_number": {"$regex": clean_plate, "$options": "i"}}
    ).sort("-scanned_at").limit(50).to_list()

    rc_data = await models.RCData.find_one(models.RCData.plate_number == clean_plate)

    return {
        "plate": clean_plate,
        "total_scans": len(scans),
        "rc_data": rc_data.dict() if rc_data else None,
        "scan_history": [{"id": str(s.id), "scanned_at": s.scanned_at, "status": s.status,
                          "confidence": s.binary_confidence} for s in scans]
    }


@router.get("/export/csv")
async def export_csv(
    days: int = Query(30, ge=1, le=365, description="Export scans from last N days"),
    token: Optional[str] = Query(None, description="Auth token"),
):
    """
    Export detection history as downloadable CSV scoped to authenticated user.
    """
    # Manual token resolution for query string downloads
    try:
        current_user = await get_current_user(token=token) if token else None
        if not current_user:
            raise Exception()
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication required for CSV export")

    history_data = await crud.get_history(limit=5000, user_id=str(current_user.id))
    scans = history_data.get("results", [])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Scan ID", "Plate Number", "Status", "Confidence",
        "Vehicle Model", "Owner (Masked)", "Scanned At"
    ])
    for s in scans:
        writer.writerow([
            str(s.id),
            s.plate_number or "N/A",
            s.status,
            f"{s.binary_confidence:.2f}",
            s.vehicle_model or "N/A",
            s.vehicle_owner or "N/A",
            s.scanned_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(s.scanned_at, 'strftime') else str(s.scanned_at)
        ])

    output.seek(0)
    filename = f"detections_export_{str(current_user.id)[:8]}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

