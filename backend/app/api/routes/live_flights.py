"""Live flight REST snapshot (point-in-time reads of MongoDB telemetry).

Real-time streaming now lives in app/api/routes/telemetry.py, exposed at the
exact ws/telemetry path required by api.md 2.1. This file keeps the plain
REST GETs as a convenience for polling/debugging without opening a socket.
"""
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.mongo_models import LiveFlight
from app.models.schemas import LiveFlightOut

router = APIRouter()


@router.get("", response_model=List[LiveFlightOut])
async def get_live_flights():
    """Get all currently airborne flights from MongoDB."""
    flights = await LiveFlight.find(LiveFlight.status == "airborne").to_list()
    return flights


@router.get("/{flight_number}", response_model=LiveFlightOut)
async def get_live_flight(flight_number: str):
    """Get the live tracking data for a specific flight."""
    flight = await LiveFlight.find_one(LiveFlight.flight_number == flight_number)
    if not flight:
        raise HTTPException(status_code=404, detail="Live flight not found or has landed.")
    return flight
