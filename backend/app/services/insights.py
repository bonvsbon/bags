"""Rule-based, deterministic insight engine (§5). Pure evaluate + persist helper."""
from datetime import date

from sqlmodel import Session, select

from app.models.finance import Bill, BillPayment, Transaction
from app.models.insight import Insight
from app.money import to_baht
from app.services import aggregation


def _prev_month(year: int, month: int) -> tuple[int, int]:
    return (year - 1, 12) if month == 1 else (year, month - 1)


def _expense_by_cat(session: Session, uid: str, year: int, month: int) -> dict[str, int]:
    start = date(year, month, 1)
    end = date(year, month, aggregation._eom(year, month))
    rows = session.exec(
        select(Transaction).where(
            Transaction.user_id == uid,
            Transaction.type == "expense",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
    ).all()
    by: dict[str, int] = {}
    for t in rows:
        if t.category_id:
            by[t.category_id] = by.get(t.category_id, 0) + t.amount
    return by


def _month_expense(session: Session, uid: str, year: int, month: int) -> int:
    return sum(_expense_by_cat(session, uid, year, month).values())


def _days_to_due(due_day: int, today: date) -> int | None:
    last = aggregation._eom(today.year, today.month)
    target = last if due_day in (0, 32) else min(due_day, last)
    return target - today.day if target >= today.day else None


def evaluate(session: Session, uid: str, today: date | None = None) -> list[dict]:
    today = today or date.today()
    period = today.strftime("%Y-%m")
    out: list[dict] = []
    cats = aggregation._category_map(session, uid)

    # 1) Category spend above its 3-month norm (> 1.1×)
    this_by = _expense_by_cat(session, uid, today.year, today.month)
    months = []
    y, m = today.year, today.month
    for _ in range(3):
        y, m = _prev_month(y, m)
        months.append(_expense_by_cat(session, uid, y, m))
    for cid, spend in this_by.items():
        hist = [mm.get(cid, 0) for mm in months]
        avg = sum(hist) / len(hist) if hist else 0
        if avg > 0 and spend > 1.1 * avg:
            name = cats[cid].name if cid in cats else "หมวดนี้"
            out.append({
                "type": "category_over", "severity": "warn", "period": period,
                "title": f"ค่า{name}สูงกว่าปกติ",
                "body": f"เดือนนี้ใช้ {to_baht(spend):,.0f} (ปกติ ~{to_baht(int(avg)):,.0f}) +฿{to_baht(int(spend - avg)):,.0f}",
            })

    # 2) Compare total spend vs previous month
    out_now = sum(this_by.values())
    py, pm = _prev_month(today.year, today.month)
    out_prev = _month_expense(session, uid, py, pm)
    if out_prev > 0:
        diff = (out_now - out_prev) / out_prev
        if abs(diff) >= 0.1:
            if diff < 0:
                out.append({
                    "type": "month_compare", "severity": "good", "period": period,
                    "title": f"ใช้จ่ายน้อยกว่าเดือนก่อน {abs(diff) * 100:.0f}%",
                    "body": "ทำได้ดีมาก รักษาไว้แบบนี้",
                })
            else:
                out.append({
                    "type": "month_compare", "severity": "warn", "period": period,
                    "title": f"ใช้จ่ายมากกว่าเดือนก่อน {diff * 100:.0f}%",
                    "body": "ลองดูว่าหมวดไหนเพิ่มขึ้น",
                })

    # 3) Budgets near/over limit (used/limit ≥ 0.8)
    for b in aggregation.budget_usage(session, uid, period, today):
        if b["over"]:
            out.append({
                "type": "budget_near", "severity": "warn", "period": period,
                "title": f"งบ{b['category']}ใกล้เต็ม",
                "body": f"ใช้ไป ฿{b['used']:,.0f} จาก ฿{b['limit']:,.0f} ({b['ratio'] * 100:.0f}%)",
            })

    # 4) Pace: projected remaining spend > available -> suggest daily cut
    total = aggregation.total_balance(session, uid)
    rb, rg = aggregation.reserved_parts(session, uid, period)
    available = total - rb - rg
    days_left = aggregation.days_until_payday(
        aggregation._profile(session, uid).pay_day, today
    )
    if today.day > 0:
        daily_rate = out_now / today.day
        projected_remaining = daily_rate * days_left
        if projected_remaining > available and days_left > 0:
            cut = int((projected_remaining - available) / days_left)
            out.append({
                "type": "pace", "severity": "warn", "period": period,
                "title": f"ลองลดวันละ ฿{to_baht(cut):,.0f}",
                "body": "จะช่วยให้เงินพอใช้ถึงวันเงินเดือนออก",
            })

    # 5) Bills due within 3 days (unpaid)
    paid_ids = {
        p.bill_id for p in session.exec(
            select(BillPayment).where(BillPayment.period == period)
        ).all()
    }
    for bill in session.exec(select(Bill).where(Bill.user_id == uid)).all():
        if bill.id in paid_ids:
            continue
        dd = _days_to_due(bill.due_day, today)
        if dd is not None and dd <= 3:
            when = "วันนี้" if dd == 0 else f"ในอีก {dd} วัน"
            out.append({
                "type": "bill_due", "severity": "warn", "period": period,
                "title": f"{bill.name}ครบกำหนด{when}",
                "body": f"฿{to_baht(bill.amount):,.0f}",
            })

    return out


def refresh_insights(session: Session, uid: str, today: date | None = None) -> int:
    """Persist newly-evaluated insights, deduped by (user, type, period, title)."""
    today = today or date.today()
    existing = {
        (i.type, i.period, i.title) for i in session.exec(
            select(Insight).where(Insight.user_id == uid)
        ).all()
    }
    added = 0
    for c in evaluate(session, uid, today):
        key = (c["type"], c["period"], c["title"])
        if key in existing:
            continue
        session.add(Insight(user_id=uid, **c))
        existing.add(key)
        added += 1
    if added:
        session.commit()
    return added
