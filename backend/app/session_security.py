"""Cryptographically secure authentication session utilities."""

import hashlib
import secrets


SESSION_COOKIE_NAME = "opspilot_session"
SESSION_TTL_SECONDS = 12 * 60 * 60


def generate_session_token() -> str:
    """Generate a random 256-bit session token."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Return the SHA-256 digest stored in PostgreSQL."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
