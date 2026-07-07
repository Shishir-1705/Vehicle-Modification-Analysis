import time
import json
import os
from fastapi import Request
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Configure Loguru for structured production logging
# We output to both stdout and a rolling file
LOG_DIR = "/app/logs"
if not os.path.exists(LOG_DIR):
    # Fallback to local logs directory if not in container
    LOG_DIR = "logs"
    os.makedirs(LOG_DIR, exist_ok=True)

logger.add(f"{LOG_DIR}/api.log", rotation="10 MB", format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}", level="INFO")

class MonitoringMiddleware(BaseHTTPMiddleware):
    """
    Production-grade monitoring middleware.
    Tracks:
    - Request Path & Method
    - Response Status
    - Total Latency (ms)
    - Client Information
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Add trace ID or similar here if using distributed tracing
        
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000 # ms
            
            # Log Structured Info
            log_data = {
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "latency_ms": round(process_time, 2),
                "client_host": request.client.host if request.client else "unknown"
            }
            
            logger.info(json.dumps(log_data))
            
            # Add performance header
            response.headers["X-Process-Time"] = str(round(process_time, 2))
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"Request Failed | {request.method} {request.url.path} | Error: {str(e)} | Latency: {round(process_time, 2)}ms")
            raise e
