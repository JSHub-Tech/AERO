"""Flight schedule, search, and seat-availability endpoints (api.md 1.4 / 1.5 / 1.8)."""
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
            flight_number=f.flight_number,
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

    flight_numbers = [leg["flight_number"] for leg in legs]
    result = await db.execute(
        select(Flight, Aircraft)
        .join(Aircraft, Flight.aircraft_id == Aircraft.aircraft_id)
        .where(Flight.flight_number.in_(flight_numbers))
    )
    aircraft_by_flight_number = {f.flight_number: a for f, a in result.all()}

    path = [legs[0].start_node["iata"]]
    total_price = 0.0
    planes: list[str] = []
    dep_dt: datetime | None = None
    arr_dt: datetime | None = None

    for leg in legs:
        flight_number = leg["flight_number"]
        path.append(leg.end_node["iata"])
        total_price += leg["base_price"] or 0.0

        aircraft = aircraft_by_flight_number.get(flight_number)
        if aircraft:
            planes.append(aircraft.registration_code)

        leg_departure = datetime.fromisoformat(str(leg["departure_time"]))
        leg_arrival = datetime.fromisoformat(str(leg["arrival_time"]))
        if dep_dt is None:
            dep_dt = leg_departure
        arr_dt = leg_arrival

    duration_minutes = int((arr_dt - dep_dt).total_seconds() // 60) if dep_dt and arr_dt else 0

    return FlightSearchResult(
        id="+".join(flight_numbers),
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

    `flight_id` is the flight_number (e.g. "PK300") — the same identifier the
    frontend already uses as `FlightSearchResult.id`, not the internal Postgres UUID.
    """
    flight_result = await db.execute(select(Flight).where(Flight.flight_number == flight_id))
    flight = flight_result.scalar_one_or_none()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found.")

    seats_result = await db.execute(
        select(Seat.seat_number).where(Seat.flight_id == flight.flight_id, Seat.is_booked.is_(True))
    )
    booked_seats = [row[0] for row in seats_result.all()]
    return SeatsAvailabilityOut(booked_seats=booked_seats)
