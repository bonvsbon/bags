import uuid

import pytest

API = "/api/v1"


@pytest.fixture
def auth_headers(client):
    # Unique email per test — the test DB is shared across the session.
    email = f"crud-{uuid.uuid4().hex[:8]}@example.com"
    r = client.post(
        f"{API}/auth/register", json={"email": email, "password": "supersecret"}
    )
    return {"Authorization": f"Bearer {r.json()['access']}"}


def test_profile_and_settings(client, auth_headers):
    # auto-created default
    p = client.get(f"{API}/profile", headers=auth_headers)
    assert p.status_code == 200
    assert p.json()["monthly_income"] == 0

    upd = client.patch(
        f"{API}/profile",
        headers=auth_headers,
        json={"display_name": "บอล", "monthly_income": 45000, "pay_day": 0},
    )
    assert upd.json()["display_name"] == "บอล"
    assert upd.json()["monthly_income"] == 45000.0

    s = client.patch(
        f"{API}/settings", headers=auth_headers, json={"theme": "midnight"}
    )
    assert s.json()["theme"] == "midnight"


def test_accounts_crud(client, auth_headers):
    c = client.post(
        f"{API}/accounts",
        headers=auth_headers,
        json={"name": "ธนาคารหลัก", "type": "asset", "kind": "bank", "balance": 38000},
    )
    assert c.status_code == 201
    aid = c.json()["id"]
    assert c.json()["balance"] == 38000.0

    lst = client.get(f"{API}/accounts", headers=auth_headers)
    assert len(lst.json()) == 1

    u = client.patch(
        f"{API}/accounts/{aid}", headers=auth_headers, json={"balance": 40000}
    )
    assert u.json()["balance"] == 40000.0

    d = client.delete(f"{API}/accounts/{aid}", headers=auth_headers)
    assert d.status_code == 204
    assert client.get(f"{API}/accounts/{aid}", headers=auth_headers).status_code == 404


def test_transactions_filter_and_group(client, auth_headers):
    cat = client.post(
        f"{API}/categories",
        headers=auth_headers,
        json={"name": "อาหาร", "kind": "expense"},
    ).json()
    for amt, day in [(100, "2026-06-01"), (250, "2026-06-01"), (90, "2026-06-02")]:
        client.post(
            f"{API}/transactions",
            headers=auth_headers,
            json={"type": "expense", "amount": amt, "category_id": cat["id"],
                  "occurred_at": day},
        )
    # plain list
    flat = client.get(f"{API}/transactions", headers=auth_headers).json()
    assert len(flat) == 3
    # filter by type
    inc = client.get(f"{API}/transactions?type=income", headers=auth_headers).json()
    assert inc == []
    # grouped by day
    grouped = client.get(
        f"{API}/transactions?group_by=day", headers=auth_headers
    ).json()
    assert len(grouped) == 2  # two distinct days
    assert grouped[0]["date"] == "2026-06-02"  # newest first


def test_bills_pay_idempotent(client, auth_headers):
    b = client.post(
        f"{API}/bills",
        headers=auth_headers,
        json={"name": "ค่าเช่าห้อง", "amount": 12000, "due_day": 1},
    ).json()
    assert b["paid_this_period"] is False

    pay = client.post(f"{API}/bills/{b['id']}/pay", headers=auth_headers)
    assert pay.status_code == 200
    assert pay.json()["paid_this_period"] is True

    again = client.post(f"{API}/bills/{b['id']}/pay", headers=auth_headers)
    assert again.status_code == 409  # already paid this period


def test_goals_contribute(client, auth_headers):
    g = client.post(
        f"{API}/goals",
        headers=auth_headers,
        json={"name": "เที่ยวญี่ปุ่น", "target_amount": 60000, "saved_amount": 18000,
              "monthly_contribution": 5000},
    ).json()
    assert g["saved_amount"] == 18000.0

    c = client.post(
        f"{API}/goals/{g['id']}/contribute", headers=auth_headers, json={"amount": 2000}
    )
    assert c.json()["saved_amount"] == 20000.0


def test_budget_upsert(client, auth_headers):
    cat = client.post(
        f"{API}/categories",
        headers=auth_headers,
        json={"name": "เดินทาง", "kind": "expense"},
    ).json()
    b1 = client.post(
        f"{API}/budgets",
        headers=auth_headers,
        json={"category_id": cat["id"], "limit_amount": 3000, "period": "2026-06"},
    )
    assert b1.status_code == 201
    # same (category, period) upserts, not duplicates
    b2 = client.post(
        f"{API}/budgets",
        headers=auth_headers,
        json={"category_id": cat["id"], "limit_amount": 3500, "period": "2026-06"},
    )
    assert b2.json()["limit_amount"] == 3500.0
    lst = client.get(f"{API}/budgets?period=2026-06", headers=auth_headers).json()
    assert len(lst) == 1


def test_onboarding_creates_bills(client, auth_headers):
    r = client.post(
        f"{API}/onboarding",
        headers=auth_headers,
        json={
            "pay_day": 0,
            "monthly_income": 45000,
            "primary_goal": "save",
            "recurring": [
                {"name": "ค่าเช่า", "amount": 12000, "due_day": 1},
                {"name": "เน็ต", "amount": 1200, "due_day": 15},
            ],
        },
    )
    assert r.json()["bills_created"] == 2
    bills = client.get(f"{API}/bills", headers=auth_headers).json()
    assert len(bills) == 2
    prof = client.get(f"{API}/profile", headers=auth_headers).json()
    assert prof["primary_goal"] == "save"
    assert prof["monthly_income"] == 45000.0


def test_tenant_isolation(client):
    # user A creates an account
    a = client.post(
        f"{API}/auth/register",
        json={"email": "a@example.com", "password": "supersecret"},
    ).json()
    acc = client.post(
        f"{API}/accounts",
        headers={"Authorization": f"Bearer {a['access']}"},
        json={"name": "A bank", "balance": 100},
    ).json()
    # user B cannot see or fetch it
    b = client.post(
        f"{API}/auth/register",
        json={"email": "b@example.com", "password": "supersecret"},
    ).json()
    bh = {"Authorization": f"Bearer {b['access']}"}
    assert client.get(f"{API}/accounts", headers=bh).json() == []
    assert client.get(f"{API}/accounts/{acc['id']}", headers=bh).status_code == 404
