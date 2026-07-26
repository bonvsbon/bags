import uuid
from datetime import date

import pytest
from sqlmodel import Session

from app.db import engine
from app.services import insights as engine_mod

API = "/api/v1"
TODAY = date(2026, 6, 15)


@pytest.fixture
def user(client):
    email = f"ins-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(
        f"{API}/auth/register", json={"email": email, "password": "supersecret"}
    ).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    uid = client.get(f"{API}/auth/me", headers=h).json()["id"]
    return h, uid


def test_budget_over_and_bill_due_insights(client, user):
    h, uid = user
    food = client.post(f"{API}/categories", headers=h,
                       json={"name": "อาหาร", "kind": "expense"}).json()
    # over budget this month
    client.post(f"{API}/transactions", headers=h,
                json={"type": "expense", "amount": 8900, "category_id": food["id"],
                      "occurred_at": "2026-06-10"})
    client.post(f"{API}/budgets", headers=h,
                json={"category_id": food["id"], "limit_amount": 8000, "period": "2026-06"})
    # bill due within 3 days of TODAY (15) -> due_day 17
    client.post(f"{API}/bills", headers=h,
                json={"name": "เน็ต", "amount": 1200, "due_day": 17})

    with Session(engine) as s:
        found = engine_mod.evaluate(s, uid, today=TODAY)
    types = {c["type"] for c in found}
    assert "budget_near" in types
    assert "bill_due" in types


def test_refresh_dedupes_and_endpoint(client, user):
    h, uid = user
    food = client.post(f"{API}/categories", headers=h,
                       json={"name": "อาหาร", "kind": "expense"}).json()
    client.post(f"{API}/transactions", headers=h,
                json={"type": "expense", "amount": 9000, "category_id": food["id"],
                      "occurred_at": date.today().isoformat()})
    client.post(f"{API}/budgets", headers=h,
                json={"category_id": food["id"], "limit_amount": 8000})

    with Session(engine) as s:
        a1 = engine_mod.refresh_insights(s, uid)
        a2 = engine_mod.refresh_insights(s, uid)  # same period -> no dupes
    assert a1 >= 1
    assert a2 == 0

    lst = client.get(f"{API}/insights", headers=h).json()
    assert len(lst) >= 1
    iid = lst[0]["id"]
    r = client.post(f"{API}/insights/{iid}/read", headers=h)
    assert r.status_code == 204
    after = client.get(f"{API}/insights?refresh=false", headers=h).json()
    assert next(i for i in after if i["id"] == iid)["read_at"] is not None
