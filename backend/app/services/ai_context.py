"""AI grounding snapshot (Phase 9 §0-A).

The LLM must never do money math itself. We pre-compute every figure from the
existing source-of-truth services (`aggregation`, `insights`) and hand the model
a ready-made, baht-formatted context to *explain* — not to calculate.

All amounts here are already baht (aggregation returns baht), so nothing needs
satang conversion.
"""
from datetime import date

from sqlmodel import Session

from app.services import aggregation, insights


def build_snapshot(session: Session, uid: str, today: date | None = None) -> dict:
    """Compose a read-only financial snapshot from existing aggregations."""
    today = today or date.today()
    home = aggregation.summary_home(session, uid, today)
    plan = aggregation.summary_plan(session, uid, today)
    signals = insights.evaluate(session, uid, today)
    return {
        "today": today.isoformat(),
        "available": home["available"],
        "total_balance": home["total_balance"],
        "reserved": home["reserved"],
        "days_until_payday": home["days_until_payday"],
        "daily_allowance": home["daily_allowance"],
        "month_in": home["month_in"],
        "month_out": home["month_out"],
        "upcoming_bills": home["upcoming_bills"],
        "watch_budgets": home["watch_budgets"],
        "goal": home["goal"],
        "budgets": plan["budgets"],
        "tip": plan["tip"],
        "insights": signals,
    }


def _baht(x: float) -> str:
    return f"฿{x:,.0f}"


def snapshot_to_context(snapshot: dict) -> str:
    """Render the snapshot as a compact Thai context block for the system prompt.

    Numbers are pre-formatted; the model is told to reuse them verbatim.
    """
    lines: list[str] = [
        f"วันที่: {snapshot['today']}",
        f"เงินคงเหลือทั้งหมด: {_baht(snapshot['total_balance'])}",
        f"กันไว้ (บิล+เป้าหมาย): {_baht(snapshot['reserved'])}",
        f"เหลือใช้จริง: {_baht(snapshot['available'])}",
        f"อีก {snapshot['days_until_payday']} วันเงินเดือนออก "
        f"(ใช้ได้วันละ ~{_baht(snapshot['daily_allowance'])})",
        f"เดือนนี้: รายรับ {_baht(snapshot['month_in'])} · "
        f"รายจ่าย {_baht(snapshot['month_out'])}",
    ]

    bills = snapshot.get("upcoming_bills") or []
    if bills:
        parts = ", ".join(
            f"{b['name']} {_baht(b['amount'])} (วันที่ {b['due_day']})" for b in bills
        )
        lines.append(f"บิลที่ใกล้ครบกำหนด: {parts}")

    budgets = snapshot.get("budgets") or []
    if budgets:
        parts = ", ".join(
            f"{b['category']} ใช้ {_baht(b['used'])}/{_baht(b['limit'])} "
            f"({b['ratio'] * 100:.0f}%)"
            for b in budgets
        )
        lines.append(f"งบประมาณ: {parts}")

    goal = snapshot.get("goal")
    if goal:
        lines.append(
            f"เป้าหมาย {goal['name']}: เก็บได้ {_baht(goal['saved'])} "
            f"จาก {_baht(goal['target'])} ({goal['ratio'] * 100:.0f}%)"
        )

    signals = snapshot.get("insights") or []
    if signals:
        lines.append("ข้อสังเกต (คำนวณไว้แล้ว):")
        for s in signals:
            lines.append(f"  - {s['title']}: {s['body']}")

    return "\n".join(lines)
