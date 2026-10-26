from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(254),
        nullable=False,
    )

    department: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Active",
        server_default="Active",
    )

    location: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
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

    __table_args__ = (
        Index(
            "ix_team_members_email_lower",
            func.lower(email),
            unique=True,
        ),
        CheckConstraint(
            "status IN ('Active', 'Inactive')",
            name="ck_team_members_status",
        ),
        CheckConstraint(
            "length(trim(full_name)) > 0",
            name="ck_team_members_full_name",
        ),
        CheckConstraint(
            "length(trim(email)) > 0",
            name="ck_team_members_email",
        ),
        CheckConstraint(
            "length(trim(department)) > 0",
            name="ck_team_members_department",
        ),
        CheckConstraint(
            "length(trim(role)) > 0",
            name="ck_team_members_role",
        ),
        CheckConstraint(
            "length(trim(location)) > 0",
            name="ck_team_members_location",
        ),
    )
