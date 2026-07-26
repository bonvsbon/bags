"""Seed demo data for user "บอล", reconciled to the §5 formulas.

Run:  python -m app.seed
Identity it guarantees:
    total_balance (assets)        = 50,000.00
    reserved (unpaid bills + goal) = 37,200.00
    available = total - reserved   = 12,800.00
"""
from datetime import date

from sqlmodel import Session, delete, select

from app.db import engine
from app.models.finance import (
    Account,
    Bill,
    BillPayment,
    Budget,
    Category,
    Goal,
    Transaction,
)
from app.models.insight import Insight, Notification
from app.models.profile import Profile, Settings
from app.models.user import AuthIdentity, RefreshToken, User
from app.security import hash_password

DEMO_EMAIL = "demo@ngernthon.app"
DEMO_PASSWORD = "password123"


def B(baht: int) -> int:
    """Baht -> satang."""
    return baht * 100


# Default categories shared across users (user_id = None, is_default = True)
DEFAULT_CATEGORIES = [
    ("อาหาร", "🍜", "expense"),
    ("เดินทาง", "🚌", "expense"),
    ("ช้อปปิ้ง", "🛍️", "expense"),
    ("บิล/ค่าใช้จ่าย", "🧾", "expense"),
    ("บันเทิง", "🎬", "expense"),
    ("สุขภาพ", "💊", "expense"),
    ("เงินเดือน", "💼", "income"),
    ("รายได้เสริม", "💰", "income"),
]


def ensure_default_categories(s: Session) -> dict[str, Category]:
    existing = {
        c.name: c
        for c in s.exec(select(Category).where(Category.user_id == None)).all()  # noqa: E711
    }
    for name, icon, kind in DEFAULT_CATEGORIES:
        if name not in existing:
            c = Category(name=name, icon=icon, kind=kind, is_default=True)
            s.add(c)
            existing[name] = c
    s.commit()
    return existing


def wipe_demo(s: Session, user: User) -> None:
    uid = user.id
    bill_ids = [b.id for b in s.exec(select(Bill).where(Bill.user_id == uid)).all()]
    if bill_ids:
        s.exec(delete(BillPayment).where(BillPayment.bill_id.in_(bill_ids)))
    for model in (
        Transaction,
        Bill,
        Budget,
        Goal,
        Account,
        Insight,
        Notification,
        RefreshToken,
        AuthIdentity,
    ):
        s.exec(delete(model).where(model.user_id == uid))
    s.exec(delete(Category).where(Category.user_id == uid))
    s.exec(delete(Profile).where(Profile.user_id == uid))
    s.exec(delete(Settings).where(Settings.user_id == uid))
    s.commit()


def seed() -> None:
    with Session(engine) as s:
        cats = ensure_default_categories(s)

        user = s.exec(select(User).where(User.email == DEMO_EMAIL)).first()
        if user:
            wipe_demo(s, user)
        else:
            user = User(email=DEMO_EMAIL, account_type="registered")
        user.password_hash = hash_password(DEMO_PASSWORD)
        s.add(user)
        s.commit()
        s.refresh(user)
        uid = user.id

        s.add(Profile(
            user_id=uid, display_name="บอล", pay_day=0,  # EOM
            monthly_income=B(45000), primary_goal="leftover", mode="beginner",
        ))
        s.add(Settings(user_id=uid, theme="light"))

        # --- Accounts: assets sum to 50,000 ---
        s.add_all([
            Account(user_id=uid, name="ธนาคารหลัก", type="asset", kind="bank",
                    balance=B(38000), icon="🏦", sort=0),
            Account(user_id=uid, name="เงินสด", type="asset", kind="cash",
                    balance=B(5000), icon="💵", sort=1),
            Account(user_id=uid, name="e-Wallet", type="asset", kind="ewallet",
                    balance=B(7000), icon="📱", sort=2),
            Account(user_id=uid, name="บัตรเครดิต", type="debt", kind="credit_card",
                    balance=B(24000), icon="💳", note="ผ่อนเดือนละ ฿5,000", sort=3),
        ])

        # --- Bills (unpaid this month) sum to 32,200 ---
        s.add_all([
            Bill(user_id=uid, name="ค่าเช่าห้อง", amount=B(12000), icon="🏠", due_day=1),
            Bill(user_id=uid, name="ผ่อนรถ", amount=B(8500), icon="🚗", due_day=5),
            Bill(user_id=uid, name="ค่างวดบัตรเครดิต", amount=B(5000), icon="💳", due_day=25),
            Bill(user_id=uid, name="เน็ต + มือถือ", amount=B(1200), icon="📶", due_day=15),
            Bill(user_id=uid, name="ประกันชีวิต", amount=B(3000), icon="🛡️", due_day=20),
            Bill(user_id=uid, name="ค่าน้ำค่าไฟ", amount=B(2500), icon="💡", due_day=28),
        ])

        # --- Goal: monthly contribution 5,000 -> reserved = 32,200 + 5,000 = 37,200 ---
        s.add(Goal(
            user_id=uid, name="เที่ยวญี่ปุ่น", icon="✈️", icon_bg="#e8f1ec",
            target_amount=B(60000), saved_amount=B(18000), monthly_contribution=B(5000),
        ))

        # --- Transactions this month: income 45,000, expenses sum 41,800 ---
        d = date.today().replace(day=10)
        s.add(Transaction(user_id=uid, category_id=cats["เงินเดือน"].id, type="income",
                          amount=B(45000), note="เงินเดือน", occurred_at=d.replace(day=1)))
        spend = {
            "อาหาร": 8900, "เดินทาง": 3200, "ช้อปปิ้ง": 6500,
            "บิล/ค่าใช้จ่าย": 15700, "บันเทิง": 4200, "สุขภาพ": 3300,
        }
        for name, baht in spend.items():
            s.add(Transaction(user_id=uid, category_id=cats[name].id, type="expense",
                              amount=B(baht), note=name, occurred_at=d))

        # --- Budgets (Plan) for this month; อาหาร over budget on purpose ---
        period = date.today().strftime("%Y-%m")
        budgets = {"อาหาร": 8000, "เดินทาง": 3500, "ช้อปปิ้ง": 5000,
                   "บันเทิง": 4000, "สุขภาพ": 3000}
        for name, baht in budgets.items():
            s.add(Budget(user_id=uid, category_id=cats[name].id, period=period,
                         limit_amount=B(baht)))

        s.commit()

        # --- Verify reconciliation ---
        assets = sum(a.balance for a in s.exec(
            select(Account).where(Account.user_id == uid, Account.type == "asset")).all())
        bills = sum(b.amount for b in s.exec(
            select(Bill).where(Bill.user_id == uid)).all())
        goal_contrib = sum(g.monthly_contribution or 0 for g in s.exec(
            select(Goal).where(Goal.user_id == uid)).all())
        reserved = bills + goal_contrib
        available = assets - reserved
        print(f"Seeded user 'บอล' ({DEMO_EMAIL} / {DEMO_PASSWORD})")
        print(f"  total_balance = {assets/100:,.2f}")
        print(f"  reserved      = {reserved/100:,.2f}  (bills {bills/100:,.0f} + goal {goal_contrib/100:,.0f})")
        print(f"  available     = {available/100:,.2f}")
        assert assets == B(50000), assets
        assert reserved == B(37200), reserved
        assert available == B(12800), available
        print("  ✓ reconciled (50,000 − 37,200 = 12,800)")


if __name__ == "__main__":
    seed()
