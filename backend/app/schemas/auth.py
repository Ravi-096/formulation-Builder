import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class UserRegisterRequest(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: Optional[str] = None
    name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        """Enforce password complexity: uppercase, lowercase, digit, and special char."""
        if len(value) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter (A-Z).")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter (a-z).")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one digit (0-9).")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_]", value):
            raise ValueError("Password must contain at least one special character.")
        return value

    @model_validator(mode="after")
    def check_passwords_match(self) -> "UserRegisterRequest":
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserLoginRequest(BaseModel):
    """Schema for JSON-based login with identifier (email/username) or direct fields."""
    identifier: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str

    @model_validator(mode="after")
    def check_has_identifier(self) -> "UserLoginRequest":
        if not (self.identifier or self.email or self.username):
            raise ValueError("Please provide an email or username.")
        return self


class UserResponse(BaseModel):
    """Public sanitized user profile schema."""
    id: str
    username: str
    email: EmailStr
    name: Optional[str] = None
    role: str = "Member"
    avatar: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "65e8a94318c5e7512401f89a",
                "username": "admin_alex",
                "email": "admin@example.com",
                "name": "Alex Morgan",
                "role": "Administrator",
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin_alex",
                "is_active": True,
                "created_at": "2026-09-07T12:00:00Z",
            }
        },
    }


class Token(BaseModel):
    """OAuth2 / JWT token response schema."""
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class TokenPayload(BaseModel):
    """Decoded JWT claims payload schema."""
    sub: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


class UserProfileUpdateRequest(BaseModel):
    """Schema for updating user profile fields."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    avatar: Optional[str] = None


class UserPasswordChangeRequest(BaseModel):
    """Schema for changing account password."""
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)

