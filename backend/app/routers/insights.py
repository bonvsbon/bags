from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models.insight import Insight
from app.services import insights as engine

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("")
def list_insights(user: CurrentUser, session: SessionDep, refresh: bool = True):
    if refresh:
        engine.refresh_insights(session, user.id)
    rows = session.exec(
        select(Insight).where(Insight.user_id == user.id).order_by(
            Insight.created_at.desc()
        )
    ).all()
    return rows


@router.post("/{insight_id}/read", status_code=204)
def mark_read(insight_id: str, user: CurrentUser, session: SessionDep):
    i = session.get(Insight, insight_id)
    if i is None or i.user_id != user.id:
        raise HTTPException(status_code=404, detail="Insight not found")
    if i.read_at is None:
        i.read_at = datetime.now(timezone.utc)
        session.add(i)
        session.commit()
