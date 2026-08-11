import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .. import crud, schemas
from ..auth.jwt_handler import create_access_token, decode_access_token
from ..config.env import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = decode_access_token(token)
        if not payload or not payload.get("sub"):
            raise credentials_exception
        email: str = payload.get("sub")
        user = await crud.get_user_by_email(email=email)
        if not user:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception




@router.post("/register", response_model=schemas.UserResponse)
async def register_user(user: schemas.UserCreate):
    db_user = await crud.get_user_by_email(email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await crud.create_user(user=user)

from fastapi import APIRouter, Depends, HTTPException, status, Request

@router.post("/login", response_model=schemas.Token)
async def login_for_access_token(request: Request):
    username = None
    password = None

    # 1. Try reading as Form Data
    try:
        form = await request.form()
        username = form.get("username") or form.get("email")
        password = form.get("password")
    except Exception:
        pass

    # 2. Fallback to JSON payload if form is empty
    if not username or not password:
        try:
            body = await request.json()
            username = body.get("username") or body.get("email")
            password = body.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing email/username or password",
        )

    user = await crud.get_user_by_email(email=username)
    if not user or not crud.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    from datetime import timedelta
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserProfileResponse)
async def read_users_me(current_user=Depends(get_current_user)):
    """Returns profile details and scan statistics for the authenticated user."""
    user_history = await crud.get_history(limit=1000, user_id=str(current_user.id))
    user_scans = user_history.get("total", 0)
    return schemas.UserProfileResponse(
        id=str(current_user.id),
        full_name=current_user.full_name,
        email=current_user.email,
        created_at=current_user.created_at,
        total_scans=user_scans,
        reports_generated=user_scans
    )



