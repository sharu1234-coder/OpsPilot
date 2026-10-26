from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.csrf_security import require_csrf
from app.role_dependencies import require_staff
from app.models.asset import Asset
from app.models.asset_activity import AssetActivity
from app.routers.tickets import get_db


router = APIRouter(
    prefix="/api/assets",
    tags=["Assets"],
    dependencies=[Depends(require_staff)],
)


class AssetResponse(BaseModel):
    id: int
    name: str
    category: str
    serial_number: str
    status: str
    assigned_to: str | None
    location: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[AssetResponse])
def list_assets(
    db: Session = Depends(get_db),
):
    statement = (
        select(Asset)
        .order_by(
            Asset.created_at.desc(),
            Asset.id.desc(),
        )
    )

    return db.scalars(statement).all()


class AssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str
    serial_number: str = Field(min_length=1, max_length=120)
    status: str = "Available"
    assigned_to: str | None = None
    location: str = Field(min_length=2, max_length=150)

    @field_validator("name", "serial_number", "location")
    @classmethod
    def strip_required_fields(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty")

        return value

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        allowed = {
            "Laptop", "Desktop", "Server",
            "Monitor", "Network", "Other",
        }

        if value not in allowed:
            raise ValueError("Invalid asset category")

        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {
            "Available", "Assigned",
            "Maintenance", "Retired",
        }

        if value not in allowed:
            raise ValueError("Invalid asset status")

        return value

    @model_validator(mode="after")
    def validate_assignment(self):
        self.assigned_to = (
            self.assigned_to.strip()
            if self.assigned_to
            else None
        )

        if self.assigned_to and len(self.assigned_to) > 100:
            raise ValueError("Employee name cannot exceed 100 characters")

        if self.status == "Assigned" and not self.assigned_to:
            raise ValueError("Assigned assets require an employee name")

        if self.status != "Assigned":
            self.assigned_to = None

        if len(self.location) < 2:
            raise ValueError("Location must contain at least 2 characters")

        return self


@router.post(
    "/",
    response_model=AssetResponse,
    status_code=201,
    dependencies=[Depends(require_csrf)],
)
def create_asset(
    payload: AssetCreate,
    db: Session = Depends(get_db),
):
    existing = db.scalar(
        select(Asset.id).where(
            func.lower(Asset.serial_number)
            == payload.serial_number.lower()
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="An asset with this serial number already exists",
        )

    asset = Asset(
        name=payload.name,
        category=payload.category,
        serial_number=payload.serial_number,
        status=payload.status,
        assigned_to=payload.assigned_to,
        location=payload.location,
    )

    try:
        db.add(asset)
        db.commit()
        db.refresh(asset)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An asset with this serial number already exists",
        )

    return asset


@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
)
def get_asset_by_id(
    asset_id: int,
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, asset_id)

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    return asset


class AssetUpdate(BaseModel):
    status: str
    assigned_to: str | None = None
    location: str = Field(min_length=2, max_length=150)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {
            "Available",
            "Assigned",
            "Maintenance",
            "Retired",
        }

        if value not in allowed:
            raise ValueError("Invalid asset status")

        return value

    @field_validator("location")
    @classmethod
    def validate_location(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Location must contain at least 2 characters")

        return value

    @model_validator(mode="after")
    def validate_assignment(self):
        self.assigned_to = (
            self.assigned_to.strip()
            if self.assigned_to
            else None
        )

        if self.assigned_to and len(self.assigned_to) > 100:
            raise ValueError("Employee name cannot exceed 100 characters")

        if self.status == "Assigned" and not self.assigned_to:
            raise ValueError("Assigned assets require an employee name")

        if self.status != "Assigned":
            self.assigned_to = None

        return self


@router.patch(
    "/{asset_id}",
    response_model=AssetResponse,
    dependencies=[Depends(require_csrf)],
)
def update_asset(
    asset_id: int,
    payload: AssetUpdate,
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, asset_id)

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    changes = {
        "status": (asset.status, payload.status),
        "assigned_to": (asset.assigned_to, payload.assigned_to),
        "location": (asset.location, payload.location),
    }

    changed_fields = {
        field: (old_value, new_value)
        for field, (old_value, new_value) in changes.items()
        if old_value != new_value
    }

    if not changed_fields:
        return asset

    try:
        asset.status = payload.status
        asset.assigned_to = payload.assigned_to
        asset.location = payload.location

        for field, (old_value, new_value) in changed_fields.items():
            db.add(
                AssetActivity(
                    asset_id=asset.id,
                    field_name=field,
                    old_value=old_value,
                    new_value=new_value,
                )
            )

        db.commit()
        db.refresh(asset)

    except Exception:
        db.rollback()
        raise

    return asset



class AssetActivityResponse(BaseModel):
    id: int
    asset_id: int
    field_name: str
    old_value: str | None
    new_value: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get(
    "/{asset_id}/activities",
    response_model=list[AssetActivityResponse],
)
def list_asset_activities(
    asset_id: int,
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, asset_id)

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    statement = (
        select(AssetActivity)
        .where(AssetActivity.asset_id == asset_id)
        .order_by(
            AssetActivity.created_at.desc(),
            AssetActivity.id.desc(),
        )
    )

    return db.scalars(statement).all()
