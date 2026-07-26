import uuid

import pytest

API = "/api/v1"


@pytest.fixture
def acct(client):
    """Fresh user with one asset account holding ฿10,000."""
    email = f"led-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(f"{API}/auth/register", json={"email": email, "password": "supersecret"}).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    a = client.post(f"{API}/accounts", headers=h, json={"name": "หลัก", "type": "asset", "balance": 10000}).json()
    return h, a["id"]


def _balance(client, h, account_id):
    return client.get(f"{API}/accounts/{account_id}", headers=h).json()["balance"]


def test_expense_reduces_balance(client, acct):
    h, aid = acct
    client.post(f"{API}/transactions", headers=h, json={"type": "expense", "amount": 1500, "account_id": aid})
    assert _balance(client, h, aid) == 8500.0


def test_income_increases_balance(client, acct):
    h, aid = acct
    client.post(f"{API}/transactions", headers=h, json={"type": "income", "amount": 2000, "account_id": aid})
    assert _balance(client, h, aid) == 12000.0


def test_no_account_leaves_balances_untouched(client, acct):
    h, aid = acct
    client.post(f"{API}/transactions", headers=h, json={"type": "expense", "amount": 999})
    assert _balance(client, h, aid) == 10000.0


def test_delete_reverses_balance(client, acct):
    h, aid = acct
    t = client.post(f"{API}/transactions", headers=h, json={"type": "expense", "amount": 1500, "account_id": aid}).json()
    assert _balance(client, h, aid) == 8500.0
    client.delete(f"{API}/transactions/{t['id']}", headers=h)
    assert _balance(client, h, aid) == 10000.0


def test_patch_amount_adjusts_balance(client, acct):
    h, aid = acct
    t = client.post(f"{API}/transactions", headers=h, json={"type": "expense", "amount": 1000, "account_id": aid}).json()
    assert _balance(client, h, aid) == 9000.0
    client.patch(f"{API}/transactions/{t['id']}", headers=h, json={"amount": 1500})
    assert _balance(client, h, aid) == 8500.0  # extra 500 spent


def test_patch_account_moves_money(client, acct):
    h, aid = acct
    b = client.post(f"{API}/accounts", headers=h, json={"name": "สอง", "type": "asset", "balance": 5000}).json()
    t = client.post(f"{API}/transactions", headers=h, json={"type": "expense", "amount": 1000, "account_id": aid}).json()
    assert _balance(client, h, aid) == 9000.0
    client.patch(f"{API}/transactions/{t['id']}", headers=h, json={"account_id": b["id"]})
    assert _balance(client, h, aid) == 10000.0  # refunded to first
    assert _balance(client, h, b["id"]) == 4000.0  # charged to second


def test_pay_bill_deducts_balance_and_keeps_available_stable(client, acct):
    h, aid = acct
    # available before = balance(10000) - reserved(bill 4000) = 6000
    bill = client.post(f"{API}/bills", headers=h, json={"name": "ค่าเช่า", "amount": 4000, "due_day": 20}).json()
    before = client.get(f"{API}/summary/detail", headers=h).json()
    assert before["available"] == 6000.0

    pay = client.post(f"{API}/bills/{bill['id']}/pay", headers=h)
    assert pay.status_code == 200
    assert _balance(client, h, aid) == 6000.0  # money actually left the account

    after = client.get(f"{API}/summary/detail", headers=h).json()
    assert after["available"] == 6000.0  # unchanged: paying a bill doesn't create money
    assert after["reserved"] == 0.0
    # an expense transaction was recorded
    txns = client.get(f"{API}/transactions", headers=h).json()
    assert any(t["note"] == "ค่าเช่า" and t["amount"] == 4000.0 for t in txns)


def test_pay_bill_without_account_just_marks_paid(client):
    email = f"led2-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(f"{API}/auth/register", json={"email": email, "password": "supersecret"}).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    bill = client.post(f"{API}/bills", headers=h, json={"name": "x", "amount": 500, "due_day": 20}).json()
    pay = client.post(f"{API}/bills/{bill['id']}/pay", headers=h)
    assert pay.status_code == 200
    assert pay.json()["paid_this_period"] is True
    assert client.get(f"{API}/transactions", headers=h).json() == []
