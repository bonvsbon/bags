from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models.finance import Account
from app.money import to_baht, to_satang

router = APIRouter(prefix="/accounts", tags=["accounts"])


class AccountIn(BaseModel):
    name: str
    type: str = "asset"  # asset | debt
    kind: str = "bank"
    balance: float = 0
    icon: str | None = None
    note: str | None = None
    sort: int = 0


class AccountUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    kind: str | None = None
    balance: float | None = None
    icon: str | None = None
    note: str | None = None
    sort: int | None = None


class AccountOut(BaseModel):
    id: str
    name: str
    type: str
    kind: str
    balance: float
    icon: str | None
    note: str | None
    sort: int


def _out(a: Account) -> AccountOut:
    return AccountOut(
        id=a.id, name=a.name, type=a.type, kind=a.kind,
        balance=to_baht(a.balance), icon=a.icon, note=a.note, sort=a.sort,
    )


def _owned(session, uid, account_id) -> Account:
    a = session.get(Account, account_id)
    if a is None or a.user_id != uid:
        raise HTTPException(status_code=404, detail="Account not found")
    return a


@router.get("", response_model=list[AccountOut])
def list_accounts(user: CurrentUser, session: SessionDep):
    rows = session.exec(
        select(Account).where(Account.user_id == user.id).order_by(Account.sort)
    ).all()
    return [_out(a) for a in rows]


@router.post("", response_model=AccountOut, status_code=201)
def create_account(body: AccountIn, user: CurrentUser, session: SessionDep):
    a = Account(
        user_id=user.id, name=body.name, type=body.type, kind=body.kind,
        balance=to_satang(body.balance), icon=body.icon, note=body.note, sort=body.sort,
    )
    session.add(a)
    session.commit()
    session.refresh(a)
    return _out(a)


@router.get("/{account_id}", response_model=AccountOut)
def get_account(account_id: str, user: CurrentUser, session: SessionDep):
    return _out(_owned(session, user.id, account_id))


@router.patch("/{account_id}", response_model=AccountOut)
def patch_account(
    account_id: str, body: AccountUpdate, user: CurrentUser, session: SessionDep
):
    a = _owned(session, user.id, account_id)
    data = body.model_dump(exclude_unset=True)
    if "balance" in data:
        a.balance = to_satang(data.pop("balance"))
    for k, v in data.items():
        setattr(a, k, v)
    session.add(a)
    session.commit()
    session.refresh(a)
    return _out(a)


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: str, user: CurrentUser, session: SessionDep):
    session.delete(_owned(session, user.id, account_id))
    session.commit()
