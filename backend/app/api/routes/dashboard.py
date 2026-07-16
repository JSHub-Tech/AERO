"""Live Operations dashboard endpoints.

Not part of api.md (which specs ws/operations instead), but LiveOperations.jsx
already polls these three REST routes every 15s via services/api.js
(getActiveFlights/getOnboardingFlights/getDelayedFlights) — implemented here
directly so the existing UI works without adding a WebSocket client.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.models.schemas import DashboardDelayedResponse, DashboardFlightsResponse
from app.models.sql_models import Flight

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
                "flightNum": f.flight_number,
                "source": f.departure_airport,
                "dest": f.arrival_airport,
                "targetTime": (f.estimated_arrival or f.scheduled_arrival).isoformat(),
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
                "flightNum": f.flight_number,
                "source": f.departure_airport,
                "dest": f.arrival_airport,
                "targetTime": (f.estimated_departure or f.scheduled_departure).isoformat(),
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
            "flightNum": f.flight_number,
            "source": f.departure_airport,
            "dest": f.arrival_airport,
            "delayTime": delay_time,
        })

    return DashboardDelayedResponse(flights=items)
