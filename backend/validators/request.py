from fastapi import HTTPException, Request

async def validate_content_type(request: Request):
    """
    Validates that the incoming request is multipart/form-data for image uploads
    """
    content_type = request.headers.get("content-type", "")
    if not content_type.startswith("multipart/form-data"):
        raise HTTPException(status_code=415, detail="Unsupported Media Type. Expected multipart/form-data")
