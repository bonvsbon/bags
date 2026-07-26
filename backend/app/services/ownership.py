"""Shared ownership / visibility guards for foreign-key references.

These reject references to rows the current user must not touch — closing the
IDOR holes where one user could point a transaction/bill/budget at another
user's account or private category.
"""
from fastapi import HTTPException
from sqlmodel import Session

from app.models.ai import AiConversation
from app.models.finance import Account, Category


def require_owned_account(session: Session, uid: str, account_id: str | None) -> None:
    """No-op for None; otherwise the account must exist AND belong to `uid`."""
    if account_id is None:
        return
    acc = session.get(Account, account_id)
    if acc is None or acc.user_id != uid:
        raise HTTPException(status_code=404, detail="Account not found")


def require_visible_category(session: Session, uid: str, category_id: str | None) -> None:
    """Allow None, a system default (user_id IS NULL), or the user's own category."""
    if category_id is None:
        return
    cat = session.get(Category, category_id)
    if cat is None or (cat.user_id is not None and cat.user_id != uid):
        raise HTTPException(status_code=404, detail="Category not found")


def require_owned_conversation(
    session: Session, uid: str, conversation_id: str
) -> AiConversation:
    """The conversation must exist AND belong to `uid`; returns it for reuse."""
    conv = session.get(AiConversation, conversation_id)
    if conv is None or conv.user_id != uid:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv
