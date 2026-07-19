"""Live Operations dashboard endpoints.

Not part of api.md (which specs ws/operations instead), but LiveOperations.jsx
already polls these three REST routes every 15s via services/api.js
(getActiveFlights/getOnboardingFlights/getDelayedFlights) — implemented here
directly so the existing UI works without adding a WebSocket client.
"""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies import require_admin
from app.models.schemas import DashboardDelayedResponse, DashboardFlightsResponse, DashboardSummaryOut
from app.models.sql_models import Aircraft, Booking, Flight, Seat, User

router = APIRouter()


def _ensure_tz(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.get("/active-flights", response_model=DashboardFlightsResponse)
async def get_active_flights(db: AsyncSession = Depends(get_db)):
    """'Active In-Air' panel — targetTime is each flight's arrival ETA."""
    result = await db.execute(select(Flight).where(Flight.status == "airborne"))
    flights = result.scalars().all()
    return DashboardFlightsResponse(
        flights=[
            {
                "id": str(f.flight_id),
                "flightNum": f.flight_number,
                "source": f.departure_airport,
                "dest": f.arrival_airport,
                "targetTime": _ensure_tz(f.estimated_arrival or f.scheduled_arrival).isoformat(),
            }
            for f in flights
        ]
    )


@router.get("/onboarding-flights", response_model=DashboardFlightsResponse)
async def get_onboarding_flights(db: AsyncSession = Depends(get_db)):
    """'Boarding' panel — targetTime is each flight's departure ETD."""
    result = await db.execute(select(Flight).where(Flight.status.in_(("boarding", "final_call"))))
    flights = result.scalars().all()
    return DashboardFlightsResponse(
        flights=[
            {
                "id": str(f.flight_id),
                "flightNum": f.flight_number,
                "source": f.departure_airport,
                "dest": f.arrival_airport,
                "targetTime": _ensure_tz(f.estimated_departure or f.scheduled_departure).isoformat(),
            }
            for f in flights
        ]
    )


@router.get("/delayed-flights", response_model=DashboardDelayedResponse)
async def get_delayed_flights(db: AsyncSession = Depends(get_db)):
    """'Delayed Warnings' panel — delayTime is a display string, not a timestamp.

    NOTE: nothing currently transitions Flight.status to "delayed" (see ToDo.md)
    so this will return an empty list until that's wired into the simulator or
    an ops-input path. The mapping logic below is ready for whenever it is.
    """
    result = await db.execute(select(Flight).where(Flight.status == "delayed"))
    flights = result.scalars().all()

    items = []
    for f in flights:
        delay_time = "Delayed"
        if f.estimated_departure and f.scheduled_departure:
            diff_minutes = int(
                (_ensure_tz(f.estimated_departure) - _ensure_tz(f.scheduled_departure)).total_seconds() // 60
            )
            if diff_minutes > 0:
                delay_time = f"{diff_minutes}m"
        elif f.delay_reason:
            delay_time = f.delay_reason

        items.append({
            "id": str(f.flight_id),
            "flightNum": f.flight_number,
            "source": f.departure_airport,
            "dest": f.arrival_airport,
            "delayTime": delay_time,
        })

    return DashboardDelayedResponse(flights=items)


@router.get("/summary", response_model=DashboardSummaryOut)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """Command Center overview cards: today's revenue/bookings, on-time %,
    load factor, fleet/user counts. Admin only."""
    today = date.today()

    todays_flights_result = await db.execute(select(Flight).where(Flight.service_date == today))
    todays_flights = todays_flights_result.scalars().all()
    todays_flight_ids = [f.flight_id for f in todays_flights]

    on_time_count = sum(1 for f in todays_flights if f.status not in ("delayed", "cancelled"))
    on_time_pct = round((on_time_count / len(todays_flights)) * 100, 1) if todays_flights else 100.0

    active_flights = sum(1 for f in todays_flights if f.status == "airborne")
    delayed_flights = sum(1 for f in todays_flights if f.status == "delayed")

    total_seats_today = 0
    booked_seats_today = 0
    if todays_flight_ids:
        seat_counts = await db.execute(
            select(Seat.flight_id, func.count(Seat.seat_id), func.sum(func.cast(Seat.is_booked, Integer)))
            .where(Seat.flight_id.in_(todays_flight_ids))
            .group_by(Seat.flight_id)
        )
        for _, total, booked in seat_counts.all():
            total_seats_today += total or 0
            booked_seats_today += booked or 0
    load_factor_pct = round((booked_seats_today / total_seats_today) * 100, 1) if total_seats_today else 0.0

    todays_bookings_result = await db.execute(
        select(func.count(Booking.booking_id), func.coalesce(func.sum(Booking.price_paid), 0.0))
        .where(func.date(Booking.created_at) == today, Booking.status == "confirmed")
    )
    todays_bookings_count, todays_revenue = todays_bookings_result.one()

    fleet_result = await db.execute(select(Aircraft.status, func.count(Aircraft.aircraft_id)).group_by(Aircraft.status))
    fleet_by_status = dict(fleet_result.all())
    fleet_size = sum(fleet_by_status.values())
    aircraft_in_maintenance = fleet_by_status.get("maintenance", 0)

    total_users_result = await db.execute(select(func.count(User.user_id)))
    total_users = total_users_result.scalar_one()

    total_bookings_result = await db.execute(select(func.count(Booking.booking_id)))
    total_bookings_all_time = total_bookings_result.scalar_one()

    return DashboardSummaryOut(
        todays_revenue=float(todays_revenue or 0),
        todays_bookings=todays_bookings_count or 0,
        todays_flights=len(todays_flights),
        on_time_pct=on_time_pct,
        load_factor_pct=load_factor_pct,
        active_flights=active_flights,
        delayed_flights=delayed_flights,
        fleet_size=fleet_size,
        aircraft_in_maintenance=aircraft_in_maintenance,
        total_users=total_users,
        total_bookings_all_time=total_bookings_all_time,
    )
