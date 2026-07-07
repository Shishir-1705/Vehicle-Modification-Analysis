from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timedelta
import csv
import io
from .. import models

router = APIRouter(prefix="/analytics", tags=["analytics"])

def is_db_connected() -> bool:
    try:
        from ..main import db_status
        return db_status.get("connected", False)
    except Exception:
        return False

@router.get("/metrics")
async def get_platform_metrics():
    """
    Admin Dashboard KPIs:
    - Total Users, Scans, Detections
    - Modification hotspot breakdown
    - Severity distribution
    """
    if not is_db_connected():
        # High-availability, strategic mock demonstration statistics
        return {
            "kpis": {
                "total_users": 18,
                "total_scans": 142,
                "total_detections": 84
            },
            "modification_trends": {
                "modified exhaust": 38,
                "modified bodywork": 22,
                "modified lighting": 14,
                "modified handle/mirrors": 7,
                "aftermarket alloy wheels": 3
            },
            "severity_breakdown": {
                "low": 12,
                "medium": 24,
                "high": 35,
                "critical": 13
            },
            "detection_trend": [
                {"date": "May 11", "count": 12},
                {"date": "May 12", "count": 18},
                {"date": "May 13", "count": 24},
                {"date": "May 14", "count": 19},
                {"date": "May 15", "count": 26},
                {"date": "May 16", "count": 21},
                {"date": "May 17", "count": 23}
            ]
        }

    total_users = await models.User.count()
    total_scans = await models.Scan.count()
    total_detections = await models.Detection.count()

    # Top 5 modification types via MongoDB aggregation
    popular_mods = await models.Detection.aggregate([
        {"$group": {"_id": "$component_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]).to_list()

    mod_distribution = {mod["_id"]: mod["count"] for mod in popular_mods}

    # Severity breakdown from explanation field
    severity_agg = await models.Detection.aggregate([
        {"$match": {"explanation.severity": {"$exists": True}}},
        {"$group": {"_id": "$explanation.severity", "count": {"$sum": 1}}}
    ]).to_list()

    severity_map = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for entry in severity_agg:
        level = (entry["_id"] or "").lower()
        if level in severity_map:
            severity_map[level] = entry["count"]

    # Detection trend: last 7 days
    trend_data = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await models.Scan.find({
            "scanned_at": {"$gte": day_start, "$lt": day_end}
        }).count()
        trend_data.append({"date": day_start.strftime("%b %d"), "count": count})

    return {
        "kpis": {
            "total_users": total_users,
            "total_scans": total_scans,
            "total_detections": total_detections
        },
        "modification_trends": mod_distribution,
        "severity_breakdown": severity_map,
        "detection_trend": trend_data
    }


@router.get("/history")
async def get_detection_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    plate: Optional[str] = Query(None, description="Filter by plate number"),
    status: Optional[str] = Query(None, description="Filter by status: stock | modified"),
):
    """
    Paginated detection history with optional plate/status filters.
    Supports 'Search by Plate' feature.
    """
    if not is_db_connected():
        from ..crud import _in_memory_scans
        scans_list = list(_in_memory_scans.values())
        
        filtered = scans_list
        if plate:
            filtered = [s for s in filtered if s.plate_number and plate.upper() in s.plate_number.upper()]
        if status:
            filtered = [s for s in filtered if s.status == status]
        
        filtered.sort(key=lambda s: s.scanned_at, reverse=True)
        
        skip = (page - 1) * limit
        paginated = filtered[skip : skip + limit]
        
        results = []
        for s in paginated:
            d = s.dict()
            d["id"] = str(s.id)
            results.append(d)
            
        return {
            "total": len(filtered),
            "page": page,
            "pages": (len(filtered) + limit - 1) // limit,
            "results": results
        }

    query = {}
    if plate:
        query["plate_number"] = {"$regex": plate.upper(), "$options": "i"}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await models.Scan.find(query).count()

    scans = await models.Scan.find(query)\
        .sort("-scanned_at")\
        .skip(skip)\
        .limit(limit)\
        .to_list()

    results = []
    for s in scans:
        d = s.dict()
        d["id"] = str(s.id)
        results.append(d)

    return {
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "results": results
    }


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
    days: int = Query(30, ge=1, le=365, description="Export scans from last N days")
):
    """
    Export detection history as downloadable CSV.
    """
    if not is_db_connected():
        from ..crud import _in_memory_scans
        scans = list(_in_memory_scans.values())
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
                s.scanned_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
        output.seek(0)
        filename = f"detections_demo_export.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    since = datetime.utcnow() - timedelta(days=days)
    scans = await models.Scan.find({"scanned_at": {"$gte": since}}).sort("-scanned_at").to_list()

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
            s.scanned_at.strftime("%Y-%m-%d %H:%M:%S")
        ])

    output.seek(0)
    filename = f"detections_last_{days}days.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
