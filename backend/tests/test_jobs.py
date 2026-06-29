import uuid
from datetime import date

import pytest
from sqlmodel import Session, select

from app.db import engine
from app.jobs import tasks
from app.models.insight import Notification

API = "/api/v1"
TODAY = date(2026, 6, 15)


@pytest.fixture
def user(client):
    email = f"job-{uuid.uuid4().hex[:8]}@example.com"
    tok = client.post(
        f"{API}/auth/register", json={"email": email, "password": "supersecret"}
    ).json()
    h = {"Authorization": f"Bearer {tok['access']}"}
    uid = client.get(f"{API}/auth/me", headers=h).json()["id"]
    client.get(f"{API}/settings", headers=h)  # ensure default settings row
    return h, uid


def _notifs(session, uid, kind):
    return session.exec(
        select(Notification).where(
            Notification.user_id == uid, Notification.kind == kind
        )
    ).all()


def test_bill_reminder_dedupes(client, user):
    h, uid = user
    # due_day 17, today 15 -> 2 days out, within default remind_days=3
    client.post(f"{API}/bills", headers=h,
                json={"name": "เน็ต", "amount": 1200, "due_day": 17})
    with Session(engine) as s:
        c1 = tasks.run_bill_reminders(s, today=TODAY)
        c2 = tasks.run_bill_reminders(s, today=TODAY)  # same day -> no dupe
        n = _notifs(s, uid, "bill_due")
    assert c1 >= 1  # counts across all users in the shared test DB
    assert c2 == 0  # second run same day creates nothing new
    assert len(n) == 1  # exactly one for THIS user


def test_budget_alert_created(client, user):
    h, uid = user
    food = client.post(f"{API}/categories", headers=h,
                       json={"name": "อาหาร", "kind": "expense"}).json()
    client.post(f"{API}/transactions", headers=h,
                json={"type": "expense", "amount": 9000, "category_id": food["id"],
                      "occurred_at": "2026-06-10"})
    client.post(f"{API}/budgets", headers=h,
                json={"category_id": food["id"], "limit_amount": 8000, "period": "2026-06"})
    with Session(engine) as s:
        c = tasks.run_budget_alerts(s, today=TODAY)
        n = _notifs(s, uid, "budget_alert")
    assert c >= 1
    assert len(n) >= 1


def test_month_rollover_clones_budgets(client, user):
    h, uid = user
    food = client.post(f"{API}/categories", headers=h,
                       json={"name": "อาหาร", "kind": "expense"}).json()
    # budget in previous month (May 2026); rollover into June
    client.post(f"{API}/budgets", headers=h,
                json={"category_id": food["id"], "limit_amount": 8000, "period": "2026-05"})
    with Session(engine) as s:
        cloned = tasks.run_month_rollover(s, today=TODAY)
        again = tasks.run_month_rollover(s, today=TODAY)  # already exists -> 0
    assert cloned == 1
    assert again == 0
    lst = client.get(f"{API}/budgets?period=2026-06", headers=h).json()
    assert any(b["limit_amount"] == 8000.0 for b in lst)


def test_respects_notify_toggle(client, user):
    h, uid = user
    client.patch(f"{API}/settings", headers=h, json={"notify_bills": False})
    client.post(f"{API}/bills", headers=h,
                json={"name": "ค่าเช่า", "amount": 12000, "due_day": 16})
    with Session(engine) as s:
        tasks.run_bill_reminders(s, today=TODAY)
        n = _notifs(s, uid, "bill_due")
    assert len(n) == 0  # toggle off -> no notification for THIS user
