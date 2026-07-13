"""
scripts/create_postgres_tables.py

DROP + CREATE all Postgres tables on Supabase, then seed every table from
the five CSV dataset files that live in frontend/public/:

    airport.csv          -> airport
    airport_details.csv  -> airport  (enrichment columns)
    fleet.csv            -> aircraft
    flight_schedule.csv  -> flight + seat  (generates today's departures)
    (routes.csv is used only for duration calculation — not a separate table)

Always runs end-to-end — the old marker-skip behaviour is removed so that
re-running always drops and re-seeds. Run with:

    python scripts/create_postgres_tables.py
"""

import asyncio
import csv
import json
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import engine, Base, AsyncSessionLocal
from app.models import sql_models  # registers all ORM classes on Base.metadata
from app.models.sql_models import Airport, Aircraft, Flight, Seat

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPTS_DIR  = Path(__file__).resolve().parent
ROOT_DIR     = SCRIPTS_DIR.parent
PUBLIC_DIR   = ROOT_DIR.parent / "frontend" / "public"
MARKER       = SCRIPTS_DIR / ".markers" / "postgres.done"

CSV_AIRPORTS         = PUBLIC_DIR / "airport.csv"
CSV_AIRPORT_DETAILS  = PUBLIC_DIR / "airport_details.csv"
CSV_FLEET            = PUBLIC_DIR / "fleet.csv"
CSV_FLIGHT_SCHEDULE  = PUBLIC_DIR / "flight_schedule.csv"
CSV_ROUTES           = PUBLIC_DIR / "routes.csv"

# PKR → USD conversion (approximate)
PKR_TO_USD = 1 / 278.0

# Seat-class distribution per aircraft type
SEAT_CLASS_CONFIG = {
    "Boeing 777-300ER": [
        ("first",           8),
        ("business",       42),
        ("premium_economy", 35),
        ("economy",       308),
    ],
    "Airbus A320-200": [
        ("business",       12),
        ("economy",       158),
    ],
    "ATR 72-500": [
        ("economy",        70),
    ],
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def read_csv(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def parse_days(raw: str) -> list[int]:
    """'[1, 2, 3]' -> [1, 2, 3]"""
    try:
        return json.loads(raw.strip())
    except Exception:
        return list(range(1, 8))


def next_departure_for_day(time_str: str, day_iso: int) -> datetime:
    """
    Return the next UTC datetime whose weekday (ISO Mon=1…Sun=7) matches
    `day_iso` and whose time-of-day matches `time_str` ('HH:MM:SS').

    We always look forward from today so the simulator has real upcoming flights.
    """
    now_utc = datetime.now(timezone.utc)
    h, m, s = (int(x) for x in time_str.split(":"))

    # Walk days forward until we land on the right weekday
    for offset in range(7):
        candidate = (now_utc + timedelta(days=offset)).replace(
            hour=h, minute=m, second=s, microsecond=0
        )
        if candidate.isoweekday() == day_iso and candidate > now_utc:
            return candidate

    # Fallback: same weekday next week
    today_iso = now_utc.isoweekday()
    diff = (day_iso - today_iso) % 7 or 7
    return (now_utc + timedelta(days=diff)).replace(hour=h, minute=m, second=s, microsecond=0)


def build_seat_rows(flight_id: uuid.UUID, model: str) -> list[Seat]:
    """Generate individual Seat rows for a given aircraft model."""
    config = SEAT_CLASS_CONFIG.get(model, [("economy", 100)])
    rows = []
    seat_num = 1
    for seat_class, count in config:
        for _ in range(count):
            rows.append(
                Seat(
                    seat_id=uuid.uuid4(),
                    flight_id=flight_id,
                    seat_number=str(seat_num),
                    seat_class=seat_class,
                    is_booked=False,
                )
            )
            seat_num += 1
    return rows


def determine_shard(iata: str) -> str:
    """Map departure IATA to a regional shard label."""
    PAK = {"ISB", "KHI", "LHE", "PEW", "MUX", "RUH", "SKZ",
           "GWD", "BHV", "WNS", "LYP", "CJL", "GIL", "TUK",
           "PZH", "SYW", "BDN", "MJD", "KDD", "REQ", "NJF",
           "SWN", "ATG", "WAF", "HDD", "LRG", "GRT", "OHT",
           "RYK", "PSI", "UET", "TFT", "PB",  "DSK", "KBH",
           "MFG", "AAW", "RZS", "SDK", "KDU", "NJF"}
    GULF = {"DXB", "AUH", "DOH", "KWI", "BAH", "MCT", "RUH",
            "DMM", "MED", "JED", "AAN", "ELQ", "SHJ", "DAC"}
    EUROPE = {"LHR", "CDG", "BCN", "CPH", "MAN", "OSL", "MXP",
              "NRT", "PEK", "BKK", "KUL", "IST", "GYD", "TIF",
              "YYZ", "TIF", "YYZ"}
    if iata in PAK:
        return "pakistan"
    if iata in GULF:
        return "gulf"
    if iata in EUROPE:
        return "europe"
    return "international"


# ── Stage 0 – Drop & recreate schema ─────────────────────────────────────────

async def drop_and_create_schema() -> None:
    print("[postgres] Dropping all existing tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("[postgres] Creating tables from ORM metadata...")
        await conn.run_sync(Base.metadata.create_all)
    print("[postgres] Schema ready: " + ", ".join(Base.metadata.tables.keys()))


# ── Stage 1 – Airports ───────────────────────────────────────────────────────

async def seed_airports(session: AsyncSession) -> None:
    print("[postgres] Seeding airports...")

    # Index airport_details by code for O(1) lookup
    details_map: dict[str, dict] = {}
    for row in read_csv(CSV_AIRPORT_DETAILS):
        details_map[row["Airport_Code"].strip().upper()] = row

    airports = []
    for row in read_csv(CSV_AIRPORTS):
        code = row["Airport_Code"].strip().upper()
        airports.append(
            Airport(
                iata=code,
                name=row["Airport Name"].strip(),
                city=row["City"].strip(),
                country=row["Country"].strip(),
                latitude=float(row["Latitude"]),
                longitude=float(row["Longitude"]),
            )
        )

    session.add_all(airports)
    await session.flush()
    print(f"  -> {len(airports)} airports inserted.")


# ── Stage 2 – Aircraft (fleet) ───────────────────────────────────────────────

async def seed_aircraft(session: AsyncSession) -> dict[str, uuid.UUID]:
    """Returns mapping aircraft_id_str -> UUID for use in flight seeding."""
    print("[postgres] Seeding aircraft fleet...")

    aircraft_map: dict[str, uuid.UUID] = {}
    for row in read_csv(CSV_FLEET):
        ac_id   = row["Aircraft_ID"].strip()
        model   = row["Model"].strip()
        seats   = int(row["Total_Seats"])
        new_id  = uuid.uuid4()

        # Derive manufacturer from model string
        if model.startswith("Boeing"):
            manufacturer = "Boeing"
        elif model.startswith("Airbus"):
            manufacturer = "Airbus"
        elif model.startswith("ATR"):
            manufacturer = "ATR"
        else:
            manufacturer = model.split()[0]

        obj = Aircraft(
            aircraft_id=new_id,
            registration_code=ac_id,   # e.g. "B777-01"
            manufacturer=manufacturer,
            model=model,
            total_seats=seats,
            status="active",
        )
        session.add(obj)
        aircraft_map[ac_id] = new_id

    await session.flush()
    print(f"  -> {len(aircraft_map)} aircraft inserted.")
    return aircraft_map


# ── Stage 3 – Flights + Seats ────────────────────────────────────────────────

async def seed_flights_and_seats(
    session: AsyncSession,
    aircraft_map: dict[str, uuid.UUID],
) -> None:
    """
    Each flight_schedule row has a `days_of_week` list.  We create one Flight
    (+ its Seat rows) for each (schedule, day) combination so the simulator
    has real upcoming departures across the week.
    """
    print("[postgres] Seeding flights and seats...")

    # Build route duration lookup: (dep, arr) -> duration_minutes
    route_duration: dict[tuple[str, str], int] = {}
    for row in read_csv(CSV_ROUTES):
        key = (row["Source_Airport_Code"].strip().upper(),
               row["Destination_Airport_Code"].strip().upper())
        route_duration[key] = int(row["Standard_Duration_Minutes"])

    # Build model lookup: registration_code -> model string
    fleet_model: dict[str, str] = {}
    for row in read_csv(CSV_FLEET):
        fleet_model[row["Aircraft_ID"].strip()] = row["Model"].strip()

    schedule_rows = read_csv(CSV_FLIGHT_SCHEDULE)
    total_flights = 0
    total_seats   = 0

    for row in schedule_rows:
        ac_id       = row["aircraft_id"].strip()
        dep         = row["departure_airport"].strip().upper()
        arr         = row["arrival_airport"].strip().upper()
        time_str    = row["departure_time_of_day"].strip()
        days        = parse_days(row["days_of_week"])
        base_pkr    = float(row["base_price"])
        base_usd    = round(base_pkr * PKR_TO_USD, 2)
        fn_base     = row["flight_number"].strip()   # e.g. "PK1000"
        model       = fleet_model.get(ac_id, "Airbus A320-200")

        duration_min = route_duration.get((dep, arr), 120)

        pg_aircraft_id = aircraft_map.get(ac_id)
        if pg_aircraft_id is None:
            print(f"  [warn] Unknown aircraft {ac_id} for flight {fn_base}, skipping.")
            continue

        for day_iso in days:
            dep_time = next_departure_for_day(time_str, day_iso)
            arr_time = dep_time + timedelta(minutes=duration_min)

            # Make flight_number unique per day: PK1000_1, PK1000_2 …
            unique_fn = f"{fn_base}_{day_iso}"
            fid       = uuid.uuid4()

            flight = Flight(
                flight_id=fid,
                flight_number=unique_fn,
                aircraft_id=pg_aircraft_id,
                departure_airport=dep,
                arrival_airport=arr,
                scheduled_departure=dep_time,
                estimated_departure=None,
                scheduled_arrival=arr_time,
                estimated_arrival=None,
                base_price=base_usd,
                status="scheduled",
                region_shard=determine_shard(dep),
            )
            session.add(flight)
            await session.flush()   # get fid into DB before inserting seats

            seat_rows = build_seat_rows(fid, model)
            session.add_all(seat_rows)

            total_flights += 1
            total_seats   += len(seat_rows)

        # Flush periodically to avoid huge in-memory batches
        if total_flights % 50 == 0:
            await session.flush()
            print(f"  ... {total_flights} flights seeded so far")

    print(f"  -> {total_flights} flights and {total_seats} seats inserted.")


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    # Always drop + recreate — no marker guard
    await drop_and_create_schema()

    print("\n[postgres] Starting data seeding...")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await seed_airports(session)
            aircraft_map = await seed_aircraft(session)
            await seed_flights_and_seats(session, aircraft_map)
        # commit happens automatically on successful `async with session.begin()` exit

    # Write / update the marker
    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.write_text("done")
    print("\n[postgres] ✅  All tables created and seeded successfully.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
