import uuid
from datetime import date

import pytest
from sqlmodel import Session

from app.db import engine
from app.services import aggregation

API = "/api/v1"
TODAY = date(2026, 6, 15)  # fixed: EOM payday -> 15 days left in June


@pytest.fixture
def ctx(client):
    """Register a user and build the reconciled demo scenario via the API."""
    email = f"sum-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(
        f"{API}/auth/register", json={"email": email, "password": "supersecret"}
    ).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    uid = client.get(f"{API}/auth/me", headers=h).json()["id"]

    # EOM payday
    client.patch(f"{API}/profile", headers=h, json={"pay_day": 0})
    # assets = 50,000
    client.post(f"{API}/accounts", headers=h,
                json={"name": "ธนาคาร", "type": "asset", "balance": 50000})
    # unpaid bills = 32,200
    for name, amt, day in [("เช่า", 12000, 1), ("รถ", 8500, 5), ("บัตร", 5000, 25),
                           ("เน็ต", 1200, 15), ("ประกัน", 3000, 20), ("น้ำไฟ", 2500, 28)]:
        client.post(f"{API}/bills", headers=h,
                    json={"name": name, "amount": amt, "due_day": day})
    # goal contribution = 5,000  -> reserved = 37,200
    client.post(f"{API}/goals", headers=h,
                json={"name": "เที่ยว", "target_amount": 60000, "saved_amount": 18000,
                      "monthly_contribution": 5000})
    # food category + this-month expense over budget
    food = client.post(f"{API}/categories", headers=h,
                       json={"name": "อาหาร", "kind": "expense"}).json()
    client.post(f"{API}/transactions", headers=h,
                json={"type": "income", "amount": 45000, "occurred_at": "2026-06-01"})
    client.post(f"{API}/transactions", headers=h,
                json={"type": "expense", "amount": 8900, "category_id": food["id"],
                      "occurred_at": "2026-06-10"})
    client.post(f"{API}/budgets", headers=h,
                json={"category_id": food["id"], "limit_amount": 8000, "period": "2026-06"})
    return h, uid


def test_detail_reconciles(ctx):
    _, uid = ctx
    with Session(engine) as s:
        d = aggregation.summary_detail(s, uid, today=TODAY)
    assert d["total_balance"] == 50000.0
    assert d["reserved_bills"] == 32200.0
    assert d["reserved_goals"] == 5000.0
    assert d["reserved"] == 37200.0
    assert d["available"] == 12800.0
    assert d["days_until_payday"] == 15
    assert d["daily_allowance"] == 853.33  # 1,280,000 satang // 15 = 85,333 -> ฿853.33
    # 6 unpaid bills + 1 goal line
    assert len(d["items"]) == 7


def test_home_month_in_out_and_watch(ctx):
    _, uid = ctx
    with Session(engine) as s:
        h = aggregation.summary_home(s, uid, today=TODAY)
    assert h["available"] == 12800.0
    assert h["month_in"] == 45000.0
    assert h["month_out"] == 8900.0
    assert len(h["upcoming_bills"]) == 3  # nearest 3 by due_day
    # food 8900 / 8000 = 1.11 -> over budget, shows in watch list
    assert any(b["category"] == "อาหาร" and b["over"] for b in h["watch_budgets"])
    assert h["goal"]["name"] == "เที่ยว"


def test_plan_budget_usage(ctx):
    _, uid = ctx
    with Session(engine) as s:
        p = aggregation.summary_plan(s, uid, today=TODAY)
    food = next(b for b in p["budgets"] if b["category"] == "อาหาร")
    assert food["used"] == 8900.0
    assert food["limit"] == 8000.0
    assert food["over"] is True
    assert "อาหาร" in p["tip"]


def test_reports_weekly_and_categories(ctx):
    _, uid = ctx
    with Session(engine) as s:
        r = aggregation.summary_reports(s, uid, today=TODAY)
    assert r["month_in"] == 45000.0
    assert r["month_out"] == 8900.0
    assert r["net"] == 36100.0
    assert len(r["weekly_bars"]) == 4
    assert r["by_category"][0]["category"] == "อาหาร"


def test_summary_endpoints_smoke(ctx, client):
    h, _ = ctx
    for path in ("home", "detail", "plan", "dashboard", "reports"):
        r = client.get(f"{API}/summary/{path}", headers=h)
        assert r.status_code == 200, path
