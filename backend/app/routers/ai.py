"""AI assistant endpoints (Phase 9.3 subset of §5).

Read-only chat grounded on the user's real figures. The model never touches the
ledger and never sees another user's data. PDPA consent is required before any
call reaches a cloud provider.
"""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from app.ai import factory
from app.ai.base import AllProvidersExhausted
from app.deps import CurrentUser, SessionDep
from app.models.ai import AiConversation, AiMessage
from app.services import ai_context
from app.services.ownership import require_owned_conversation
from app.services.prompts import build_system

router = APIRouter(prefix="/ai", tags=["ai"])

_MAX_HISTORY = 10  # prior turns fed back to the model


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ChatIn(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatOut(BaseModel):
    reply: str
    provider: str
    model: str
    conversation_id: str


class ConsentOut(BaseModel):
    ai_consent_at: datetime


@router.post("/consent", response_model=ConsentOut)
def consent(user: CurrentUser, session: SessionDep):
    """Record PDPA consent to process financial data with cloud AI providers."""
    user.ai_consent_at = _now()
    session.add(user)
    session.commit()
    session.refresh(user)
    return ConsentOut(ai_consent_at=user.ai_consent_at)


@router.post("/chat", response_model=ChatOut)
def chat(body: ChatIn, user: CurrentUser, session: SessionDep):
    if user.ai_consent_at is None:
        raise HTTPException(status_code=403, detail="consent_required")
    text = body.message.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Empty message")

    # get-or-create conversation (ownership enforced when an id is supplied)
    if body.conversation_id:
        conv = require_owned_conversation(session, user.id, body.conversation_id)
    else:
        conv = AiConversation(user_id=user.id, title=text[:40])
        session.add(conv)
        session.commit()
        session.refresh(conv)

    # grounding snapshot (source of truth) -> system prompt
    snapshot = ai_context.build_snapshot(session, user.id)
    system = build_system(ai_context.snapshot_to_context(snapshot))

    # prior turns for continuity
    history = session.exec(
        select(AiMessage)
        .where(AiMessage.conversation_id == conv.id)
        .order_by(AiMessage.created_at)
    ).all()
    messages = [
        {"role": m.role, "content": m.content}
        for m in history[-_MAX_HISTORY:]
        if m.role in ("user", "assistant")
    ]
    messages.append({"role": "user", "content": text})

    try:
        result = factory.router_for(user).chat(
            system=system, messages=messages, task="chat"
        )
    except AllProvidersExhausted:
        # every provider is out (or none configured) — let the client offer retry/upgrade
        raise HTTPException(status_code=503, detail="ai_unavailable")

    # persist the turn (audit the grounding snapshot on the assistant message)
    session.add(AiMessage(conversation_id=conv.id, role="user", content=text))
    session.add(
        AiMessage(
            conversation_id=conv.id,
            role="assistant",
            content=result.text,
            provider=result.provider,
            model=result.model,
            meta=json.dumps(snapshot, ensure_ascii=False),
        )
    )
    conv.updated_at = _now()
    session.add(conv)
    session.commit()

    return ChatOut(
        reply=result.text,
        provider=result.provider,
        model=result.model,
        conversation_id=conv.id,
    )


@router.get("/conversations")
def list_conversations(user: CurrentUser, session: SessionDep):
    rows = session.exec(
        select(AiConversation)
        .where(AiConversation.user_id == user.id)
        .order_by(AiConversation.updated_at.desc())
    ).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        }
        for c in rows
    ]


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, user: CurrentUser, session: SessionDep):
    conv = require_owned_conversation(session, user.id, conversation_id)
    msgs = session.exec(
        select(AiMessage)
        .where(AiMessage.conversation_id == conv.id)
        .order_by(AiMessage.created_at)
    ).all()
    return {
        "id": conv.id,
        "title": conv.title,
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "provider": m.provider,
                "model": m.model,
                "created_at": m.created_at,
            }
            for m in msgs
        ],
    }


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str, user: CurrentUser, session: SessionDep):
    conv = require_owned_conversation(session, user.id, conversation_id)
    for m in session.exec(
        select(AiMessage).where(AiMessage.conversation_id == conv.id)
    ).all():
        session.delete(m)
    session.delete(conv)
    session.commit()
