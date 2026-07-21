import os
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Production security middleware implementing basic rate limiting and request validation.
    Designed to protect the Railway deployment from abuse.
    """
    def __init__(self, app):
        super().__init__(app)
        self.rate_limit_records = {}
        # Max requests per minute per IP
        self.MAX_REQUESTS = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "100"))
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean up old records
        self.rate_limit_records = {ip: times for ip, times in self.rate_limit_records.items() 
                                   if current_time - times[-1] < 60}
                                   
        if client_ip in self.rate_limit_records:
            # Filter timestamps within the last minute
            recent = [t for t in self.rate_limit_records[client_ip] if current_time - t < 60]
            if len(recent) >= self.MAX_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
            self.rate_limit_records[client_ip] = recent + [current_time]
        else:
            self.rate_limit_records[client_ip] = [current_time]
            
        try:
            response = await call_next(request)
            # Add security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            return response
        except Exception as e:
            # Prevent internal stack traces from leaking in production
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "error_type": type(e).__name__}
            )
