"""Authentication endpoints for OpsPilot."""

import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.auth_session import AuthSession
from app.config import get_settings
from app.routers.tickets import get_db
from app.security import hash_password, verify_password
from app.auth_dependencies import require_current_user
from app.csrf_security import generate_csrf_token, require_csrf
from app.session_security import SESSION_COOKIE_NAME, SESSION_TTL_SECONDS, generate_session_token, hash_session_token


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


class UserSignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=12, max_length=128)


class UserSignupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime


@router.post(
    "/signup",
    response_model=UserSignupResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    payload: UserSignupRequest,
    db: Session = Depends(get_db),
) -> User:
    """Register a new account with the employee role only."""

    email = str(payload.email).strip().lower()

    # Bound the work required for password hashing.
    if len(payload.password.encode("utf-8")) > 1024:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password is too long.",
        )

    existing_user_id = db.scalar(
        select(User.id).where(func.lower(User.email) == email)
    )

    if existing_user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        role="employee",
        is_active=True,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()

        # Also handles simultaneous signup attempts for one email.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    return user


class UserLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)


# Perform password verification even for unknown email addresses.
# This reduces timing differences that could reveal account existence.
_DUMMY_PASSWORD_HASH = hash_password(
    "OpsPilot-Dummy-Account-Password-Not-For-Login"
)


@router.post(
    "/login",
    response_model=UserSignupResponse,
)
def login(
    payload: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    """Authenticate a user and create a database-backed session."""

    # Reject browser requests originating outside the trusted frontend.
    # Full CSRF protection for authenticated writes follows separately.
    origin = request.headers.get("origin")

    allowed_origins = get_settings().allowed_origins

    if origin is not None and origin not in allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted request origin.",
        )

    email = str(payload.email).strip().lower()

    user = db.scalar(
        select(User).where(func.lower(User.email) == email)
    )

    stored_hash = (
        user.password_hash
        if user is not None
        else _DUMMY_PASSWORD_HASH
    )

    password_valid = verify_password(
        payload.password,
        stored_hash,
    )

    if user is None or not password_valid or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = generate_session_token()

    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=SESSION_TTL_SECONDS
    )

    session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(token),
        expires_at=expires_at,
    )

    db.add(session)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    # Secure cookies require HTTPS in non-development environments.
    is_production = (
        get_settings().environment.strip().lower()
        != "development"
    )

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/",
    )

    return user


@router.get(
    "/me",
    response_model=UserSignupResponse,
)
def get_authenticated_user(
    response: Response,
    current_user: User = Depends(require_current_user),
) -> User:
    """Return the currently authenticated user."""

    response.headers["Cache-Control"] = "no-store"

    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_csrf)],
)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> None:
    """Revoke the current session and clear its browser cookie."""

    # Logout changes authentication state, so require a trusted
    # browser Origin. Full application-wide CSRF protection
    # will be implemented before protecting other write routes.
    allowed_origins = get_settings().allowed_origins

    origin = request.headers.get("origin")

    if origin not in allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted request origin.",
        )

    token = request.cookies.get(SESSION_COOKIE_NAME)

    # Match the token format generated by secrets.token_urlsafe(32).
    if token and re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
        session = db.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == hash_session_token(token)
            )
        )

        if session is not None and session.revoked_at is None:
            session.revoked_at = datetime.now(timezone.utc)

            try:
                db.commit()
            except Exception:
                db.rollback()
                raise

    # Cookie deletion must use the same path and security
    # settings as the login cookie.
    is_production = (
        get_settings().environment.strip().lower()
        != "development"
    )

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=is_production,
        httponly=True,
        samesite="lax",
    )

    response.headers["Cache-Control"] = "no-store"


@router.get("/csrf")
def get_csrf_token(
    request: Request,
    response: Response,
    current_user: User = Depends(require_current_user),
) -> dict[str, str]:
    """Issue a CSRF token bound to the authenticated session."""

    token = request.cookies.get(SESSION_COOKIE_NAME)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    response.headers["Cache-Control"] = "no-store"
    response.headers["Vary"] = "Cookie, Origin"

    return {
        "csrf_token": generate_csrf_token(token),
    }
