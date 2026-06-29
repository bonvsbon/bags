from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models.finance import Goal
from app.money import to_baht, to_satang
from app.services import ledger

router = APIRouter(prefix="/goals", tags=["goals"])


class GoalIn(BaseModel):
    name: str
    icon: str | None = None
    icon_bg: str | None = None
    target_amount: float
    saved_amount: float = 0
    monthly_contribution: float | None = None


class GoalUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    icon_bg: str | None = None
    target_amount: float | None = None
    saved_amount: float | None = None
    monthly_contribution: float | None = None


class ContributeIn(BaseModel):
    amount: float


class GoalOut(BaseModel):
    id: str
    name: str
    icon: str | None
    icon_bg: str | None
    target_amount: float
    saved_amount: float
    monthly_contribution: float | None


def _out(g: Goal) -> GoalOut:
    return GoalOut(
        id=g.id, name=g.name, icon=g.icon, icon_bg=g.icon_bg,
        target_amount=to_baht(g.target_amount), saved_amount=to_baht(g.saved_amount),
        monthly_contribution=(
            to_baht(g.monthly_contribution)
            if g.monthly_contribution is not None
            else None
        ),
    )


def _owned(session, uid, goal_id) -> Goal:
    g = session.get(Goal, goal_id)
    if g is None or g.user_id != uid:
        raise HTTPException(status_code=404, detail="Goal not found")
    return g


@router.get("", response_model=list[GoalOut])
def list_goals(user: CurrentUser, session: SessionDep):
    rows = session.exec(select(Goal).where(Goal.user_id == user.id)).all()
    return [_out(g) for g in rows]


@router.post("", response_model=GoalOut, status_code=201)
def create_goal(body: GoalIn, user: CurrentUser, session: SessionDep):
    g = Goal(
        user_id=user.id, name=body.name, icon=body.icon, icon_bg=body.icon_bg,
        target_amount=to_satang(body.target_amount),
        saved_amount=to_satang(body.saved_amount),
        monthly_contribution=(
            to_satang(body.monthly_contribution)
            if body.monthly_contribution is not None
            else None
        ),
    )
    session.add(g)
    session.commit()
    session.refresh(g)
    return _out(g)


@router.patch("/{goal_id}", response_model=GoalOut)
def patch_goal(
    goal_id: str, body: GoalUpdate, user: CurrentUser, session: SessionDep
):
    g = _owned(session, user.id, goal_id)
    data = body.model_dump(exclude_unset=True)
    for money_field in ("target_amount", "saved_amount", "monthly_contribution"):
        if money_field in data and data[money_field] is not None:
            setattr(g, money_field, to_satang(data.pop(money_field)))
        elif money_field in data:
            setattr(g, money_field, None)
            data.pop(money_field)
    for k, v in data.items():
        setattr(g, k, v)
    session.add(g)
    session.commit()
    session.refresh(g)
    return _out(g)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: str, user: CurrentUser, session: SessionDep):
    g = _owned(session, user.id, goal_id)
    # Refund whatever was saved back into a spending account, so deleting a goal
    # doesn't make the saved money vanish.
    if g.saved_amount:
        ledger.adjust_balance(session, ledger.primary_asset_id(session, user.id), g.saved_amount)
    session.delete(g)
    session.commit()


@router.post("/{goal_id}/contribute", response_model=GoalOut)
def contribute(
    goal_id: str, body: ContributeIn, user: CurrentUser, session: SessionDep
):
    g = _owned(session, user.id, goal_id)
    amt = to_satang(body.amount)
    g.saved_amount += amt
    # Moving money into a goal spends it from an asset account, so `available`
    # drops by the contribution instead of money appearing from nowhere.
    ledger.adjust_balance(session, ledger.primary_asset_id(session, user.id), -amt)
    session.add(g)
    session.commit()
    session.refresh(g)
    return _out(g)
