from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models.finance import Budget
from app.money import to_baht, to_satang
from app.services.ownership import require_visible_category

router = APIRouter(prefix="/budgets", tags=["budgets"])


class BudgetIn(BaseModel):
    category_id: str
    limit_amount: float = Field(gt=0)
    period: str | None = None  # YYYY-MM, defaults to current month


class BudgetUpdate(BaseModel):
    limit_amount: float | None = Field(default=None, gt=0)


class BudgetOut(BaseModel):
    id: str
    category_id: str
    period: str
    limit_amount: float


def _out(b: Budget) -> BudgetOut:
    return BudgetOut(
        id=b.id, category_id=b.category_id, period=b.period,
        limit_amount=to_baht(b.limit_amount),
    )


def _owned(session, uid, budget_id) -> Budget:
    b = session.get(Budget, budget_id)
    if b is None or b.user_id != uid:
        raise HTTPException(status_code=404, detail="Budget not found")
    return b


@router.get("", response_model=list[BudgetOut])
def list_budgets(
    user: CurrentUser, session: SessionDep, period: str | None = None
):
    period = period or date.today().strftime("%Y-%m")
    rows = session.exec(
        select(Budget).where(Budget.user_id == user.id, Budget.period == period)
    ).all()
    return [_out(b) for b in rows]


@router.post("", response_model=BudgetOut, status_code=201)
def create_budget(body: BudgetIn, user: CurrentUser, session: SessionDep):
    require_visible_category(session, user.id, body.category_id)
    period = body.period or date.today().strftime("%Y-%m")
    # One budget per (category, period): upsert.
    existing = session.exec(
        select(Budget).where(
            Budget.user_id == user.id,
            Budget.category_id == body.category_id,
            Budget.period == period,
        )
    ).first()
    if existing:
        existing.limit_amount = to_satang(body.limit_amount)
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return _out(existing)
    b = Budget(
        user_id=user.id, category_id=body.category_id, period=period,
        limit_amount=to_satang(body.limit_amount),
    )
    session.add(b)
    session.commit()
    session.refresh(b)
    return _out(b)


@router.patch("/{budget_id}", response_model=BudgetOut)
def patch_budget(
    budget_id: str, body: BudgetUpdate, user: CurrentUser, session: SessionDep
):
    b = _owned(session, user.id, budget_id)
    if body.limit_amount is not None:
        b.limit_amount = to_satang(body.limit_amount)
    session.add(b)
    session.commit()
    session.refresh(b)
    return _out(b)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: str, user: CurrentUser, session: SessionDep):
    session.delete(_owned(session, user.id, budget_id))
    session.commit()
