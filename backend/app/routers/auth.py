import base64
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    Token,
    TokenPayload,
    UserLoginRequest,
    UserPasswordChangeRequest,
    UserProfileUpdateRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/token",
    auto_error=False,
)


def format_user_response(user: User) -> UserResponse:
    """Helper to convert User model to sanitized UserResponse schema."""
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        name=user.name or user.username.replace("_", " ").title(),
        role=user.role,
        avatar=user.avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}",
        is_active=user.is_active,
        created_at=user.created_at,
    )


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency: Extract and validate JWT Bearer token, return active User."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    email: Optional[str] = payload.get("email")

    if not user_id and not email:
        raise credentials_exception

    user = None
    if user_id:
        stmt = select(User).where(User.id == user_id)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

    if not user and email:
        stmt = select(User).where(User.email == email)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

    if not user:
        raise credentials_exception

    return user


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Dependency: Extract active User if valid token is provided, otherwise return demo user or None."""
    if not token:
        stmt = select(User).where(User.email == "admin@example.com")
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    payload = decode_access_token(token)
    if not payload:
        stmt = select(User).where(User.email == "admin@example.com")
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    user_id: Optional[str] = payload.get("sub")
    email: Optional[str] = payload.get("email")

    if user_id:
        stmt = select(User).where(User.id == user_id)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if user:
            return user

    if email:
        stmt = select(User).where(User.email == email)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if user:
            return user

    return None


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Ensure the authenticated user account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    return current_user


@router.post(
    "/register",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(register_data: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user in MySQL."""
    # Check if email is already in use
    stmt_email = select(User).where(User.email == register_data.email)
    res_email = await db.execute(stmt_email)
    if res_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Check if username is already in use
    stmt_user = select(User).where(User.username == register_data.username)
    res_user = await db.execute(stmt_user)
    if res_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken. Please choose another.",
        )

    hashed_pwd = get_password_hash(register_data.password)
    user_name = register_data.name or register_data.username.replace("_", " ").title()

    new_user = User(
        username=register_data.username,
        email=register_data.email,
        name=user_name,
        role="Member",
        avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={register_data.username}",
        hashed_password=hashed_pwd,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token_claims = {
        "email": new_user.email,
        "username": new_user.username,
        "role": new_user.role,
    }
    access_token = create_access_token(subject=str(new_user.id), extra_claims=token_claims)
    user_resp = format_user_response(new_user)

    return {
        "success": True,
        "message": "Account registered successfully",
        "token": access_token,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp.model_dump(),
    }


@router.post(
    "/login",
    response_model=dict,
    summary="Login with credentials",
)
async def login(login_data: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with MySQL and return JWT access token."""
    identifier = (login_data.identifier or login_data.email or login_data.username or "").strip()
    password = login_data.password

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide both username/email and password.",
        )

    stmt = select(User).where(
        or_(User.email == identifier.lower(), User.username == identifier)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your username/email and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been deactivated. Please contact support.",
        )

    token_claims = {
        "email": user.email,
        "username": user.username,
        "role": user.role,
    }
    access_token = create_access_token(subject=str(user.id), extra_claims=token_claims)
    user_resp = format_user_response(user)

    return {
        "success": True,
        "message": "Authentication successful",
        "token": access_token,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp.model_dump(),
    }


@router.post(
    "/token",
    response_model=Token,
    summary="OAuth2 compatible token endpoint",
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Standard OAuth2 password flow endpoint for OpenAPI docs."""
    identifier = form_data.username.strip()
    stmt = select(User).where(
        or_(User.email == identifier.lower(), User.username == identifier)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_claims = {
        "email": user.email,
        "username": user.username,
        "role": user.role,
    }
    access_token = create_access_token(subject=str(user.id), extra_claims=token_claims)
    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=dict,
    summary="Get current user profile",
)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Return profile details of the authenticated user."""
    return {
        "success": True,
        "user": format_user_response(current_user).model_dump(),
    }


@router.put(
    "/profile",
    response_model=dict,
    summary="Update current user profile",
)
async def update_profile(
    update_data: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile details for the authenticated user and persist to MySQL."""
    # If email is being changed, ensure it's not taken by another user
    if update_data.email and update_data.email.lower() != current_user.email.lower():
        stmt = select(User).where((User.email == update_data.email.lower()) & (User.id != current_user.id))
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email address is already in use by another account.",
            )
        current_user.email = update_data.email.lower()

    # If username is being changed, ensure it's not taken by another user
    if update_data.username and update_data.username != current_user.username:
        stmt = select(User).where((User.username == update_data.username) & (User.id != current_user.id))
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already taken by another account.",
            )
        current_user.username = update_data.username

    if update_data.name is not None:
        current_user.name = update_data.name.strip()

    if update_data.avatar is not None:
        current_user.avatar = update_data.avatar

    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    user_resp = format_user_response(current_user)
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": user_resp.model_dump(),
    }


@router.put(
    "/password",
    response_model=dict,
    summary="Change account password",
)
async def change_password(
    pwd_data: UserPasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify current password, hash new password, and update in MySQL."""
    if not verify_password(pwd_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    current_user.hashed_password = get_password_hash(pwd_data.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return {
        "success": True,
        "message": "Password changed successfully.",
    }


@router.post(
    "/avatar",
    response_model=dict,
    summary="Upload profile picture",
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and save user avatar image to MySQL."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image (PNG, JPG, WebP, GIF).",
        )

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds 5MB limit.",
        )

    encoded = base64.b64encode(contents).decode("utf-8")
    avatar_url = f"data:{file.content_type};base64,{encoded}"

    current_user.avatar = avatar_url
    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return {
        "success": True,
        "message": "Avatar uploaded and saved successfully.",
        "avatar": avatar_url,
        "user": format_user_response(current_user).model_dump(),
    }


@router.post(
    "/logout",
    response_model=dict,
    summary="Logout current session",
)
async def logout():
    """Client-side token invalidation."""
    return {
        "success": True,
        "message": "Successfully logged out. Please remove token from local storage.",
    }
