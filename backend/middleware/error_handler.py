from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from ..utils.logger import logger

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(f"Unhandled Exception: {exc}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"message": "Internal Server Error", "details": str(exc)}
            )
