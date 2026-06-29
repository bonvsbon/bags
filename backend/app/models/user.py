import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=_uuid, primary_key=True)
    email: str | None = Field(default=None, index=True, unique=True)
    password_hash: str | None = None
    account_type: str = Field(default="registered")  # registered | guest
    created_at: datetime = Field(default_factory=_now)
    guest_expires_at: datetime | None = None


class AuthIdentity(SQLModel, table=True):
    __tablename__ = "auth_identities"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    provider: str = Field(default="google")  # google
    provider_subject: str = Field(index=True)  # Google `sub`
    provider_email: str | None = None
    email_verified: bool = False
    created_at: datetime = Field(default_factory=_now)


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True)
    expires_at: datetime
    revoked_at: datetime | None = None
