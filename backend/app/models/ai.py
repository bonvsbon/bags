import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AiConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str | None = None
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class AiMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"

    id: str = Field(default_factory=_uuid, primary_key=True)
    conversation_id: str = Field(foreign_key="ai_conversations.id", index=True)
    role: str  # user | assistant | system
    content: str
    provider: str | None = None   # which provider answered
    model: str | None = None      # concrete model that answered
    meta: str | None = None       # JSON: snapshot used to ground the answer (audit)
    created_at: datetime = Field(default_factory=_now)
