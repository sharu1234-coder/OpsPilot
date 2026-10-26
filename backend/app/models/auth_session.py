"""Database-backed authentication sessions."""

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.user import User  # noqa: F401


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    __table_args__ = (
        CheckConstraint(
            "length(token_hash) = 64",
            name="ck_auth_sessions_token_hash_length",
        ),
        Index(
            "ix_auth_sessions_token_hash",
            "token_hash",
            unique=True,
        ),
        Index(
            "ix_auth_sessions_user_id",
            "user_id",
        ),
        Index(
            "ix_auth_sessions_expires_at",
            "expires_at",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
