"""Fleet listing + admin CRUD (api.md 1.7) — drives the interactive seat map
layout on the booking side, and the Command Center's Fleet tab on the admin side.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies import require_admin
from app.models.schemas import AircraftCreate, AircraftOut, AircraftUpdate, FleetOut
from app.models.sql_models import Aircraft, User

router = APIRouter()


@router.get("", response_model=list[FleetOut])
async def list_fleet(db: AsyncSession = Depends(get_db)):
    """Fleet details — e.g. A320 = 6 across, B777 = 9 across, computed client-side from Total_Seats."""
    result = await db.execute(select(Aircraft).order_by(Aircraft.registration_code))
    aircraft = result.scalars().all()
    return [
        FleetOut(Aircraft_ID=a.registration_code, Model=a.model, Total_Seats=a.total_seats)
        for a in aircraft
    ]


@router.get("/admin", response_model=list[AircraftOut])
async def list_fleet_admin(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """Full aircraft records (id, status, manufacturer) for the Command Center Fleet tab."""
    result = await db.execute(select(Aircraft).order_by(Aircraft.registration_code))
    return result.scalars().all()


@router.post("", response_model=AircraftOut, status_code=201)
async def create_aircraft(
    payload: AircraftCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Add a new aircraft to the fleet. Requires admin privileges."""
    existing = await db.execute(select(Aircraft).where(Aircraft.registration_code == payload.registration_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An aircraft with this registration code already exists.")

    aircraft = Aircraft(
        registration_code=payload.registration_code,
        manufacturer=payload.manufacturer,
        model=payload.model,
        total_seats=payload.total_seats,
        status="active",
    )
    db.add(aircraft)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="An aircraft with this registration code already exists.")
    await db.refresh(aircraft)
    return aircraft


@router.patch("/{aircraft_id}", response_model=AircraftOut)
async def update_aircraft(
    aircraft_id: str,
    payload: AircraftUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Edit aircraft details or transition its status (e.g. into 'maintenance'). Admin only."""
    try:
        parsed_id = uuid.UUID(aircraft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="aircraft_id must be a valid UUID.")

    result = await db.execute(select(Aircraft).where(Aircraft.aircraft_id == parsed_id))
    aircraft = result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found.")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(aircraft, field, value)

    await db.commit()
    await db.refresh(aircraft)
    return aircraft


@router.delete("/{aircraft_id}", response_model=AircraftOut)
async def retire_aircraft(
    aircraft_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Retire an aircraft (soft delete — status becomes 'retired', row is kept for
    the flights that already reference it). Admin only."""
    try:
        parsed_id = uuid.UUID(aircraft_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="aircraft_id must be a valid UUID.")

    result = await db.execute(select(Aircraft).where(Aircraft.aircraft_id == parsed_id))
    aircraft = result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found.")

    aircraft.status = "retired"
    await db.commit()
    await db.refresh(aircraft)
    return aircraft
