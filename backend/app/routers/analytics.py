from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from app.role_dependencies import require_staff
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.routers.tickets import get_db


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
    dependencies=[Depends(require_staff)],
)

REPORT_TIMEZONE = ZoneInfo("Asia/Kolkata")


class TicketTrendDay(BaseModel):
    date: str
    day: str
    created: int
    resolved: int


class TicketTrendsResponse(BaseModel):
    days: int
    timezone: str
    data: list[TicketTrendDay]


@router.get(
    "/ticket-trends",
    response_model=TicketTrendsResponse,
)
def get_ticket_trends(
    days: int = Query(default=7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    today = datetime.now(REPORT_TIMEZONE).date()
    first_day = today - timedelta(days=days - 1)

    start_local = datetime.combine(
        first_day,
        datetime.min.time(),
        tzinfo=REPORT_TIMEZONE,
    )
    end_local = datetime.combine(
        today + timedelta(days=1),
        datetime.min.time(),
        tzinfo=REPORT_TIMEZONE,
    )

    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)

    ticket_dates = db.scalars(
        select(Ticket.created_at).where(
            Ticket.created_at >= start_utc,
            Ticket.created_at < end_utc,
        )
    ).all()

    resolution_dates = db.scalars(
        select(TicketActivity.created_at).where(
            TicketActivity.field_name == "status",
            TicketActivity.new_value == "Resolved",
            TicketActivity.old_value != "Resolved",
            TicketActivity.created_at >= start_utc,
            TicketActivity.created_at < end_utc,
        )
    ).all()

    counts = {}

    for offset in range(days):
        date = first_day + timedelta(days=offset)
        counts[date.isoformat()] = {
            "created": 0,
            "resolved": 0,
        }

    for created_at in ticket_dates:
        date_key = created_at.astimezone(
            REPORT_TIMEZONE
        ).date().isoformat()

        if date_key in counts:
            counts[date_key]["created"] += 1

    for resolved_at in resolution_dates:
        date_key = resolved_at.astimezone(
            REPORT_TIMEZONE
        ).date().isoformat()

        if date_key in counts:
            counts[date_key]["resolved"] += 1

    data = []

    for date_key, values in counts.items():
        date = datetime.strptime(date_key, "%Y-%m-%d").date()

        data.append(
            TicketTrendDay(
                date=date_key,
                day=date.strftime("%d %b"),
                created=values["created"],
                resolved=values["resolved"],
            )
        )

    return TicketTrendsResponse(
        days=days,
        timezone="Asia/Kolkata",
        data=data,
    )
