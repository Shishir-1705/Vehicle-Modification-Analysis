import httpx
import asyncio
import re
from typing import Optional, Dict
from loguru import logger
import random
import time


# --- Unofficial Parivahan RC Data Fetcher ---
# Uses the unofficial/undocumented Parivahan API endpoint used by their mobile app.
# This is commonly referenced in open-source ANPR projects for Indian vehicles.
PARIVAHAN_API = "https://vahan.parivahan.gov.in/vahanservice/vahan/ui/statevalidation/externalSearch"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36",
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://vahan.parivahan.gov.in",
    "Referer": "https://vahan.parivahan.gov.in/vahanservice/"
}


class VehicleRegistryService:
    """
    Fetches Indian RC (Registration Certificate) information.
    
    Strategy (in order of priority):
    1. MongoDB cache check - instant response for recently seen plates
    2. Unofficial Parivahan API scrape - free, no API key needed
    3. Mock database fallback for known demo plates
    
    Features:
    - Async HTTP with retry logic
    - Timeout handling
    - Owner name masking (privacy compliance)
    - Captcha failure detection
    """

    # --- Demo/mock fallback data for known plates ---
    _mock_db = {
        "KA01HH1234": {
            "owner_masked": "J** D**",
            "manufacturer": "Yamaha",
            "vehicle_model": "YZF R15 V4",
            "fuel_type": "Petrol",
            "registration_date": "2023-05-12",
            "vehicle_class": "Motorcycle",
            "insurance_valid_till": "2025-05-11",
            "contact": "+91 98765 *****",
        },
        "MH12AB5678": {
            "owner_masked": "J** S****",
            "manufacturer": "Royal Enfield",
            "vehicle_model": "Himalayan",
            "fuel_type": "Petrol",
            "registration_date": "2022-11-20",
            "vehicle_class": "Motorcycle",
            "insurance_valid_till": "2023-11-19",
            "contact": "+91 87654 *****",
        },
        "DL3SCA9999": {
            "owner_masked": "A*** S*****",
            "manufacturer": "KTM",
            "vehicle_model": "RC 390",
            "fuel_type": "Petrol",
            "registration_date": "2024-01-05",
            "vehicle_class": "Motorcycle",
            "insurance_valid_till": "2026-01-04",
            "contact": "+91 76543 *****",
        }
    }

    @staticmethod
    def _mask_name(name: str) -> str:
        """Mask owner name for privacy: 'Amit Sharma' → 'A*** S*****'"""
        if not name:
            return "Unknown"
        parts = name.split()
        masked = []
        for part in parts:
            if len(part) > 1:
                masked.append(part[0] + "*" * (len(part) - 1))
            else:
                masked.append(part)
        return " ".join(masked)

    @staticmethod
    def _clean_plate(plate: str) -> str:
        return re.sub(r'[^A-Z0-9]', '', plate.upper().replace(" ", ""))

    async def _fetch_parivahan(self, plate: str) -> Optional[Dict]:
        """
        Attempt to fetch RC details from the unofficial Parivahan endpoint.
        Returns parsed dict or None on failure.
        """
        clean = self._clean_plate(plate)
        payload = {
            "regNo": clean,
            "type": "RC_DETAIL"
        }
        retries = 3
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        PARIVAHAN_API,
                        data=payload,
                        headers=HEADERS
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        # Parse known response structure from Parivahan
                        if data.get("regData"):
                            reg = data["regData"]
                            return {
                                "owner_masked": self._mask_name(reg.get("owner_name", "")),
                                "manufacturer": reg.get("maker_desc", "Unknown"),
                                "vehicle_model": reg.get("model_desc", "Unknown"),
                                "fuel_type": reg.get("fuel_desc", "Unknown"),
                                "registration_date": reg.get("reg_date", "Unknown"),
                                "vehicle_class": reg.get("vch_class_desc", "Unknown"),
                                "insurance_valid_till": reg.get("insurance_upto", "Unknown"),
                                "contact": None  # Not provided by Parivahan
                            }
                    elif resp.status_code == 403:
                        logger.warning(f"[RC Scraper] Captcha/block on attempt {attempt+1} for {plate}")
                        await asyncio.sleep(2 ** attempt)  # exponential backoff
                    else:
                        logger.warning(f"[RC Scraper] HTTP {resp.status_code} on attempt {attempt+1}")
                        
            except httpx.TimeoutException:
                logger.warning(f"[RC Scraper] Timeout on attempt {attempt+1} for plate {plate}")
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"[RC Scraper] Error: {e}")
                break

        return None

    async def lookup_by_plate(self, plate: str) -> Optional[Dict]:
        """
        Full lookup pipeline:
        1. Check MongoDB RC cache (only if database is connected)
        2. Try Parivahan scrape
        3. Fall back to mock database
        """
        from ..models import RCData
        from ..crud import is_db_connected
        
        clean_plate = self._clean_plate(plate)
        
        # 1. MongoDB cache check (if connected)
        if is_db_connected():
            try:
                cached = await RCData.find_one(RCData.plate_number == clean_plate)
                if cached:
                    logger.info(f"[RC Cache HIT] {clean_plate}")
                    return cached.dict()
            except Exception as e:
                logger.warning(f"[RC Cache] Cache lookup failed: {e}")
 
        # 2. Live Parivahan scrape
        logger.info(f"[RC Scraper] Live fetch for {clean_plate}")
        live_data = await self._fetch_parivahan(clean_plate)
        
        if live_data:
            # Cache it in MongoDB for future requests (if connected)
            if is_db_connected():
                try:
                    rc_record = RCData(plate_number=clean_plate, **live_data)
                    await rc_record.insert()
                    logger.success(f"[RC Cache SAVED] {clean_plate}")
                except Exception as e:
                    logger.warning(f"[RC Cache] Cache save failed: {e}")
            return live_data
 
        # 3. Demo fallback
        if clean_plate in self._mock_db:
            logger.info(f"[RC Fallback] Using mock data for {clean_plate}")
            return self._mock_db[clean_plate]
 
        logger.warning(f"[RC Lookup] No data found for {clean_plate}")
        return None


_registry_service: Optional[VehicleRegistryService] = None

def get_registry_service() -> VehicleRegistryService:
    global _registry_service
    if _registry_service is None:
        _registry_service = VehicleRegistryService()
    return _registry_service
