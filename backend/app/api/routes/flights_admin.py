"""Admin-only flight management: create, reschedule/edit, cancel.

Kept separate from routes/flights.py (public schedule/search/seats/delay
endpoints) so that file doesn't keep growing — this one is mounted under the
same /api/v1/flights prefix in main.py, so from the outside it's all one API.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies import require_admin
from app.models.schemas import FlightCancelRequest, FlightCreate, FlightOut, FlightUpdate
from app.models.sql_models import Aircraft, Booking, Flight, Seat, User

router = APIRouter()


@router.get("/admin", response_model=list[FlightOut])
async def list_flights_admin(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """Every flight regardless of status (scheduled/boarding/airborne/delayed/
    completed/cancelled), newest departures first — feeds the Command Center's
    Flights tab so admins can act on flights that haven't started boarding yet,
    not just the subset the live-ops dashboard panels surface."""
    result = await db.execute(select(Flight).order_by(Flight.scheduled_departure.desc()).limit(500))
    return result.scalars().all()


def _generate_seats(flight_id: uuid.UUID, total_seats: int, seat_class: str) -> list[Seat]:
    """Simple 6-across row/letter numbering (e.g. 1A..1F, 2A..2F, ...) for
    admin-created flights. The bulk CSV seeder (scripts/create_postgres_tables.py)
    uses a richer multi-class layout for the seeded schedule; this keeps
    admin-added flights simple but still fully bookable."""
    seats: list[Seat] = []
    row, col = 1, 0
    for _ in range(total_seats):
        letter = chr(65 + col)
        seats.append(Seat(seat_id=uuid.uuid4(), flight_id=flight_id, seat_number=f"{row}{letter}", seat_class=seat_class))
        col += 1
        if col >= 6:
            col = 0
            row += 1
    return seats


@router.post("", response_model=FlightOut, status_code=201)
async def create_flight(
    payload: FlightCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Schedule a new flight and generate its seat inventory. Admin only."""
    if payload.scheduled_arrival <= payload.scheduled_departure:
        raise HTTPException(status_code=400, detail="scheduled_arrival must be after scheduled_departure.")

    aircraft_result = await db.execute(select(Aircraft).where(Aircraft.aircraft_id == payload.aircraft_id))
    aircraft = aircraft_result.scalar_one_or_none()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found.")
    if aircraft.status != "active":
        raise HTTPException(status_code=400, detail=f"Aircraft is '{aircraft.status}' and cannot be scheduled.")

    flight = Flight(
        flight_id=uuid.uuid4(),
        flight_number=payload.flight_number,
        service_date=payload.scheduled_departure.date(),
        aircraft_id=payload.aircraft_id,
        departure_airport=payload.departure_airport.upper(),
        arrival_airport=payload.arrival_airport.upper(),
        scheduled_departure=payload.scheduled_departure,
        estimated_departure=payload.estimated_departure,
        scheduled_arrival=payload.scheduled_arrival,
        estimated_arrival=payload.estimated_arrival,
        base_price=payload.base_price,
        region_shard=payload.region_shard,
        status="scheduled",
    )
    db.add(flight)

    for seat in _generate_seats(flight.flight_id, aircraft.total_seats, payload.seat_class):
        db.add(seat)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A flight with this number and service date already exists.")

    await db.refresh(flight)
    return flight


@router.patch("/{flight_id}", response_model=FlightOut)
async def update_flight(
    flight_id: str,
    payload: FlightUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Reschedule or edit an existing flight (times, aircraft, route, price, status). Admin only.

    For a pure delay use POST /flights/{id}/delay instead — that also nudges
    the estimated_* timestamps by an offset. This endpoint overwrites fields directly.
    """
    try:
        parsed_id = uuid.UUID(flight_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="flight_id must be a valid flight UUID.")

    result = await db.execute(select(Flight).where(Flight.flight_id == parsed_id))
    flight = result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found.")
    if flight.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Cannot edit a flight that is {flight.status}.")

    updates = payload.model_dump(exclude_unset=True)

    if "aircraft_id" in updates:
        aircraft_result = await db.execute(select(Aircraft).where(Aircraft.aircraft_id == updates["aircraft_id"]))
        if not aircraft_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Aircraft not found.")

    for field, value in updates.items():
        setattr(flight, field, value.upper() if field in ("departure_airport", "arrival_airport") else value)

    if "scheduled_departure" in updates:
        flight.service_date = flight.scheduled_departure.date()

    dep = flight.estimated_departure or flight.scheduled_departure
    arr = flight.estimated_arrival or flight.scheduled_arrival
    if arr <= dep:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Arrival time must be after departure time.")

    await db.commit()
    await db.refresh(flight)
    return flight


@router.post("/{flight_id}/cancel", response_model=FlightOut)
async def cancel_flight(
    flight_id: str,
    payload: FlightCancelRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Cancel a flight. Existing bookings are marked 'cancelled' too (frees the seats
    in the sense that the flight itself is no longer operating), but this does not
    process refunds — that stays a manual/finance step. Admin only."""
    try:
        parsed_id = uuid.UUID(flight_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="flight_id must be a valid flight UUID.")

    result = await db.execute(select(Flight).where(Flight.flight_id == parsed_id))
    flight = result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found.")
    if flight.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Flight is already {flight.status}.")

    flight.status = "cancelled"
    flight.delay_reason = payload.reason

    bookings_result = await db.execute(
        select(Booking).where(Booking.flight_id == flight.flight_id, Booking.status == "confirmed")
    )
    for booking in bookings_result.scalars().all():
        booking.status = "cancelled"

    await db.commit()
    await db.refresh(flight)
    return flight