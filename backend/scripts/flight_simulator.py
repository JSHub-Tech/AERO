"""
scripts/flight_simulator.py

Async flight telemetry simulator.

  - Polls Postgres every 5 seconds for active flights.
  - Drives a state machine: scheduled → boarding → final_call → airborne → completed.
  - On takeoff: inserts a LiveFlight document into MongoDB.
  - While airborne: linearly interpolates position between departure and arrival
    airports and updates the MongoDB document (triggers Change Stream → WebSocket).
  - On landing: marks the flight completed in Postgres and MongoDB, then prunes
    the Neo4j FLIGHT edge so it no longer appears in routing results.

Run with:
    python scripts/flight_simulator.py

Stop with Ctrl-C.
"""

import asyncio
import math
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Allow importing from the project root
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.db.postgres import db_session
from app.db.mongodb import init_mongo, close_mongo
from app.models.sql_models import Flight, Airport
from app.models.mongo_models import LiveFlight, GeoPoint
from app.repositories.routing_repository import prune_flight_edge


# ── Config ────────────────────────────────────────────────────────────────────

POLL_INTERVAL_SECONDS = 5

# How many minutes before scheduled departure each state gate opens
BOARDING_GATE_MINUTES   = 45
FINAL_CALL_GATE_MINUTES = 15

ACTIVE_STATUSES = ("scheduled", "boarding", "final_call", "delayed", "airborne")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ensure_tz(dt: datetime) -> datetime:
    """Attach UTC timezone if the datetime is naive."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def interpolate_position(
    start: tuple[float, float],
    end: tuple[float, float],
    progress: float,
) -> GeoPoint:
    """Linear interpolation of (lat, lng) based on flight progress 0.0 → 1.0."""
    lat = start[0] + (end[0] - start[0]) * max(0.0, min(1.0, progress))
    lng = start[1] + (end[1] - start[1]) * max(0.0, min(1.0, progress))
    return GeoPoint(lat=lat, lng=lng)


def compute_bearing(start: tuple[float, float], end: tuple[float, float]) -> float:
    """Great-circle initial bearing in degrees (0-360) from start -> end, for the
    `heading` field the frontend uses to rotate the plane icon."""
    lat1, lon1 = math.radians(start[0]), math.radians(start[1])
    lat2, lon2 = math.radians(end[0]), math.radians(end[1])
    delta_lon = lon2 - lon1
    x = math.sin(delta_lon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(delta_lon)
    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360) % 360


# ── State-machine handlers ────────────────────────────────────────────────────

async def _handle_pre_flight(
    flight: Flight,
    now: datetime,
    dep_time: datetime,
) -> None:
    """Advance a pre-departure flight through boarding → final_call → airborne."""
    if flight.status in ("scheduled", "boarding", "final_call", "delayed"):
        if now >= dep_time - timedelta(minutes=BOARDING_GATE_MINUTES) and flight.status == "scheduled":
            flight.status = "boarding"
            print(f"[BOARDING]    {flight.flight_number}")

        if now >= dep_time - timedelta(minutes=FINAL_CALL_GATE_MINUTES) and flight.status in ("scheduled", "boarding"):
            flight.status = "final_call"
            print(f"[FINAL CALL]  {flight.flight_number}")


async def _handle_takeoff(
    flight: Flight,
    now: datetime,
    dep_time: datetime,
    coords: dict[str, tuple[float, float]],
) -> None:
    """Transition a flight to airborne and initialise MongoDB telemetry."""
    if flight.status in ("scheduled", "boarding", "final_call", "delayed") and now >= dep_time:
        flight.status = "airborne"
        print(f"[TAKEOFF]     {flight.flight_number} ✈")

        start = coords.get(flight.departure_airport.upper(), (0.0, 0.0))
        end = coords.get(flight.arrival_airport.upper(), (0.0, 0.0))
        live = LiveFlight(
            flight_number=flight.flight_number,
            status="airborne",
            departure=flight.departure_airport,
            dest=flight.arrival_airport,
            position=GeoPoint(lat=start[0], lng=start[1]),
            heading=compute_bearing(start, end),
            progress=0.0,
            updated_at=now,
        )
        await live.insert()


async def _handle_airborne(
    flight: Flight,
    now: datetime,
    dep_time: datetime,
    arr_time: datetime,
    coords: dict[str, tuple[float, float]],
) -> None:
    """Update telemetry or mark landed."""
    if now >= arr_time:
        # ── Landed ──
        flight.status = "completed"
        print(f"[LANDED]      {flight.flight_number} 🛬")

        live = await LiveFlight.find_one(LiveFlight.flight_number == flight.flight_number)
        if live:
            live.status = "completed"
            live.progress = 1.0
            live.updated_at = now
            await live.save()

        # Prune from Neo4j so completed routes vanish from search results.
        # Must use flight_id (unique) — flight_number recurs across service_dates,
        # so pruning by flight_number would delete every future occurrence too.
        try:
            await prune_flight_edge(flight.flight_id)
            print(f"[NEO4J PRUNE] {flight.flight_number} ({flight.service_date}) edge removed.")
        except Exception as e:
            print(f"[NEO4J WARN]  Could not prune {flight.flight_number} ({flight.flight_id}): {e}")

    else:
        # ── In-flight telemetry update ──
        total_sec = (arr_time - dep_time).total_seconds()
        elapsed   = (now - dep_time).total_seconds()
        progress  = elapsed / total_sec if total_sec > 0 else 1.0

        start = coords.get(flight.departure_airport.upper(), (0.0, 0.0))
        end   = coords.get(flight.arrival_airport.upper(), (0.0, 0.0))
        pos   = interpolate_position(start, end, progress)

        heading = compute_bearing(start, end)

        live = await LiveFlight.find_one(LiveFlight.flight_number == flight.flight_number)
        if live:
            live.position   = pos
            live.heading    = heading
            live.progress   = progress
            live.updated_at = now
            await live.save()
            print(
                f"[TELEMETRY]   {flight.flight_number}  "
                f"lat={pos.lat:.4f} lng={pos.lng:.4f}  "
                f"({progress * 100:.1f}%)"
            )
        else:
            # Simulator restarted after takeoff — re-create the document
            await LiveFlight(
                flight_number=flight.flight_number,
                status="airborne",
                departure=flight.departure_airport,
                dest=flight.arrival_airport,
                position=pos,
                heading=heading,
                progress=progress,
                updated_at=now,
            ).insert()
            print(f"[TELEMETRY]   {flight.flight_number} — late-join document created.")


# ── Main loop ─────────────────────────────────────────────────────────────────

async def run_simulator_loop() -> None:
    await init_mongo()
    print("✈️  AERO Flight Simulator started — polling Postgres every "
          f"{POLL_INTERVAL_SECONDS}s\n")

    try:
        while True:
            try:
                now = datetime.now(timezone.utc)

                async with db_session() as session:
                    # Fetch all non-completed flights
                    flights_result = await session.execute(
                        select(Flight).where(Flight.status.in_(ACTIVE_STATUSES))
                    )
                    active_flights = flights_result.scalars().all()

                    # Preload all airport coordinates in one query
                    airports_result = await session.execute(select(Airport))
                    coords: dict[str, tuple[float, float]] = {
                        a.iata.upper(): (a.latitude, a.longitude)
                        for a in airports_result.scalars().all()
                    }

                    for flight in active_flights:
                        dep_time = _ensure_tz(
                            flight.estimated_departure or flight.scheduled_departure
                        )
                        arr_time = _ensure_tz(
                            flight.estimated_arrival or flight.scheduled_arrival
                        )

                        if flight.status == "airborne":
                            await _handle_airborne(flight, now, dep_time, arr_time, coords)
                        else:
                            await _handle_pre_flight(flight, now, dep_time)
                            # Check again after possible state advance
                            await _handle_takeoff(flight, now, dep_time, coords)

                    await session.commit()

            except Exception as exc:
                print(f"[ERROR] Simulator loop: {exc}")

            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    except asyncio.CancelledError:
        print("\nSimulator cancelled — shutting down cleanly.")
    finally:
        await close_mongo()
        print("Simulator stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(run_simulator_loop())
    except KeyboardInterrupt:
        print("\nSimulator stopped by user.")