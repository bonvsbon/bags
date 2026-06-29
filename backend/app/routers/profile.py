from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import Session

from app.deps import CurrentUser, SessionDep
from app.models.profile import Profile, Settings
from app.money import to_baht, to_satang

router = APIRouter(tags=["profile"])


# --- get-or-create helpers (reused by onboarding) ---
def get_or_create_profile(session: Session, uid: str) -> Profile:
    p = session.get(Profile, uid)
    if p is None:
        p = Profile(user_id=uid)
        session.add(p)
        session.commit()
        session.refresh(p)
    return p


def get_or_create_settings(session: Session, uid: str) -> Settings:
    s = session.get(Settings, uid)
    if s is None:
        s = Settings(user_id=uid)
        session.add(s)
        session.commit()
        session.refresh(s)
    return s


# --- Profile ---
class ProfileOut(BaseModel):
    display_name: str | None
    pay_day: int
    monthly_income: float
    primary_goal: str
    mode: str
    currency: str
    locale: str


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    pay_day: int | None = None
    monthly_income: float | None = None
    primary_goal: str | None = None
    mode: str | None = None


def _profile_out(p: Profile) -> ProfileOut:
    return ProfileOut(
        display_name=p.display_name, pay_day=p.pay_day,
        monthly_income=to_baht(p.monthly_income), primary_goal=p.primary_goal,
        mode=p.mode, currency=p.currency, locale=p.locale,
    )


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: CurrentUser, session: SessionDep):
    return _profile_out(get_or_create_profile(session, user.id))


@router.patch("/profile", response_model=ProfileOut)
def patch_profile(body: ProfileUpdate, user: CurrentUser, session: SessionDep):
    p = get_or_create_profile(session, user.id)
    data = body.model_dump(exclude_unset=True)
    if "monthly_income" in data:
        p.monthly_income = to_satang(data.pop("monthly_income"))
    for k, v in data.items():
        setattr(p, k, v)
    session.add(p)
    session.commit()
    session.refresh(p)
    return _profile_out(p)


# --- Settings ---
class SettingsOut(BaseModel):
    theme: str
    notify_bills: bool
    notify_budget: bool
    weekly_summary: bool
    biometric: bool
    hide_amounts: bool


class SettingsUpdate(BaseModel):
    theme: str | None = None
    notify_bills: bool | None = None
    notify_budget: bool | None = None
    weekly_summary: bool | None = None
    biometric: bool | None = None
    hide_amounts: bool | None = None


@router.get("/settings", response_model=SettingsOut)
def get_settings_route(user: CurrentUser, session: SessionDep):
    return get_or_create_settings(session, user.id)


@router.patch("/settings", response_model=SettingsOut)
def patch_settings(body: SettingsUpdate, user: CurrentUser, session: SessionDep):
    s = get_or_create_settings(session, user.id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    session.add(s)
    session.commit()
    session.refresh(s)
    return s
