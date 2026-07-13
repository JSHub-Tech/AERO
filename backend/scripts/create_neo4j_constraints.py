"""
scripts/create_neo4j_constraints.py

Drops all existing Airport nodes and FLIGHT edges, recreates constraints /
indexes, then seeds the routing graph from:

    airport.csv          -> (:Airport) nodes
    flight_schedule.csv  -> (:Airport)-[:FLIGHT]->(:Airport) edges
    routes.csv           -> duration weights on edges

Always runs end-to-end (no marker guard).

Run with:  python scripts/create_neo4j_constraints.py
"""

import asyncio
import csv
import json
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.neo4j import neo4j_session, close_driver

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT_DIR    = SCRIPTS_DIR.parent
PUBLIC_DIR  = ROOT_DIR.parent / "frontend" / "public"
MARKER      = SCRIPTS_DIR / ".markers" / "neo4j.done"

CSV_AIRPORTS        = PUBLIC_DIR / "airport.csv"
CSV_FLIGHT_SCHEDULE = PUBLIC_DIR / "flight_schedule.csv"
CSV_ROUTES          = PUBLIC_DIR / "routes.csv"

PKR_TO_USD = 1 / 278.0

# ── Helpers ───────────────────────────────────────────────────────────────────

def read_csv(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def parse_days(raw: str) -> list[int]:
    try:
        return json.loads(raw.strip())
    except Exception:
        return list(range(1, 8))


def next_departure_for_day(time_str: str, day_iso: int) -> datetime:
    now_utc = datetime.now(timezone.utc)
    h, m, s = (int(x) for x in time_str.split(":"))
    for offset in range(7):
        candidate = (now_utc + timedelta(days=offset)).replace(
            hour=h, minute=m, second=s, microsecond=0
        )
        if candidate.isoweekday() == day_iso and candidate > now_utc:
            return candidate
    diff = (day_iso - now_utc.isoweekday()) % 7 or 7
    return (now_utc + timedelta(days=diff)).replace(hour=h, minute=m, second=s, microsecond=0)


def iso(dt: datetime) -> str:
    """Convert datetime to ISO-8601 string Neo4j datetime() can parse."""
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Stage 0 – Wipe existing graph data ───────────────────────────────────────

WIPE_STATEMENTS = [
    # Drop all FLIGHT relationships first
    "MATCH ()-[f:FLIGHT]->() DELETE f",
    # Drop all Airport nodes
    "MATCH (a:Airport) DELETE a",
]

# ── Stage 1 – Constraints & indexes ──────────────────────────────────────────

CONSTRAINT_STATEMENTS = [
    # Unique constraint on Airport.iata (also creates an index)
    "CREATE CONSTRAINT airport_iata_unique IF NOT EXISTS "
    "FOR (a:Airport) REQUIRE a.iata IS UNIQUE",

    # Index on FLIGHT.flight_number for fast lookup
    "CREATE INDEX flight_number_index IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() ON (f.flight_number)",

    # Index on FLIGHT.base_price for price-range filtering
    "CREATE INDEX flight_price_index IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() ON (f.base_price)",

    # Index on FLIGHT.departure_time for time-window queries
    "CREATE INDEX flight_departure_index IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() ON (f.departure_time)",
]


# ── Stage 2 – Seed Airport nodes ─────────────────────────────────────────────

async def seed_airports(session) -> None:
    print("[neo4j] Seeding Airport nodes...")
    rows = read_csv(CSV_AIRPORTS)

    # Batch UNWIND for performance
    nodes = [
        {
            "iata":    row["Airport_Code"].strip().upper(),
            "name":    row["Airport Name"].strip(),
            "city":    row["City"].strip(),
            "country": row["Country"].strip(),
            "lat":     float(row["Latitude"]),
            "lng":     float(row["Longitude"]),
        }
        for row in rows
    ]

    await session.run(
        """
        UNWIND $nodes AS n
        MERGE (a:Airport {iata: n.iata})
        SET a.name    = n.name,
            a.city    = n.city,
            a.country = n.country,
            a.lat     = n.lat,
            a.lng     = n.lng
        """,
        nodes=nodes,
    )
    print(f"  -> {len(nodes)} Airport nodes upserted.")


# ── Stage 3 – Seed FLIGHT edges ───────────────────────────────────────────────

async def seed_flights(session) -> None:
    print("[neo4j] Seeding FLIGHT relationships...")

    # Build route duration lookup
    route_duration: dict[tuple[str, str], int] = {}
    for row in read_csv(CSV_ROUTES):
        key = (
            row["Source_Airport_Code"].strip().upper(),
            row["Destination_Airport_Code"].strip().upper(),
        )
        route_duration[key] = int(row["Standard_Duration_Minutes"])

    schedule_rows = read_csv(CSV_FLIGHT_SCHEDULE)
    edges: list[dict] = []

    for row in schedule_rows:
        dep      = row["departure_airport"].strip().upper()
        arr      = row["arrival_airport"].strip().upper()
        time_str = row["departure_time_of_day"].strip()
        days     = parse_days(row["days_of_week"])
        base_usd = round(float(row["base_price"]) * PKR_TO_USD, 2)
        fn_base  = row["flight_number"].strip()
        duration = route_duration.get((dep, arr), 120)

        for day_iso in days:
            dep_dt = next_departure_for_day(time_str, day_iso)
            arr_dt = dep_dt + timedelta(minutes=duration)

            edges.append({
                "flight_number":    f"{fn_base}_{day_iso}",
                "from_iata":        dep,
                "to_iata":          arr,
                "base_price":       base_usd,
                "departure_time":   iso(dep_dt),
                "arrival_time":     iso(arr_dt),
                "duration_minutes": duration,
                "available_seats":  -1,   # -1 = unknown until Postgres confirms
                "status":           "scheduled",
            })

    # Batch in chunks of 200 to avoid oversized transactions
    CHUNK = 200
    total = 0
    for i in range(0, len(edges), CHUNK):
        chunk = edges[i : i + CHUNK]
        await session.run(
            """
            UNWIND $edges AS e
            MATCH (dep:Airport {iata: e.from_iata})
            MATCH (arr:Airport {iata: e.to_iata})
            MERGE (dep)-[f:FLIGHT {flight_number: e.flight_number}]->(arr)
            SET f.base_price       = e.base_price,
                f.departure_time   = datetime(e.departure_time),
                f.arrival_time     = datetime(e.arrival_time),
                f.duration_minutes = e.duration_minutes,
                f.available_seats  = e.available_seats,
                f.status           = e.status
            """,
            edges=chunk,
        )
        total += len(chunk)
        print(f"  ... {total}/{len(edges)} FLIGHT edges seeded")

    print(f"  -> {total} FLIGHT edges created.")


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    print("[neo4j] Connecting to Neo4j Aura...")

    async with neo4j_session() as session:
        # 1. Wipe existing graph data
        print("[neo4j] Wiping existing Airport nodes and FLIGHT edges...")
        for stmt in WIPE_STATEMENTS:
            await session.run(stmt)
            print(f"  ok: {stmt[:60]}...")

        # 2. Create constraints / indexes
        print("[neo4j] Creating constraints and indexes...")
        for stmt in CONSTRAINT_STATEMENTS:
            await session.run(stmt)
            print(f"  ok: {stmt[:60]}...")

        # 3. Seed data
        await seed_airports(session)
        await seed_flights(session)

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.write_text("done")
    print("[neo4j] ✅  Graph schema and data seeded successfully.")
    await close_driver()


if __name__ == "__main__":
    asyncio.run(main())
