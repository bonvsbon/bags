from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import delete, select

from app.deps import CurrentUser, SessionDep
from app.models.finance import Bill, BillPayment, Transaction
from app.money import to_baht, to_satang
from app.services import ledger

router = APIRouter(prefix="/bills", tags=["bills"])


def _period(d: date | None = None) -> str:
    return (d or date.today()).strftime("%Y-%m")


class BillIn(BaseModel):
    name: str
    amount: float
    icon: str | None = None
    due_day: int = 1
    recurrence: str = "monthly"  # monthly|yearly|once
    remind_days: int = 3
    account_id: str | None = None
    category_id: str | None = None


class BillUpdate(BaseModel):
    name: str | None = None
    amount: float | None = None
    icon: str | None = None
    due_day: int | None = None
    recurrence: str | None = None
    remind_days: int | None = None
    account_id: str | None = None
    category_id: str | None = None


class BillOut(BaseModel):
    id: str
    name: str
    amount: float
    icon: str | None
    due_day: int
    recurrence: str
    remind_days: int
    account_id: str | None
    category_id: str | None
    paid_this_period: bool


def _out(b: Bill, paid: bool) -> BillOut:
    return BillOut(
        id=b.id, name=b.name, amount=to_baht(b.amount), icon=b.icon,
        due_day=b.due_day, recurrence=b.recurrence, remind_days=b.remind_days,
        account_id=b.account_id, category_id=b.category_id, paid_this_period=paid,
    )


def _owned(session, uid, bill_id) -> Bill:
    b = session.get(Bill, bill_id)
    if b is None or b.user_id != uid:
        raise HTTPException(status_code=404, detail="Bill not found")
    return b


def _is_paid(session, bill_id: str, period: str) -> bool:
    return session.exec(
        select(BillPayment).where(
            BillPayment.bill_id == bill_id, BillPayment.period == period
        )
    ).first() is not None


@router.get("", response_model=list[BillOut])
def list_bills(user: CurrentUser, session: SessionDep):
    period = _period()
    rows = session.exec(select(Bill).where(Bill.user_id == user.id)).all()
    # 0/32 = end of month → sort last, not first.
    rows.sort(key=lambda b: b.due_day if 1 <= b.due_day <= 31 else 31)
    return [_out(b, _is_paid(session, b.id, period)) for b in rows]


@router.post("", response_model=BillOut, status_code=201)
def create_bill(body: BillIn, user: CurrentUser, session: SessionDep):
    data = body.model_dump()
    b = Bill(user_id=user.id, amount=to_satang(data.pop("amount")), **data)
    session.add(b)
    session.commit()
    session.refresh(b)
    return _out(b, False)


@router.patch("/{bill_id}", response_model=BillOut)
def patch_bill(
    bill_id: str, body: BillUpdate, user: CurrentUser, session: SessionDep
):
    b = _owned(session, user.id, bill_id)
    data = body.model_dump(exclude_unset=True)
    if "amount" in data:
        b.amount = to_satang(data.pop("amount"))
    for k, v in data.items():
        setattr(b, k, v)
    session.add(b)
    session.commit()
    session.refresh(b)
    return _out(b, _is_paid(session, b.id, _period()))


@router.delete("/{bill_id}", status_code=204)
def delete_bill(bill_id: str, user: CurrentUser, session: SessionDep):
    b = _owned(session, user.id, bill_id)
    session.exec(delete(BillPayment).where(BillPayment.bill_id == b.id))
    session.delete(b)
    session.commit()


@router.post("/{bill_id}/pay", response_model=BillOut)
def pay_bill(bill_id: str, user: CurrentUser, session: SessionDep):
    b = _owned(session, user.id, bill_id)
    period = _period()
    if _is_paid(session, b.id, period):
        raise HTTPException(status_code=409, detail="Bill already paid this period")

    # Paying spends money: record an expense and deduct from an asset account,
    # so `available` stays stable (reserved drops, balance drops by the same).
    acct_id = b.account_id or ledger.primary_asset_id(session, user.id)
    txn_id = None
    if acct_id:
        txn = Transaction(
            user_id=user.id, type="expense", amount=b.amount, account_id=acct_id,
            category_id=b.category_id, note=b.name, occurred_at=date.today(),
        )
        session.add(txn)
        ledger.adjust_balance(session, acct_id, -b.amount)
        session.flush()
        txn_id = txn.id

    session.add(BillPayment(bill_id=b.id, period=period, transaction_id=txn_id))
    session.commit()
    return _out(b, True)
