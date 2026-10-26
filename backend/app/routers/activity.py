from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query
from app.role_dependencies import require_staff
from pydantic import BaseModel
from sqlalchemy import literal, select, union_all
from sqlalchemy.orm import Session

from app.models.asset_activity import AssetActivity
from app.models.ticket_activity import TicketActivity
from app.routers.tickets import get_db


router = APIRouter(
    prefix="/api/activity",
    tags=["Activity Log"],
    dependencies=[Depends(require_staff)],
)


class GlobalActivityResponse(BaseModel):
    activity_id: int
    entity_type: Literal["ticket", "asset"]
    entity_id: int
    field_name: str
    old_value: str | None
    new_value: str | None
    created_at: datetime


@router.get("/", response_model=list[GlobalActivityResponse])
def list_global_activity(
    entity_type: Literal["all", "ticket", "asset"] = "all",
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    ticket_query = select(
        TicketActivity.id.label("activity_id"),
        literal("ticket").label("entity_type"),
        TicketActivity.ticket_id.label("entity_id"),
        TicketActivity.field_name.label("field_name"),
        TicketActivity.old_value.label("old_value"),
        TicketActivity.new_value.label("new_value"),
        TicketActivity.created_at.label("created_at"),
    )

    asset_query = select(
        AssetActivity.id.label("activity_id"),
        literal("asset").label("entity_type"),
        AssetActivity.asset_id.label("entity_id"),
        AssetActivity.field_name.label("field_name"),
        AssetActivity.old_value.label("old_value"),
        AssetActivity.new_value.label("new_value"),
        AssetActivity.created_at.label("created_at"),
    )

    if entity_type == "ticket":
        combined = ticket_query.subquery()
    elif entity_type == "asset":
        combined = asset_query.subquery()
    else:
        combined = union_all(
            ticket_query,
            asset_query,
        ).subquery()

    statement = (
        select(combined)
        .order_by(
            combined.c.created_at.desc(),
            combined.c.entity_type,
            combined.c.activity_id.desc(),
        )
        .limit(limit)
    )

    rows = db.execute(statement).mappings().all()

    return [
        GlobalActivityResponse.model_validate(dict(row))
        for row in rows
    ]
