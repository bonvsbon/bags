from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session, select

from app.config import get_settings
from app.deps import CurrentUser, SessionDep
from app.models.user import AuthIdentity, RefreshToken, User
from app.schemas.auth import (
    GoogleIn,
    GuestUpgradeIn,
    LoginIn,
    RefreshIn,
    RegisterIn,
    TokenPair,
    UserOut,
)
from app.security import (
    create_access_token,
    hash_password,
    hash_refresh_token,
    new_refresh_token,
    refresh_expiry,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _issue_tokens(session: Session, user: User) -> TokenPair:
    raw = new_refresh_token()
    session.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw),
            expires_at=refresh_expiry(),
        )
    )
    session.commit()
    return TokenPair(access=create_access_token(user.id), refresh=raw)


def _norm_email(email: str) -> str:
    return email.strip().lower()


@router.post("/register", response_model=TokenPair)
def register(body: RegisterIn, session: SessionDep):
    email = _norm_email(body.email)
    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=email,
        password_hash=hash_password(body.password),
        account_type="registered",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return _issue_tokens(session, user)


@router.post("/login", response_model=TokenPair)
def login(body: LoginIn, session: SessionDep):
    email = _norm_email(body.email)
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not user.password_hash or not verify_password(
        body.password, user.password_hash
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _issue_tokens(session, user)


@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshIn, session: SessionDep):
    token_hash = hash_refresh_token(body.refresh_token)
    row = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()
    now = datetime.now(timezone.utc)
    if (
        not row
        or row.revoked_at is not None
        or row.expires_at.replace(tzinfo=timezone.utc) < now
    ):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    # Rotate: revoke old, issue new pair.
    row.revoked_at = now
    session.add(row)
    user = session.get(User, row.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return _issue_tokens(session, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(body: RefreshIn, session: SessionDep):
    token_hash = hash_refresh_token(body.refresh_token)
    row = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()
    if row and row.revoked_at is None:
        row.revoked_at = datetime.now(timezone.utc)
        session.add(row)
        session.commit()


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user


@router.post("/google", response_model=TokenPair)
def google_login(body: GoogleIn, session: SessionDep):
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google auth not configured")
    # Lazy import — only needed on this path.
    from google.auth.transport import requests as g_requests
    from google.oauth2 import id_token as g_id_token

    try:
        info = g_id_token.verify_oauth2_token(
            body.id_token, g_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    sub = info["sub"]
    email = _norm_email(info.get("email", "")) or None
    verified = bool(info.get("email_verified"))

    identity = session.exec(
        select(AuthIdentity).where(
            AuthIdentity.provider == "google",
            AuthIdentity.provider_subject == sub,
        )
    ).first()
    if identity:
        user = session.get(User, identity.user_id)
    else:
        # Link to existing email account, else create.
        user = (
            session.exec(select(User).where(User.email == email)).first()
            if email
            else None
        )
        if user is None:
            user = User(email=email, account_type="registered")
            session.add(user)
            session.commit()
            session.refresh(user)
        session.add(
            AuthIdentity(
                user_id=user.id,
                provider="google",
                provider_subject=sub,
                provider_email=email,
                email_verified=verified,
            )
        )
        session.commit()
    return _issue_tokens(session, user)


@router.post("/guest", response_model=TokenPair)
def guest(session: SessionDep):
    user = User(account_type="guest")
    session.add(user)
    session.commit()
    session.refresh(user)
    return _issue_tokens(session, user)


@router.post("/guest/upgrade", response_model=TokenPair)
def guest_upgrade(body: GuestUpgradeIn, user: CurrentUser, session: SessionDep):
    if user.account_type != "guest":
        raise HTTPException(status_code=400, detail="Account is not a guest")
    email = _norm_email(body.email)
    if session.exec(
        select(User).where(User.email == email, User.id != user.id)
    ).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user.email = email
    user.password_hash = hash_password(body.password)
    user.account_type = "registered"
    user.guest_expires_at = None
    session.add(user)
    session.commit()
    session.refresh(user)
    return _issue_tokens(session, user)
