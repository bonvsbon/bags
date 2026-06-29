import uuid
from datetime import date, datetime, timezone

from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Account(SQLModel, table=True):
    __tablename__ = "accounts"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    name: str
    type: str = "asset"  # asset | debt
    kind: str = "bank"  # bank|cash|ewallet|credit_card|loan
    balance: int = 0  # satang (debt = amount owed, positive)
    icon: str | None = None
    note: str | None = None
    sort: int = 0


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)
    name: str
    icon: str | None = None
    color: str | None = None
    kind: str = "expense"  # expense | income
    is_default: bool = False


class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    account_id: str | None = Field(default=None, foreign_key="accounts.id")
    category_id: str | None = Field(default=None, foreign_key="categories.id")
    type: str = "expense"  # expense | income
    amount: int  # satang, > 0
    note: str | None = None
    occurred_at: date
    created_at: datetime = Field(default_factory=_now)


class Bill(SQLModel, table=True):
    __tablename__ = "bills"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    name: str
    amount: int  # satang
    icon: str | None = None
    due_day: int = 1  # 1–31; 0/32 = EOM
    recurrence: str = "monthly"  # monthly|yearly|once
    remind_days: int = 3  # 1|3|7
    account_id: str | None = Field(default=None, foreign_key="accounts.id")
    category_id: str | None = Field(default=None, foreign_key="categories.id")


class BillPayment(SQLModel, table=True):
    __tablename__ = "bill_payments"

    id: str = Field(default_factory=_uuid, primary_key=True)
    bill_id: str = Field(foreign_key="bills.id", index=True)
    period: str = Field(index=True)  # YYYY-MM
    paid_at: datetime = Field(default_factory=_now)
    transaction_id: str | None = Field(default=None, foreign_key="transactions.id")


class Budget(SQLModel, table=True):
    __tablename__ = "budgets"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    category_id: str = Field(foreign_key="categories.id")
    period: str = Field(index=True)  # YYYY-MM
    limit_amount: int  # satang


class Goal(SQLModel, table=True):
    __tablename__ = "goals"

    id: str = Field(default_factory=_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    name: str
    icon: str | None = None
    icon_bg: str | None = None
    target_amount: int  # satang
    saved_amount: int = 0  # satang
    monthly_contribution: int | None = None  # satang
    created_at: datetime = Field(default_factory=_now)
