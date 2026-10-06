from datetime import datetime
from uuid import UUID
from pydantic import EmailStr, Field


from app.schemas.common import StrictModel

class UserCreate(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(StrictModel):
    email: EmailStr
    password: str


class RefreshRequest(StrictModel):
    refresh_token: str


class UserRead(StrictModel):
    id: UUID
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime


class TokenPair(StrictModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
