from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.models.user import User
from app.role_dependencies import (
    require_authenticated_user,
    require_staff,
)
from app.csrf_security import require_csrf


router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"],
)


class TicketResponse(BaseModel):
    id: int
    title: str
    description: str | None
    requester: str
    priority: str
    status: str
    assignee: str | None
    requester_user_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[TicketResponse])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
):
    statement = select(Ticket)

    if current_user.role == "employee":
        statement = statement.where(
            Ticket.requester_user_id == current_user.id
        )

    statement = statement.order_by(
        Ticket.created_at.desc(),
        Ticket.id.desc(),
    )

    return db.scalars(statement).all()

class TicketCreate(BaseModel):
    title: str
    description: str | None = None
    requester: str | None = None
    priority: str = "Medium"
    assignee: str | None = None


@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
    _csrf: None = Depends(require_csrf),
):
    title = payload.title.strip()

    if current_user.role == "employee":
        if payload.assignee is not None:
            raise HTTPException(
                status_code=403,
                detail="Employees cannot assign tickets.",
            )

        requester = (
            current_user.email
            if len(current_user.email) <= 120
            else f"Account #{current_user.id}"
        )
    else:
        requester = (payload.requester or "").strip()

    if not title or not requester:

        raise HTTPException(
            status_code=422,
            detail="Title and requester cannot be empty",
        )

    if len(title) > 200 or len(requester) > 120:

        raise HTTPException(
            status_code=422,
            detail="Title or requester exceeds maximum length",
        )

    if payload.priority not in {"Critical", "High", "Medium", "Low"}:

        raise HTTPException(
            status_code=422,
            detail="Invalid ticket priority",
        )

    assignee = payload.assignee.strip() if payload.assignee else None

    if assignee and len(assignee) > 120:

        raise HTTPException(
            status_code=422,
            detail="Assignee exceeds maximum length",
        )

    ticket = Ticket(
        title=title,
        description=payload.description,
        requester=requester,
        requester_user_id=current_user.id,
        priority=payload.priority,
        status="Open",
        assignee=assignee,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None or (
        current_user.role == "employee"
        and ticket.requester_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return ticket

class TicketUpdateRequest(BaseModel):
    status: Literal["Open", "In Progress", "Resolved"]
    priority: Literal["Critical", "High", "Medium", "Low"]
    assignee: str


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    changes: TicketUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
    _csrf: None = Depends(require_csrf),
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    assignee = changes.assignee.strip()

    if not assignee or len(assignee) > 100:
        raise HTTPException(
            status_code=422,
            detail="Assignee must contain 1 to 100 characters",
        )

    requested_changes = {
        "status": changes.status,
        "priority": changes.priority,
        "assignee": assignee,
    }

    activity_records = []

    for field_name, new_value in requested_changes.items():
        old_value = getattr(ticket, field_name)

        if old_value == new_value:
            continue

        activity_records.append(
            TicketActivity(
                ticket_id=ticket.id,
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
            )
        )

        setattr(ticket, field_name, new_value)

    if not activity_records:
        return ticket

    ticket.updated_at = datetime.now(timezone.utc)

    try:
        db.add_all(activity_records)
        db.commit()
        db.refresh(ticket)
    except Exception:
        db.rollback()
        raise

    return ticket



class TicketActivityResponse(BaseModel):
    id: int
    ticket_id: int
    field_name: str
    old_value: str | None
    new_value: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get(
    "/{ticket_id}/activities",
    response_model=list[TicketActivityResponse],
)
def get_ticket_activities(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None or (
        current_user.role == "employee"
        and ticket.requester_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    statement = (
        select(TicketActivity)
        .where(TicketActivity.ticket_id == ticket_id)
        .order_by(
            TicketActivity.created_at.desc(),
            TicketActivity.id.desc(),
        )
    )

    return db.scalars(statement).all()
