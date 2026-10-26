"""Reusable database-backed authentication dependencies."""

import re
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auth_session import AuthSession
from app.models.user import User
from app.database import get_db
from app.session_security import (
    SESSION_COOKIE_NAME,
    hash_session_token,
)


def require_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Return the user associated with a valid active session."""

    token = request.cookies.get(SESSION_COOKIE_NAME)

    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
    )

    # secrets.token_urlsafe(32) generates a 43-character token.
    # Reject malformed values before querying PostgreSQL.
    if not token or not re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
        raise unauthorized

    token_hash = hash_session_token(token)

    current_time = datetime.now(timezone.utc)

    user = db.scalar(
        select(User)
        .join(
            AuthSession,
            AuthSession.user_id == User.id,
        )
        .where(
            AuthSession.token_hash == token_hash,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > current_time,
            User.is_active.is_(True),
        )
    )

    if user is None:
        raise unauthorized

    return user
