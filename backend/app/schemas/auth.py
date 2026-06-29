from datetime import datetime

from pydantic import BaseModel, Field


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=8)
    display_name: str | None = None


class LoginIn(BaseModel):
    email: str
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class GoogleIn(BaseModel):
    id_token: str


class GuestUpgradeIn(BaseModel):
    email: str
    password: str = Field(min_length=8)


class TokenPair(BaseModel):
    access: str
    refresh: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str | None
    account_type: str
    created_at: datetime
