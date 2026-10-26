"""Session-bound CSRF token generation and validation."""

import hashlib
import hmac
import re

from fastapi import HTTPException, Request, status

from app.config import get_settings
from app.session_security import SESSION_COOKIE_NAME


CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_CONTEXT = b"OpsPilot-CSRF-v1"

# Trusted origins are centrally configured in app.config.


def generate_csrf_token(session_token: str) -> str:
    """Derive a CSRF token bound to a specific login session."""
    return hmac.new(
        session_token.encode("utf-8"),
        CSRF_CONTEXT,
        hashlib.sha256,
    ).hexdigest()


def verify_csrf_token(
    session_token: str,
    csrf_token: str,
) -> bool:
    """Validate a session-bound CSRF token in constant time."""
    if not isinstance(csrf_token, str):
        return False

    if not re.fullmatch(r"[0-9a-f]{64}", csrf_token):
        return False

    expected = generate_csrf_token(session_token)

    return hmac.compare_digest(expected, csrf_token)


def require_csrf(request: Request) -> None:
    """Reject authenticated write requests without valid CSRF proof."""

    origin = request.headers.get("origin")

    if origin not in get_settings().allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted request origin.",
        )

    session_token = request.cookies.get(
        SESSION_COOKIE_NAME
    )

    csrf_token = request.headers.get(
        CSRF_HEADER_NAME
    )

    if (
        not session_token
        or not csrf_token
        or not verify_csrf_token(session_token, csrf_token)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing CSRF token.",
        )
