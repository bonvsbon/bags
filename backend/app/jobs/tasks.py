"""Scheduled job bodies. Each takes a Session so they are unit-testable."""
from datetime import date, datetime, timezone

from sqlmodel import Session, select

from app.models.finance import Bill, BillPayment, Budget
from app.models.insight import Notification
from app.models.profile import Settings
from app.models.user import User
from app.money import to_baht
from app.services import aggregation, insights


def _all_user_ids(session: Session) -> list[str]:
    return [u.id for u in session.exec(select(User)).all()]


def _settings(session: Session, uid: str) -> Settings:
    return session.get(Settings, uid) or Settings(user_id=uid)


def _notify(
    session: Session, uid: str, kind: str, title: str, body: str, today: date
) -> bool:
    """Create a notification unless an identical one already exists for `today`."""
    existing = session.exec(
        select(Notification).where(
            Notification.user_id == uid,
            Notification.kind == kind,
            Notification.title == title,
        )
    ).all()
    for n in existing:
        if n.scheduled_for and n.scheduled_for.date() == today:
            return False
    now = datetime.now(timezone.utc)
    session.add(Notification(
        user_id=uid, kind=kind, title=title, body=body,
        scheduled_for=datetime(today.year, today.month, today.day, tzinfo=timezone.utc),
        sent_at=now,
    ))
    return True


def run_bill_reminders(session: Session, today: date | None = None) -> int:
    today = today or date.today()
    period = today.strftime("%Y-%m")
    created = 0
    for uid in _all_user_ids(session):
        if not _settings(session, uid).notify_bills:
            continue
        paid = {
            p.bill_id for p in session.exec(
                select(BillPayment).where(BillPayment.period == period)
            ).all()
        }
        for b in session.exec(select(Bill).where(Bill.user_id == uid)).all():
            if b.id in paid:
                continue
            dd = insights._days_to_due(b.due_day, today)
            if dd is not None and dd <= b.remind_days:
                when = "วันนี้" if dd == 0 else f"ในอีก {dd} วัน"
                if _notify(session, uid, "bill_due", f"{b.name}ครบกำหนด{when}",
                           f"฿{to_baht(b.amount):,.0f}", today):
                    created += 1
    session.commit()
    return created


def run_budget_alerts(session: Session, today: date | None = None) -> int:
    today = today or date.today()
    period = today.strftime("%Y-%m")
    created = 0
    for uid in _all_user_ids(session):
        if not _settings(session, uid).notify_budget:
            continue
        for bu in aggregation.budget_usage(session, uid, period, today):
            if bu["over"]:
                if _notify(session, uid, "budget_alert", f"งบ{bu['category']}ใกล้เต็ม",
                           f"ใช้ไป {bu['ratio'] * 100:.0f}% ของงบ", today):
                    created += 1
    session.commit()
    return created


def run_weekly_summary(session: Session, today: date | None = None) -> int:
    today = today or date.today()
    created = 0
    for uid in _all_user_ids(session):
        if not _settings(session, uid).weekly_summary:
            continue
        # Last full week's expense total.
        bars = aggregation.weekly_bars(session, uid, today, weeks=1)
        spent = bars[0]["amount"] if bars else 0
        added = insights.refresh_insights(session, uid, today)
        created += added
        _notify(session, uid, "weekly_summary", "สรุปสัปดาห์นี้",
                f"ใช้จ่ายรวม ฿{spent:,.0f}", today)
    session.commit()
    return created


def run_month_rollover(session: Session, today: date | None = None) -> int:
    """Clone last month's budgets into the new month if none exist yet."""
    today = today or date.today()
    period = today.strftime("%Y-%m")
    py, pm = (today.year - 1, 12) if today.month == 1 else (today.year, today.month - 1)
    prev_period = f"{py:04d}-{pm:02d}"
    cloned = 0
    for uid in _all_user_ids(session):
        has_now = session.exec(
            select(Budget).where(Budget.user_id == uid, Budget.period == period)
        ).first()
        if has_now:
            continue
        for b in session.exec(
            select(Budget).where(Budget.user_id == uid, Budget.period == prev_period)
        ).all():
            session.add(Budget(user_id=uid, category_id=b.category_id,
                               period=period, limit_amount=b.limit_amount))
            cloned += 1
    session.commit()
    return cloned
