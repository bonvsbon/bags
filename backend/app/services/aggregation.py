"""Read-only aggregation per §5. Internals work in satang; outputs are baht dicts."""
import calendar
from datetime import date, timedelta

from sqlmodel import Session, select

from app.models.finance import (
    Account,
    Bill,
    BillPayment,
    Budget,
    Category,
    Goal,
    Transaction,
)
from app.models.profile import Profile
from app.money import to_baht


# ---------- date helpers ----------
def _eom(y: int, m: int) -> int:
    return calendar.monthrange(y, m)[1]


def month_bounds(today: date) -> tuple[date, date]:
    return today.replace(day=1), date(today.year, today.month, _eom(today.year, today.month))


def next_payday(pay_day: int, today: date) -> date:
    def on(y: int, m: int) -> date:
        day = _eom(y, m) if pay_day in (0, 32) else min(pay_day, _eom(y, m))
        return date(y, m, day)

    cand = on(today.year, today.month)
    if cand > today:
        return cand
    nm, ny = (1, today.year + 1) if today.month == 12 else (today.month + 1, today.year)
    return on(ny, nm)


def days_until_payday(pay_day: int, today: date) -> int:
    return max((next_payday(pay_day, today) - today).days, 1)


def _due_key(b: Bill) -> int:
    # Sort bills by day-of-month; 0/32 mean "end of month" → sort last, not first.
    return b.due_day if 1 <= b.due_day <= 31 else 31


# ---------- core money figures (satang) ----------
def total_balance(session: Session, uid: str) -> int:
    return sum(
        a.balance for a in session.exec(
            select(Account).where(Account.user_id == uid, Account.type == "asset")
        ).all()
    )


def unpaid_bills(session: Session, uid: str, period: str) -> list[Bill]:
    paid_ids = {
        p.bill_id for p in session.exec(
            select(BillPayment).where(BillPayment.period == period)
        ).all()
    }
    return [
        b for b in session.exec(select(Bill).where(Bill.user_id == uid)).all()
        if b.id not in paid_ids
    ]


def reserved_parts(session: Session, uid: str, period: str) -> tuple[int, int]:
    bills = sum(b.amount for b in unpaid_bills(session, uid, period))
    goals = sum(
        g.monthly_contribution or 0
        for g in session.exec(select(Goal).where(Goal.user_id == uid)).all()
    )
    return bills, goals


def month_in_out(session: Session, uid: str, today: date) -> tuple[int, int]:
    start, end = month_bounds(today)
    rows = session.exec(
        select(Transaction).where(
            Transaction.user_id == uid,
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
    ).all()
    inc = sum(t.amount for t in rows if t.type == "income")
    out = sum(t.amount for t in rows if t.type == "expense")
    return inc, out


def _category_map(session: Session, uid: str) -> dict[str, Category]:
    rows = session.exec(
        select(Category).where((Category.user_id == uid) | (Category.user_id == None))  # noqa: E711
    ).all()
    return {c.id: c for c in rows}


def budget_usage(session: Session, uid: str, period: str, today: date) -> list[dict]:
    start, end = month_bounds(today)
    txns = session.exec(
        select(Transaction).where(
            Transaction.user_id == uid,
            Transaction.type == "expense",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
    ).all()
    used_by_cat: dict[str, int] = {}
    for t in txns:
        if t.category_id:
            used_by_cat[t.category_id] = used_by_cat.get(t.category_id, 0) + t.amount
    cats = _category_map(session, uid)
    out = []
    for b in session.exec(
        select(Budget).where(Budget.user_id == uid, Budget.period == period)
    ).all():
        used = used_by_cat.get(b.category_id, 0)
        cat = cats.get(b.category_id)
        ratio = round(used / b.limit_amount, 3) if b.limit_amount else 0
        out.append({
            "category_id": b.category_id,
            "category": cat.name if cat else "",
            "icon": cat.icon if cat else None,
            "used": to_baht(used),
            "limit": to_baht(b.limit_amount),
            "ratio": ratio,
            "over": ratio >= 0.8,
        })
    return out


def weekly_bars(session: Session, uid: str, today: date, weeks: int = 4) -> list[dict]:
    # Monday-anchored weeks, oldest -> newest.
    this_monday = today - timedelta(days=today.weekday())
    bars = []
    for i in range(weeks - 1, -1, -1):
        ws = this_monday - timedelta(weeks=i)
        we = ws + timedelta(days=6)
        amt = sum(
            t.amount for t in session.exec(
                select(Transaction).where(
                    Transaction.user_id == uid,
                    Transaction.type == "expense",
                    Transaction.occurred_at >= ws,
                    Transaction.occurred_at <= we,
                )
            ).all()
        )
        bars.append({"week_start": ws.isoformat(), "amount": to_baht(amt)})
    return bars


def spend_by_category(session: Session, uid: str, today: date) -> list[dict]:
    start, end = month_bounds(today)
    txns = session.exec(
        select(Transaction).where(
            Transaction.user_id == uid,
            Transaction.type == "expense",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
    ).all()
    by: dict[str, int] = {}
    for t in txns:
        key = t.category_id or "_none"
        by[key] = by.get(key, 0) + t.amount
    total = sum(by.values()) or 1
    cats = _category_map(session, uid)
    rows = [
        {
            "category_id": cid if cid != "_none" else None,
            "category": cats[cid].name if cid in cats else "อื่น ๆ",
            "icon": cats[cid].icon if cid in cats else "•",
            "amount": to_baht(amt),
            "ratio": round(amt / total, 3),
        }
        for cid, amt in by.items()
    ]
    return sorted(rows, key=lambda r: r["amount"], reverse=True)


# ---------- helpers for shared pieces ----------
def _recent_txns(session: Session, uid: str, limit: int = 5) -> list[dict]:
    cats = _category_map(session, uid)
    rows = session.exec(
        select(Transaction).where(Transaction.user_id == uid).order_by(
            Transaction.occurred_at.desc(), Transaction.created_at.desc()
        ).limit(limit)
    ).all()
    out = []
    for t in rows:
        cat = cats.get(t.category_id) if t.category_id else None
        out.append({
            "id": t.id, "type": t.type, "amount": to_baht(t.amount),
            "note": t.note, "category": cat.name if cat else None,
            "icon": cat.icon if cat else None, "occurred_at": t.occurred_at.isoformat(),
        })
    return out


def _top_goal(session: Session, uid: str) -> dict | None:
    g = session.exec(select(Goal).where(Goal.user_id == uid)).first()
    if not g:
        return None
    ratio = round(g.saved_amount / g.target_amount, 3) if g.target_amount else 0
    return {
        "id": g.id, "name": g.name, "icon": g.icon, "icon_bg": g.icon_bg,
        "saved": to_baht(g.saved_amount), "target": to_baht(g.target_amount),
        "ratio": ratio,
    }


def _profile(session: Session, uid: str) -> Profile:
    p = session.get(Profile, uid)
    return p or Profile(user_id=uid)


# ---------- screen payloads (baht) ----------
def summary_detail(session: Session, uid: str, today: date | None = None) -> dict:
    today = today or date.today()
    period = today.strftime("%Y-%m")
    total = total_balance(session, uid)
    rb, rg = reserved_parts(session, uid, period)
    reserved = rb + rg
    available = total - reserved
    days = days_until_payday(_profile(session, uid).pay_day, today)
    cats = _category_map(session, uid)
    items = [
        {"label": b.name, "icon": b.icon, "amount": to_baht(b.amount)}
        for b in sorted(unpaid_bills(session, uid, period), key=_due_key)
    ]
    goal_total = sum(
        g.monthly_contribution or 0
        for g in session.exec(select(Goal).where(Goal.user_id == uid)).all()
    )
    if goal_total:
        items.append({"label": "เงินเข้าเป้าหมาย", "icon": "🎯", "amount": to_baht(goal_total)})
    return {
        "total_balance": to_baht(total),
        "reserved_bills": to_baht(rb),
        "reserved_goals": to_baht(rg),
        "reserved": to_baht(reserved),
        "available": to_baht(available),
        "days_until_payday": days,
        "daily_allowance": to_baht(max(available, 0) // max(days, 1)),
        "items": items,
    }


def summary_home(session: Session, uid: str, today: date | None = None) -> dict:
    today = today or date.today()
    period = today.strftime("%Y-%m")
    total = total_balance(session, uid)
    rb, rg = reserved_parts(session, uid, period)
    available = total - rb - rg
    days = days_until_payday(_profile(session, uid).pay_day, today)
    inc, out = month_in_out(session, uid, today)
    upcoming = [
        {"name": b.name, "icon": b.icon, "amount": to_baht(b.amount), "due_day": b.due_day}
        for b in sorted(unpaid_bills(session, uid, period), key=_due_key)[:3]
    ]
    watch = [b for b in budget_usage(session, uid, period, today) if b["over"]]
    return {
        "available": to_baht(available),
        "total_balance": to_baht(total),
        "reserved": to_baht(rb + rg),
        "days_until_payday": days,
        "daily_allowance": to_baht(max(available, 0) // max(days, 1)),
        "month_in": to_baht(inc),
        "month_out": to_baht(out),
        "upcoming_bills": upcoming,
        "watch_budgets": watch,
        "recent_txns": _recent_txns(session, uid),
        "goal": _top_goal(session, uid),
    }


def summary_plan(session: Session, uid: str, today: date | None = None) -> dict:
    today = today or date.today()
    period = today.strftime("%Y-%m")
    total = total_balance(session, uid)
    rb, rg = reserved_parts(session, uid, period)
    available = total - rb - rg
    days = days_until_payday(_profile(session, uid).pay_day, today)
    budgets = budget_usage(session, uid, period, today)
    over = [b for b in budgets if b["over"]]
    if over:
        tip = f"ระวังงบ {over[0]['category']} ใกล้เต็มแล้ว ลองคุมอีกนิด"
    else:
        tip = "เยี่ยม! ทุกงบยังอยู่ในแผน"
    return {
        "available": to_baht(available),
        "days_until_payday": days,
        "daily_allowance": to_baht(max(available, 0) // max(days, 1)),
        "budgets": budgets,
        "tip": tip,
    }


def summary_dashboard(session: Session, uid: str, today: date | None = None) -> dict:
    today = today or date.today()
    period = today.strftime("%Y-%m")
    total = total_balance(session, uid)
    rb, rg = reserved_parts(session, uid, period)
    available = total - rb - rg
    inc, out = month_in_out(session, uid, today)
    return {
        "available": to_baht(available),
        "total_balance": to_baht(total),
        "month_in": to_baht(inc),
        "month_out": to_baht(out),
        "weekly_bars": weekly_bars(session, uid, today),
        "watch_budgets": [b for b in budget_usage(session, uid, period, today) if b["over"]],
        "recent_txns": _recent_txns(session, uid),
        "goal": _top_goal(session, uid),
    }


def summary_reports(session: Session, uid: str, today: date | None = None) -> dict:
    today = today or date.today()
    inc, out = month_in_out(session, uid, today)
    return {
        "month_in": to_baht(inc),
        "month_out": to_baht(out),
        "net": to_baht(inc - out),
        "weekly_bars": weekly_bars(session, uid, today),
        "by_category": spend_by_category(session, uid, today),
    }
