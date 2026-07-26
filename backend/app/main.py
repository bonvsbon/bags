from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    accounts,
    ai,
    auth,
    bills,
    budgets,
    categories,
    goals,
    insights,
    onboarding,
    profile,
    summary,
    transactions,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.enable_scheduler:
        from app.jobs import scheduler
        scheduler.start()
        try:
            yield
        finally:
            scheduler.shutdown()
    else:
        yield


app = FastAPI(
    title="เงินทอน (Ngern Thon) API",
    version="0.1.0",
    description="Backend for the Ngern Thon personal-finance app",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


for r in (
    auth.router,
    profile.router,
    onboarding.router,
    accounts.router,
    categories.router,
    transactions.router,
    bills.router,
    budgets.router,
    goals.router,
    summary.router,
    insights.router,
    ai.router,
):
    app.include_router(r, prefix="/api/v1")


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "app": "ngern-thon", "version": app.version}
