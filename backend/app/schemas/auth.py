"""Authentication schemas."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=255)
    roll_number: str | None = None
    department: str | None = "CSE"
    semester: int | None = 5


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
    roll_number: str | None = None
    department: str | None = None
    semester: int | None = None
    cgpa: float | None = None
    phone: str | None = None
    hostel: str | None = None

    model_config = {"from_attributes": True}
