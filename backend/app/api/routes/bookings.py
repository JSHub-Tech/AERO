"""Booking checkout: Redis distributed seat locks + Postgres transactional insert.

Endpoint intentionally matches the frontend's existing services/api.js call
(bookFlight(flightId, seats, passengers) -> POST /flights/book) rather than
api.md's originally-documented POST /booking/checkout — the frontend is what
actually needs to work against.
"""
import random
import string
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.db.redis_client import acquire_lock, release_lock
from app.api.dependencies import get_current_user, require_admin
from app.models.schemas import BookFlightRequest, BookFlightResponse, BookingOut
from app.models.sql_models import Booking, Flight, Seat, User

router = APIRouter()


def _generate_pnr() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"AERO-{suffix}"


@router.post("/book", response_model=BookFlightResponse)
async def book_flight(
    payload: BookFlightRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submits the final passenger booking and locks in the selected seats.

    `flightId` is the Postgres Flight.flight_id UUID — the same identifier the
    frontend's search results expose as `FlightSearchResult.id`.
    """
    if len(payload.seats) != payload.passengers:
        raise HTTPException(status_code=400, detail="Number of seats must match number of passengers.")
    if len(set(payload.seats)) != len(payload.seats):
        raise HTTPException(status_code=400, detail="Duplicate seats in request.")

    try:
        parsed_flight_ids = [uuid.UUID(fid) for fid in payload.flightId.split("+")]
    except ValueError:
        raise HTTPException(status_code=400, detail="flightId must be a valid flight UUID or a '+' separated list of UUIDs.")

    flight_result = await db.execute(select(Flight).where(Flight.flight_id.in_(parsed_flight_ids)))
    flights = flight_result.scalars().all()
    if len(flights) != len(parsed_flight_ids):
        raise HTTPException(status_code=404, detail="One or more flights not found.")

    lock_owner = f"user:{current_user.user_id}"
    
    lock_keys = []
    for flight in flights:
        for seat_number in payload.seats:
            lock_keys.append(f"lock:seat:{flight.flight_id}:{seat_number}")
            
    acquired_keys: list[str] = []

    try:
        # Acquire a distributed lock per seat before touching Postgres, so two
        # concurrent checkouts for the same seat can't both succeed.
        for key in lock_keys:
            if not await acquire_lock(key, owner=lock_owner, ttl_seconds=120):
                raise HTTPException(
                    status_code=409,
                    detail="One or more selected seats are currently being booked by someone else. Please try again.",
                )
            acquired_keys.append(key)

        pnr = _generate_pnr()
        passenger_name = payload.customerDetails.name if payload.customerDetails else None
        passenger_email = payload.customerDetails.email if payload.customerDetails else None

        for flight in flights:
            seats_result = await db.execute(
                select(Seat).where(Seat.flight_id == flight.flight_id, Seat.seat_number.in_(payload.seats))
            )
            seat_by_number = {seat.seat_number: seat for seat in seats_result.scalars().all()}

            missing_seats = [s for s in payload.seats if s not in seat_by_number]
            if missing_seats:
                raise HTTPException(status_code=404, detail=f"Seats not found on this flight: {', '.join(missing_seats)}")

            already_booked = [s for s, seat in seat_by_number.items() if seat.is_booked]
            if already_booked:
                raise HTTPException(status_code=409, detail=f"Seats already booked: {', '.join(already_booked)}")

            for seat_number in payload.seats:
                seat = seat_by_number[seat_number]
                seat.is_booked = True
                db.add(
                    Booking(
                        booking_reference=pnr,
                        user_id=current_user.user_id,
                        flight_id=flight.flight_id,
                        seat_id=seat.seat_id,
                        passenger_name=passenger_name,
                        passenger_email=passenger_email,
                        price_paid=flight.base_price,
                        status="confirmed",
                    )
                )

        await db.commit()

        return BookFlightResponse(success=True, pnr=pnr)

    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        raise
    finally:
        # Always release whatever locks this request acquired, success or failure.
        for key in acquired_keys:
            await release_lock(key)

def _booking_to_out(booking: Booking, flight: Flight | None, seat: Seat | None, account_email: str | None) -> BookingOut:
    return BookingOut(
        booking_id=booking.booking_id,
        booking_reference=booking.booking_reference,
        user_id=booking.user_id,
        flight_id=booking.flight_id,
        seat_id=booking.seat_id,
        passenger_name=booking.passenger_name,
        passenger_email=booking.passenger_email,
        price_paid=booking.price_paid,
        status=booking.status,
        created_at=booking.created_at,
        flight_number=flight.flight_number if flight else None,
        departure_airport=flight.departure_airport if flight else None,
        arrival_airport=flight.arrival_airport if flight else None,
        scheduled_departure=flight.scheduled_departure if flight else None,
        account_email=account_email,
        seat_number=seat.seat_number if seat else None,
    )


@router.get("", response_model=list[BookingOut])
async def get_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve bookings based on role. Admins see all (with flight/seat/account
    details joined in for the Command Center bookings table), users see their own."""
    query = (
        select(Booking, Flight, Seat, User)
        .join(Flight, Booking.flight_id == Flight.flight_id)
        .join(Seat, Booking.seat_id == Seat.seat_id)
        .join(User, Booking.user_id == User.user_id)
        .order_by(Booking.created_at.desc())
    )
    if current_user.role != "admin":
        query = query.where(Booking.user_id == current_user.user_id)

    result = await db.execute(query)
    return [
        _booking_to_out(booking, flight, seat, account.email)
        for booking, flight, seat, account in result.all()
    ]


@router.delete("/{booking_id}", response_model=BookingOut)
async def cancel_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Cancel a booking and free its seat. Admin only (a refund is a finance-side
    step this doesn't perform, but the seat is released for re-sale immediately)."""
    try:
        parsed_id = uuid.UUID(booking_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="booking_id must be a valid UUID.")

    result = await db.execute(select(Booking).where(Booking.booking_id == parsed_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled.")

    booking.status = "cancelled"

    seat_result = await db.execute(select(Seat).where(Seat.seat_id == booking.seat_id))
    seat = seat_result.scalar_one_or_none()
    if seat:
        seat.is_booked = False

    await db.commit()
    await db.refresh(booking)

    flight_result = await db.execute(select(Flight).where(Flight.flight_id == booking.flight_id))
    flight = flight_result.scalar_one_or_none()
    account_result = await db.execute(select(User).where(User.user_id == booking.user_id))
    account = account_result.scalar_one_or_none()
    return _booking_to_out(booking, flight, seat, account.email if account else None)