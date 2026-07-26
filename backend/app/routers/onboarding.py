from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models.finance import Account, Bill
from app.money import to_satang
from app.routers.profile import get_or_create_profile, get_or_create_settings

router = APIRouter(tags=["onboarding"])


class RecurringIn(BaseModel):
    name: str
    amount: float
    due_day: int = 1
    icon: str | None = None


class OnboardingIn(BaseModel):
    pay_day: int = 0  # 0 = EOM
    monthly_income: float = 0
    recurring: list[RecurringIn] = []
    primary_goal: str = "leftover"


class OnboardingOut(BaseModel):
    profile_complete: bool
    bills_created: int


@router.post("/onboarding", response_model=OnboardingOut)
def onboarding(body: OnboardingIn, user: CurrentUser, session: SessionDep):
    profile = get_or_create_profile(session, user.id)
    profile.pay_day = body.pay_day
    profile.monthly_income = to_satang(body.monthly_income)
    profile.primary_goal = body.primary_goal
    session.add(profile)
    get_or_create_settings(session, user.id)

    # Give the user a primary asset account seeded with their stated income, so
    # total_balance / available are sensible from day one (otherwise a new user
    # ends up with 0 balance and a negative "available" after bills are reserved).
    has_asset = session.exec(
        select(Account).where(Account.user_id == user.id, Account.type == "asset")
    ).first()
    if has_asset is None:
        session.add(Account(
            user_id=user.id, name="บัญชีหลัก", type="asset", kind="bank",
            balance=to_satang(body.monthly_income), icon="🏦",
        ))

    for r in body.recurring:
        session.add(Bill(
            user_id=user.id, name=r.name, amount=to_satang(r.amount),
            due_day=r.due_day, icon=r.icon, recurrence="monthly",
        ))
    session.commit()
    return OnboardingOut(profile_complete=True, bills_created=len(body.recurring))
