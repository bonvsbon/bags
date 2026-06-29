from datetime import date

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models.finance import Transaction
from app.money import to_baht, to_satang
from app.services import ledger

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionIn(BaseModel):
    type: str = "expense"  # expense | income
    amount: float
    account_id: str | None = None
    category_id: str | None = None
    note: str | None = None
    occurred_at: date | None = None  # defaults to today


class TransactionUpdate(BaseModel):
    type: str | None = None
    amount: float | None = None
    account_id: str | None = None
    category_id: str | None = None
    note: str | None = None
    occurred_at: date | None = None


class TransactionOut(BaseModel):
    id: str
    type: str
    amount: float
    account_id: str | None
    category_id: str | None
    note: str | None
    occurred_at: date


class TransactionGroup(BaseModel):
    date: date
    items: list[TransactionOut]


def _out(t: Transaction) -> TransactionOut:
    return TransactionOut(
        id=t.id, type=t.type, amount=to_baht(t.amount), account_id=t.account_id,
        category_id=t.category_id, note=t.note, occurred_at=t.occurred_at,
    )


def _owned(session, uid, txn_id) -> Transaction:
    t = session.get(Transaction, txn_id)
    if t is None or t.user_id != uid:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return t


@router.get("")
def list_transactions(
    user: CurrentUser,
    session: SessionDep,
    type: str | None = None,
    category_id: str | None = None,
    account_id: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    group_by: str | None = Query(default=None, pattern="^day$"),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    q = select(Transaction).where(Transaction.user_id == user.id)
    if type:
        q = q.where(Transaction.type == type)
    if category_id:
        q = q.where(Transaction.category_id == category_id)
    if account_id:
        q = q.where(Transaction.account_id == account_id)
    if date_from:
        q = q.where(Transaction.occurred_at >= date_from)
    if date_to:
        q = q.where(Transaction.occurred_at <= date_to)
    q = q.order_by(Transaction.occurred_at.desc(), Transaction.created_at.desc())
    rows = session.exec(q.offset(offset).limit(limit)).all()
    items = [_out(t) for t in rows]

    if group_by == "day":
        groups: dict[date, list[TransactionOut]] = {}
        for it in items:
            groups.setdefault(it.occurred_at, []).append(it)
        return [
            TransactionGroup(date=d, items=v)
            for d, v in sorted(groups.items(), reverse=True)
        ]
    return items


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(body: TransactionIn, user: CurrentUser, session: SessionDep):
    amount = to_satang(body.amount)
    t = Transaction(
        user_id=user.id, type=body.type, amount=amount,
        account_id=body.account_id, category_id=body.category_id, note=body.note,
        occurred_at=body.occurred_at or date.today(),
    )
    session.add(t)
    ledger.adjust_balance(session, body.account_id, ledger.txn_balance_delta(body.type, amount))
    session.commit()
    session.refresh(t)
    return _out(t)


@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(txn_id: str, user: CurrentUser, session: SessionDep):
    return _out(_owned(session, user.id, txn_id))


@router.patch("/{txn_id}", response_model=TransactionOut)
def patch_transaction(
    txn_id: str, body: TransactionUpdate, user: CurrentUser, session: SessionDep
):
    t = _owned(session, user.id, txn_id)
    old_type, old_amount, old_account = t.type, t.amount, t.account_id
    data = body.model_dump(exclude_unset=True)
    if "amount" in data:
        t.amount = to_satang(data.pop("amount"))
    for k, v in data.items():
        setattr(t, k, v)
    # reverse the old balance effect, apply the new one
    ledger.adjust_balance(session, old_account, -ledger.txn_balance_delta(old_type, old_amount))
    ledger.adjust_balance(session, t.account_id, ledger.txn_balance_delta(t.type, t.amount))
    session.add(t)
    session.commit()
    session.refresh(t)
    return _out(t)


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(txn_id: str, user: CurrentUser, session: SessionDep):
    t = _owned(session, user.id, txn_id)
    ledger.adjust_balance(session, t.account_id, -ledger.txn_balance_delta(t.type, t.amount))
    session.delete(t)
    session.commit()
