from datetime import datetime, timezone

from sqlalchemy import ForeignKey
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    requester: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    requester_user_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            name="fk_tickets_requester_user_id_users",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Medium",
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Open",
    )

    assignee: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )
