from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    serial_number: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Available",
    )

    assigned_to: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
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
        UniqueConstraint(
            "serial_number",
            name="uq_assets_serial_number",
        ),
        Index(
            "ix_assets_serial_number_lower",
            func.lower(serial_number),
            unique=True,
        ),
        CheckConstraint(
            "category IN ('Laptop', 'Desktop', 'Server', "
            "'Monitor', 'Network', 'Other')",
            name="ck_assets_category",
        ),
        CheckConstraint(
            "status IN ('Available', 'Assigned', "
            "'Maintenance', 'Retired')",
            name="ck_assets_status",
        ),
        CheckConstraint(
            "status != 'Assigned' OR "
            "(assigned_to IS NOT NULL AND length(trim(assigned_to)) > 0)",
            name="ck_assets_assignment",
        ),
    )
