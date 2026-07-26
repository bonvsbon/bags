import uuid
from datetime import date

import pytest
from sqlmodel import Session

from app.db import engine
from app.services import aggregation as A

API = "/api/v1"


# ---------- pure date logic ----------
def test_next_payday_specific_future():
    assert A.next_payday(25, date(2026, 6, 10)) == date(2026, 6, 25)
    assert A.days_until_payday(25, date(2026, 6, 10)) == 15


def test_next_payday_specific_past_rolls_next_month():
    assert A.next_payday(5, date(2026, 6, 10)) == date(2026, 7, 5)


def test_next_payday_eom():
    assert A.next_payday(0, date(2026, 6, 10)) == date(2026, 6, 30)
    assert A.days_until_payday(0, date(2026, 6, 15)) == 15
    # on the last day -> roll to next month's last day
    assert A.next_payday(0, date(2026, 6, 30)) == date(2026, 7, 31)


def test_next_payday_year_boundary():
    assert A.next_payday(5, date(2026, 12, 10)) == date(2027, 1, 5)


def test_payday_today_rolls_to_next_month():
    assert A.next_payday(10, date(2026, 6, 10)) == date(2026, 7, 10)


def test_payday_clamped_to_short_month():
    assert A.next_payday(31, date(2026, 2, 10)) == date(2026, 2, 28)


def test_days_until_payday_min_one():
    # day equals today -> rolls forward, never 0/negative
    assert A.days_until_payday(10, date(2026, 6, 10)) >= 1


# ---------- scenario-based (real data via API, fixed `today`) ----------
TODAY = date(2026, 6, 15)


@pytest.fixture
def scenario(client):
    email = f"agg-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(f"{API}/auth/register", json={"email": email, "password": "supersecret"}).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    uid = client.get(f"{API}/auth/me", headers=h).json()["id"]
    client.patch(f"{API}/profile", headers=h, json={"pay_day": 0})
    client.post(f"{API}/accounts", headers=h, json={"name": "ธนาคาร", "type": "asset", "balance": 50000})
    for amt in (12000, 8500, 5000, 1200, 3000, 2500):  # 32,200
        client.post(f"{API}/bills", headers=h, json={"name": f"bill{amt}", "amount": amt, "due_day": 10})
    client.post(f"{API}/goals", headers=h, json={"name": "g", "target_amount": 60000, "monthly_contribution": 5000})
    food = client.post(f"{API}/categories", headers=h, json={"name": "อาหาร", "kind": "expense"}).json()
    travel = client.post(f"{API}/categories", headers=h, json={"name": "เดินทาง", "kind": "expense"}).json()
    client.post(f"{API}/transactions", headers=h, json={"type": "income", "amount": 45000, "occurred_at": "2026-06-01"})
    client.post(f"{API}/transactions", headers=h, json={"type": "expense", "amount": 8900, "category_id": food["id"], "occurred_at": "2026-06-10"})
    client.post(f"{API}/transactions", headers=h, json={"type": "expense", "amount": 1200, "category_id": travel["id"], "occurred_at": "2026-06-09"})
    client.post(f"{API}/budgets", headers=h, json={"category_id": food["id"], "limit_amount": 8000, "period": "2026-06"})
    client.post(f"{API}/budgets", headers=h, json={"category_id": travel["id"], "limit_amount": 3500, "period": "2026-06"})
    return h, uid


def test_core_figures(scenario):
    _, uid = scenario
    with Session(engine) as s:
        assert A.total_balance(s, uid) == 50000 * 100
        rb, rg = A.reserved_parts(s, uid, "2026-06")
        assert rb == 32200 * 100
        assert rg == 5000 * 100
        inc, out = A.month_in_out(s, uid, TODAY)
        assert inc == 45000 * 100
        assert out == (8900 + 1200) * 100


def test_budget_usage_over_flag(scenario):
    _, uid = scenario
    with Session(engine) as s:
        budgets = {b["category"]: b for b in A.budget_usage(s, uid, "2026-06", TODAY)}
    assert budgets["อาหาร"]["over"] is True   # 8900/8000 = 1.11
    assert budgets["เดินทาง"]["over"] is False  # 1200/3500 = 0.34


def test_weekly_bars_shape(scenario):
    _, uid = scenario
    with Session(engine) as s:
        bars = A.weekly_bars(s, uid, TODAY, weeks=4)
    assert len(bars) == 4
    assert all("week_start" in b and "amount" in b for b in bars)
    assert sum(b["amount"] for b in bars) > 0  # the June expenses land somewhere


def test_spend_by_category_sorted(scenario):
    _, uid = scenario
    with Session(engine) as s:
        rows = A.spend_by_category(s, uid, TODAY)
    assert rows[0]["category"] == "อาหาร"           # biggest first
    assert rows[0]["amount"] >= rows[-1]["amount"]
    assert abs(sum(r["ratio"] for r in rows) - 1.0) < 0.01


def test_daily_allowance_clamped_when_overcommitted(client):
    email = f"neg-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(f"{API}/auth/register", json={"email": email, "password": "supersecret"}).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    uid = client.get(f"{API}/auth/me", headers=h).json()["id"]
    client.post(f"{API}/accounts", headers=h, json={"name": "a", "type": "asset", "balance": 1000})
    client.post(f"{API}/bills", headers=h, json={"name": "big", "amount": 5000, "due_day": 20})
    with Session(engine) as s:
        d = A.summary_detail(s, uid, today=TODAY)
    assert d["available"] == -4000.0           # 1000 - 5000
    assert d["daily_allowance"] == 0.0          # clamped, never negative
