"""9.1 — the AI snapshot must mirror aggregation exactly (grounding, no re-math)."""
import uuid
from datetime import date

import pytest
from sqlmodel import Session

from app.db import engine
from app.services import ai_context, aggregation
from app.services.prompts import build_system

API = "/api/v1"
TODAY = date(2026, 6, 15)  # EOM payday -> 15 days left in June


@pytest.fixture
def ctx(client):
    """Same reconciled demo scenario as test_summary (available = 12,800)."""
    email = f"ai-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(
        f"{API}/auth/register", json={"email": email, "password": "supersecret"}
    ).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    uid = client.get(f"{API}/auth/me", headers=h).json()["id"]

    client.patch(f"{API}/profile", headers=h, json={"pay_day": 0})
    client.post(f"{API}/accounts", headers=h,
                json={"name": "ธนาคาร", "type": "asset", "balance": 50000})
    for name, amt, day in [("เช่า", 12000, 1), ("รถ", 8500, 5), ("บัตร", 5000, 25),
                           ("เน็ต", 1200, 15), ("ประกัน", 3000, 20), ("น้ำไฟ", 2500, 28)]:
        client.post(f"{API}/bills", headers=h,
                    json={"name": name, "amount": amt, "due_day": day})
    client.post(f"{API}/goals", headers=h,
                json={"name": "เที่ยว", "target_amount": 60000, "saved_amount": 18000,
                      "monthly_contribution": 5000})
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


def test_snapshot_numbers_match_aggregation(ctx):
    _, uid = ctx
    with Session(engine) as s:
        snap = ai_context.build_snapshot(s, uid, today=TODAY)
        home = aggregation.summary_home(s, uid, today=TODAY)
    # Every money figure is taken verbatim from aggregation — never recomputed.
    assert snap["available"] == home["available"] == 12800.0
    assert snap["total_balance"] == 50000.0
    assert snap["reserved"] == 37200.0
    assert snap["days_until_payday"] == 15
    assert snap["month_in"] == 45000.0
    assert snap["month_out"] == 8900.0
    assert snap["goal"]["name"] == "เที่ยว"


def test_context_string_includes_key_figures(ctx):
    _, uid = ctx
    with Session(engine) as s:
        snap = ai_context.build_snapshot(s, uid, today=TODAY)
    text = ai_context.snapshot_to_context(snap)
    assert "12,800" in text          # available
    assert "15 วัน" in text          # days until payday
    assert "เที่ยว" in text          # goal name


def test_build_system_carries_guardrail_and_context(ctx):
    _, uid = ctx
    with Session(engine) as s:
        snap = ai_context.build_snapshot(s, uid, today=TODAY)
    system = build_system(ai_context.snapshot_to_context(snap))
    assert "ลงทุน" in system          # investment refusal guardrail present
    assert "12,800" in system         # grounded snapshot injected
