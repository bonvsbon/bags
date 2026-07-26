import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Insight(SQLModel, table=True):
    __tablename__ = "insights"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    type: str
    title: str
    body: str | None = None
    severity: str = "info"  # info | warn | good
    period: str | None = None  # YYYY-MM
    created_at: datetime = Field(default_factory=_now)
    read_at: datetime | None = None


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    kind: str
    title: str
    body: str | None = None
    scheduled_for: datetime | None = None
    sent_at: datetime | None = None
    read_at: datetime | None = None
