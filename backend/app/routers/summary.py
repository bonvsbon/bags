from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.services import aggregation

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/home")
def home(user: CurrentUser, session: SessionDep):
    return aggregation.summary_home(session, user.id)


@router.get("/detail")
def detail(user: CurrentUser, session: SessionDep):
    return aggregation.summary_detail(session, user.id)


@router.get("/plan")
def plan(user: CurrentUser, session: SessionDep):
    return aggregation.summary_plan(session, user.id)


@router.get("/dashboard")
def dashboard(user: CurrentUser, session: SessionDep):
    return aggregation.summary_dashboard(session, user.id)


@router.get("/reports")
def reports(user: CurrentUser, session: SessionDep):
    return aggregation.summary_reports(session, user.id)
