"""Booking checkout: Redis distributed seat locks + Postgres transactional insert (api.md 1.6)."""
import random
import string
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.db.redis_client import acquire_lock, release_lock
from app.models.schemas import BookingCheckoutRequest, BookingCheckoutResponse
from app.models.sql_models import Booking, Flight, Seat

router = APIRouter()


def _generate_booking_reference() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"AERO-{suffix}"


@router.post("/checkout", response_model=BookingCheckoutResponse)
async def checkout_booking(payload: BookingCheckoutRequest, db: AsyncSession = Depends(get_db)):
    """Submits the final passenger booking and locks in the selected seats.

    `flight_id` is the Postgres Flight.flight_id UUID — the same identifier the
    frontend's search results expose as `FlightSearchResult.id` for single-leg
    itineraries. Multi-leg bookings should call this once per leg.
    """
    if len(payload.seats) != payload.passengers:
        raise HTTPException(status_code=400, detail="Number of seats must match number of passengers.")
    if len(set(payload.seats)) != len(payload.seats):
        raise HTTPException(status_code=400, detail="Duplicate seats in request.")

    try:
        parsed_flight_id = uuid.UUID(payload.flight_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="flight_id must be a valid flight UUID.")

    flight_result = await db.execute(select(Flight).where(Flight.flight_id == parsed_flight_id))
    flight = flight_result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found.")

    lock_keys = [f"lock:seat:{flight.flight_id}:{seat_number}" for seat_number in payload.seats]
    acquired_keys: list[str] = []

    try:
        # Acquire a distributed lock per seat before touching Postgres, so two
        # concurrent checkouts for the same seat can't both succeed.
        for key in lock_keys:
            if not await acquire_lock(key, owner=payload.customer_details.email, ttl_seconds=120):
                raise HTTPException(
                    status_code=409,
                    detail="One or more selected seats are currently being booked by someone else. Please try again.",
                )
            acquired_keys.append(key)

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

        booking_reference = _generate_booking_reference()
        for seat_number in payload.seats:
            seat = seat_by_number[seat_number]
            seat.is_booked = True
            db.add(
                Booking(
                    booking_reference=booking_reference,
                    flight_id=flight.flight_id,
                    seat_id=seat.seat_id,
                    passenger_name=payload.customer_details.name,
                    passenger_email=payload.customer_details.email,
                    price_paid=flight.base_price,
                    status="confirmed",
                )
            )

        await db.commit()

        return BookingCheckoutResponse(
            status="success",
            booking_reference=booking_reference,
            message="Booking Confirmed",
        )

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