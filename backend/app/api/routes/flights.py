"""Flight schedule, search, and seat-availability endpoints (api.md 1.4 / 1.5 / 1.8)."""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.models.schemas import FlightScheduleOut, FlightSearchResult, SeatsAvailabilityOut
from app.models.sql_models import Aircraft, Flight, Seat
from app.repositories.routing_repository import cheapest_path, fastest_path

router = APIRouter()


@router.get("/schedule", response_model=list[FlightScheduleOut])
async def get_flight_schedule(db: AsyncSession = Depends(get_db)):
    """Static daily schedule — 'Live Flight Schedule' tables."""
    result = await db.execute(select(Flight).order_by(Flight.scheduled_departure))
    flights = result.scalars().all()
    return [
        FlightScheduleOut(
            flight_number=f.flight_number,          # raw CSV value, e.g. "PK1000" — no more "_1" suffix
            service_date=f.service_date.isoformat(),
            departure_airport=f.departure_airport,
            arrival_airport=f.arrival_airport,
            departure_time_of_day=f.scheduled_departure.strftime("%H:%M"),
            arrival_time_of_day=f.scheduled_arrival.strftime("%H:%M"),
        )
        for f in flights
    ]


def _format_duration(minutes: int) -> str:
    hours, mins = divmod(max(minutes, 0), 60)
    return f"{hours}h {mins}m"


async def _legs_to_search_result(legs, db: AsyncSession, route_type: str) -> FlightSearchResult | None:
    """Map a Neo4j path's :FLIGHT relationships onto the FlightSearchResult wire shape,
    joining back to Postgres to resolve each leg's aircraft (`plane`)."""
    if not legs:
        return None

    flight_ids = [leg["flight_id"] for leg in legs]
    result = await db.execute(
        select(Flight, Aircraft)
        .join(Aircraft, Flight.aircraft_id == Aircraft.aircraft_id)
        .where(Flight.flight_id.in_(flight_ids))
    )
    aircraft_by_flight_id = {str(f.flight_id): a for f, a in result.all()}

    path = [legs[0].start_node["iata"]]
    total_price = 0.0
    planes: list[str] = []
    flight_numbers: list[str] = []
    dep_dt: datetime | None = None
    arr_dt: datetime | None = None

    for leg in legs:
        flight_id = leg["flight_id"]
        path.append(leg.end_node["iata"])
        total_price += leg["base_price"] or 0.0
        flight_numbers.append(leg["flight_number"])

        aircraft = aircraft_by_flight_id.get(flight_id)
        if aircraft:
            planes.append(aircraft.registration_code)

        leg_departure = datetime.fromisoformat(str(leg["departure_time"]))
        leg_arrival = datetime.fromisoformat(str(leg["arrival_time"]))
        if dep_dt is None:
            dep_dt = leg_departure
        arr_dt = leg_arrival

    duration_minutes = int((arr_dt - dep_dt).total_seconds() // 60) if dep_dt and arr_dt else 0

    return FlightSearchResult(
        id="+".join(flight_ids),                 # booking key — always unique
        flight_number="+".join(flight_numbers),   # display label only, e.g. "PK1000+PK1002"
        departureTime=dep_dt.strftime("%I:%M %p") if dep_dt else "",
        arrivalTime=arr_dt.strftime("%I:%M %p") if arr_dt else "",
        duration=_format_duration(duration_minutes),
        price=f"${total_price:.0f}",
        path=path,
        type=route_type,
        plane="+".join(planes) if planes else "N/A",
    )


@router.get("/search", response_model=list[FlightSearchResult])
async def search_flights(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    date: str | None = None,  # accepted for API-contract compatibility; schedule is generated forward from "today" by the seeder
    flex: int = 0,            # accepted for API-contract compatibility; not yet used to widen the date window
    max_price: float | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Flights matching Origin/Destination (+ optional max_price), backed by Neo4j path search."""
    origin, destination = origin.upper(), destination.upper()

    cheapest_records = await cheapest_path(origin, destination, max_price=max_price)
    fastest_records = await fastest_path(origin, destination)

    results: list[FlightSearchResult] = []
    seen_ids: set[str] = set()

    for record in list(cheapest_records) + list(fastest_records):
        legs = record["legs"]
        route_type = "Direct" if len(legs) == 1 else f"{len(legs) - 1}-Stop"
        item = await _legs_to_search_result(legs, db, route_type)
        if item and item.id not in seen_ids:
            results.append(item)
            seen_ids.add(item.id)

    if not results:
        raise HTTPException(status_code=404, detail="No flights found for this route.")

    return results


@router.get("/seats/{flight_id}", response_model=SeatsAvailabilityOut)
async def get_flight_seats(flight_id: str, db: AsyncSession = Depends(get_db)):
    """Booked seat numbers for a flight, so they can be greyed out on the seat map.

    `flight_id` is the Postgres Flight.flight_id UUID — the same identifier the
    frontend gets back as `FlightSearchResult.id` for single-leg results. For
    multi-leg itineraries, call this once per leg using each "+"-separated segment.
    """
    try:
        parsed_id = uuid.UUID(flight_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="flight_id must be a valid flight UUID.")

    flight_result = await db.execute(select(Flight).where(Flight.flight_id == parsed_id))
    flight = flight_result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found.")

    seats_result = await db.execute(
        select(Seat.seat_number).where(Seat.flight_id == flight.flight_id, Seat.is_booked.is_(True))
    )
    booked_seats = [row[0] for row in seats_result.all()]
    return SeatsAvailabilityOut(booked_seats=booked_seats)