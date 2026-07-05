from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str
    email: str
    phone: str | None = None
    avatar_url: str | None = None


def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not any(character.islower() for character in password):
        raise ValueError("Password must include a lowercase letter")
    if not any(character.isupper() for character in password):
        raise ValueError("Password must include an uppercase letter")
    if not any(character.isdigit() for character in password):
        raise ValueError("Password must include a number")
    if not any(not character.isalnum() for character in password):
        raise ValueError("Password must include a special character")
    return password


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_password_strength(value)


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = None


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, value: str) -> str:
        return validate_password_strength(value)


class UserAvatarUpdate(BaseModel):
    avatar_url: str | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
