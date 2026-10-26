from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
import re
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.team_member import TeamMember
from app.routers.tickets import get_db


from app.role_dependencies import require_admin, require_staff
from app.csrf_security import require_csrf

router = APIRouter(
    prefix="/api/team",
    tags=["Team Management"],
)


class TeamMemberResponse(BaseModel):
    id: int
    full_name: str
    email: str
    department: str
    role: str
    status: str
    location: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeamMemberCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    department: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    status: Literal["Active", "Inactive"] = "Active"
    location: str = Field(min_length=1, max_length=150)

    @field_validator(
        "full_name",
        "email",
        "department",
        "role",
        "location",
        mode="before",
    )
    @classmethod
    def trim_required_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.lower()

        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid work email address")

        return normalized


@router.post(
    "/",
    response_model=TeamMemberResponse,
    status_code=201,
 dependencies=[Depends(require_admin), Depends(require_csrf)])
def create_team_member(
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
):
    existing_id = db.scalar(
        select(TeamMember.id).where(
            func.lower(TeamMember.email) == payload.email
        )
    )

    if existing_id is not None:
        raise HTTPException(
            status_code=409,
            detail="A team member with this email already exists",
        )

    member = TeamMember(**payload.model_dump())

    try:
        db.add(member)
        db.commit()
        db.refresh(member)
    except IntegrityError:
        db.rollback()

        duplicate_id = db.scalar(
            select(TeamMember.id).where(
                func.lower(TeamMember.email) == payload.email
            )
        )

        if duplicate_id is not None:
            raise HTTPException(
                status_code=409,
                detail="A team member with this email already exists",
            )

        raise
    except Exception:
        db.rollback()
        raise

    return member

@router.get("/", response_model=list[TeamMemberResponse], dependencies=[Depends(require_staff)])
def list_team_members(
    db: Session = Depends(get_db),
):
    statement = (
        select(TeamMember)
        .order_by(
            TeamMember.created_at.desc(),
            TeamMember.id.desc(),
        )
    )

    return db.scalars(statement).all()


@router.get("/{member_id}", response_model=TeamMemberResponse, dependencies=[Depends(require_staff)])
def get_team_member(
    member_id: int,
    db: Session = Depends(get_db),
):
    if member_id <= 0:
        raise HTTPException(
            status_code=404,
            detail="Team member not found",
        )

    member = db.get(TeamMember, member_id)

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Team member not found",
        )

    return member



# Team member profile updates

from pydantic import model_validator


class TeamMemberUpdate(BaseModel):
    department: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    role: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    status: Literal["Active", "Inactive"] | None = None
    location: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    @field_validator(
        "department",
        "role",
        "location",
        mode="before",
    )
    @classmethod
    def trim_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def validate_changes(self):
        supplied = self.model_fields_set

        if not supplied:
            raise ValueError(
                "Provide at least one field to update"
            )

        if any(
            getattr(self, field) is None
            for field in supplied
        ):
            raise ValueError(
                "Updated fields cannot be null"
            )

        return self


@router.patch(
    "/{member_id}",
    response_model=TeamMemberResponse,
 dependencies=[Depends(require_admin), Depends(require_csrf)])
def update_team_member(
    member_id: int,
    payload: TeamMemberUpdate,
    db: Session = Depends(get_db),
):
    if member_id <= 0:
        raise HTTPException(
            status_code=404,
            detail="Team member not found",
        )

    member = db.get(TeamMember, member_id)

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Team member not found",
        )

    changes = payload.model_dump(exclude_unset=True)

    changed = False

    for field_name, new_value in changes.items():
        if getattr(member, field_name) != new_value:
            setattr(member, field_name, new_value)
            changed = True

    if not changed:
        return member

    try:
        db.commit()
        db.refresh(member)
    except Exception:
        db.rollback()
        raise

    return member
