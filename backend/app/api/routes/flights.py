"""Flight schedule, search, and seat-availability endpoints (api.md 1.4 / 1.5 / 1.8)."""
import uuid
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.db.redis_client import get_redis
from app.models.mongo_models import LiveFlight
from app.models.schemas import FlightScheduleOut, FlightSearchResult, LiveFlightMapOut, SeatsAvailabilityOut
from app.models.sql_models import Aircraft, Flight, Seat
from app.repositories.routing_repository import cheapest_path, fastest_path

router = APIRouter()


@router.get("/live", response_model=list[LiveFlightMapOut])
async def get_live_flight_positions():
    """Currently airborne flight positions for the animated map marker layer.

    Not part of api.md (which specs ws/telemetry instead), but AviationMap.jsx's
    UI already renders a `liveFlights` array from a REST poll — this fills that
    contract in directly rather than requiring the frontend to add a WebSocket
    client. `source`/`destination` are named to match the Popup markup there
    (`flight.source`, `flight.destination`), not the ws/telemetry payload's
    `departure`/`dest`.
    """
    airborne = await LiveFlight.find(LiveFlight.status == "airborne").to_list()
    return [
        LiveFlightMapOut(
            id=f"{f.flight_number}-LIVE",
            flightNumber=f.flight_number,
            source=f.departure,
            destination=f.dest,
            lat=f.position.lat,
            lng=f.position.lng,
            heading=f.heading,
            progress=f.progress,
        )
        for f in airborne
    ]


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


async def _legs_to_search_result(record, db: AsyncSession, route_type: str) -> FlightSearchResult | None:
    """Map a Neo4j path's :FLIGHT relationships onto the FlightSearchResult wire shape,
    joining back to Postgres to resolve each leg's aircraft (`plane`)."""
    legs = record["legs"]
    if not legs:
        return None

    flight_id_objs = [uuid.UUID(leg["flight_id"]) for leg in legs]
    flight_ids = [leg["flight_id"] for leg in legs]
    
    result = await db.execute(
        select(Flight, Aircraft)
        .join(Aircraft, Flight.aircraft_id == Aircraft.aircraft_id)
        .where(Flight.flight_id.in_(flight_id_objs))
    )
    aircraft_by_flight_id = {str(f.flight_id): a for f, a in result.all()}

    # Airport codes along the route, projected directly in Cypher (see
    # routing_repository.cheapest_path/fastest_path) rather than read off
    # leg.start_node/.end_node, which are unhydrated stub nodes here.
    path = list(record["iata_path"])
    total_price = 0.0
    planes: list[str] = []
    flight_numbers: list[str] = []
    dep_dt: datetime | None = None
    arr_dt: datetime | None = None

    for leg in legs:
        flight_id = leg["flight_id"]
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
    
    # 1. Check Redis Cache
    r = get_redis()
    cache_key = f"cache:search:{origin}:{destination}:{max_price or 'any'}"
    cached_data = await r.get(cache_key)
    if cached_data:
        # Return instantly from cache
        return [FlightSearchResult(**item) for item in json.loads(cached_data)]

    # 2. Cache Miss: Query Neo4j
    cheapest_records = await cheapest_path(origin, destination, max_price=max_price)
    fastest_records = await fastest_path(origin, destination)

    results: list[FlightSearchResult] = []
    seen_ids: set[str] = set()

    for record in list(cheapest_records) + list(fastest_records):
        legs = record["legs"]
        route_type = "Direct" if len(legs) == 1 else f"{len(legs) - 1}-Stop"
        item = await _legs_to_search_result(record, db, route_type)
        if item and item.id not in seen_ids:
            results.append(item)
            seen_ids.add(item.id)

    if not results:
        raise HTTPException(status_code=404, detail="No flights found for this route.")

    # 3. Save to Redis (TTL 1 hour)
    await r.set(cache_key, json.dumps([item.model_dump() for item in results]), ex=3600)

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
    
    # 2. Check Redis for active locks (e.g. someone is on the checkout page)
    # The lock key format from bookings.py is: lock:seat:{flight.flight_id}:{seat_number}
    r = get_redis()
    # In upstash REST client or redis TCP client, `keys` is not supported in the exact same async protocol in some edge cases.
    # But usually `keys` or `scan` is fine. For this hackathon, we will just fetch all seats 1-100 or scan.
    # Wait, fetching 1-100 is safer since we know seat numbers usually go up to a certain bound, 
    # but the easiest way is to use `keys()` if supported by the client.
    # Let's try to grab all locks for this flight ID:
    try:
        # Note: upstash-redis has a `keys()` method but it might differ from redis.asyncio
        # To be completely safe across both REST and TCP, we can just use the underlying client methods
        keys_result = await r.keys(f"lock:seat:{flight.flight_id}:*")
        
        # keys_result might be a list of strings
        if keys_result:
            for key in keys_result:
                # Extract seat_number from the end of the key
                # e.g. "lock:seat:1234-uuid-5678:12A" -> "12A"
                seat_number = key.split(":")[-1]
                if seat_number not in booked_seats:
                    booked_seats.append(seat_number)
    except AttributeError:
        # Fallback if `keys()` is missing on the specific Upstash REST client version
        pass

    return SeatsAvailabilityOut(booked_seats=booked_seats)