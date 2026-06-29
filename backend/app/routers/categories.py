from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import or_, select

from app.deps import CurrentUser, SessionDep
from app.models.finance import Category

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryIn(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None
    kind: str = "expense"  # expense | income


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None
    kind: str | None = None


class CategoryOut(BaseModel):
    id: str
    name: str
    icon: str | None
    color: str | None
    kind: str
    is_default: bool


def _owned(session, uid, category_id) -> Category:
    c = session.get(Category, category_id)
    # Only user-owned categories are editable; defaults (user_id=None) are read-only.
    if c is None or c.user_id != uid:
        raise HTTPException(status_code=404, detail="Category not found")
    return c


@router.get("", response_model=list[CategoryOut])
def list_categories(user: CurrentUser, session: SessionDep):
    # System defaults (user_id is NULL) + this user's own categories.
    rows = session.exec(
        select(Category).where(
            or_(Category.user_id == None, Category.user_id == user.id)  # noqa: E711
        )
    ).all()
    return rows


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(body: CategoryIn, user: CurrentUser, session: SessionDep):
    c = Category(user_id=user.id, is_default=False, **body.model_dump())
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@router.patch("/{category_id}", response_model=CategoryOut)
def patch_category(
    category_id: str, body: CategoryUpdate, user: CurrentUser, session: SessionDep
):
    c = _owned(session, user.id, category_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: str, user: CurrentUser, session: SessionDep):
    session.delete(_owned(session, user.id, category_id))
    session.commit()
