"""Keep asset-account balances in sync with money-moving actions.

Realistic model: spending money (expense / paying a bill) lowers an asset
account's balance; income raises it. `total_balance` then reflects what you
actually have, so paying a bill no longer inflates `available`.
"""
from sqlmodel import Session

from app.models.finance import Account


def txn_balance_delta(type_: str, amount: int) -> int:
    """Effect of a transaction on an asset balance (satang)."""
    return amount if type_ == "income" else -amount


def adjust_balance(session: Session, account_id: str | None, delta: int) -> None:
    if not account_id or delta == 0:
        return
    acc = session.get(Account, account_id)
    if acc is not None and acc.type == "asset":
        acc.balance += delta
        session.add(acc)


def primary_asset_id(session: Session, uid: str) -> str | None:
    """The asset account to charge when a bill has no explicit account."""
    from sqlmodel import select

    acc = session.exec(
        select(Account)
        .where(Account.user_id == uid, Account.type == "asset")
        .order_by(Account.balance.desc())
    ).first()
    return acc.id if acc else None
