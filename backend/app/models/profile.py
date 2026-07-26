from sqlmodel import Field, SQLModel


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    user_id: str = Field(foreign_key="users.id", primary_key=True)
    display_name: str | None = None
    pay_day: int = 0  # 1–31; 0 or 32 = end-of-month (EOM)
    monthly_income: int = 0  # satang
    primary_goal: str = "leftover"  # leftover|save|debt|control|invest
    mode: str = "beginner"  # beginner|advanced
    currency: str = "THB"
    locale: str = "th"


class Settings(SQLModel, table=True):
    __tablename__ = "settings"

    user_id: str = Field(foreign_key="users.id", primary_key=True)
    theme: str = "light"  # light|mint|sky|sand|dark|midnight
    notify_bills: bool = True
    notify_budget: bool = True
    weekly_summary: bool = True
    biometric: bool = False
    hide_amounts: bool = False
