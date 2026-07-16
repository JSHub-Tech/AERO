"""
scripts/create_neo4j_constraints.py

Drops all existing Airport nodes and FLIGHT edges, recreates constraints /
indexes, then seeds the routing graph from:

    airport.csv  -> (:Airport) nodes
    Postgres      -> (:Airport)-[:FLIGHT]->(:Airport) edges, mirrored 1:1
                     from the `flight` table (the source of truth) rather
                     than recomputed from flight_schedule.csv. This
                     guarantees Neo4j and Postgres always agree on exact
                     departure/arrival timestamps for the same flight_id —
                     no independent "next occurrence from now" math here,
                     which previously could drift between the two stores.

IMPORTANT: run create_postgres_tables.py FIRST — this script reads the
`flight` table it produces.

Always runs end-to-end (no marker guard).

Run with:  python scripts/create_neo4j_constraints.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import csv
from sqlalchemy import select

from app.db.neo4j import neo4j_session, close_driver
from app.db.postgres import AsyncSessionLocal
from app.models.sql_models import Flight

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT_DIR    = SCRIPTS_DIR.parent
PUBLIC_DIR  = ROOT_DIR.parent / "frontend" / "public"
MARKER      = SCRIPTS_DIR / ".markers" / "neo4j.done"

CSV_AIRPORTS = PUBLIC_DIR / "airport.csv"


def read_csv(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def iso(dt) -> str:
    """Convert a (possibly tz-aware) datetime to an ISO-8601 string Neo4j datetime() can parse."""
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Stage 0 – Wipe existing graph data ───────────────────────────────────────

WIPE_STATEMENTS = [
    "MATCH ()-[f:FLIGHT]->() DELETE f",
    "MATCH (a:Airport) DELETE a",
]

# ── Stage 1 – Constraints & indexes ──────────────────────────────────────────

CONSTRAINT_STATEMENTS = [
    "CREATE CONSTRAINT airport_iata_unique IF NOT EXISTS "
    "FOR (a:Airport) REQUIRE a.iata IS UNIQUE",

    # flight_id is the true unique identifier now — one relationship per Postgres row
    "CREATE CONSTRAINT flight_id_unique IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() REQUIRE f.flight_id IS UNIQUE",

    # flight_number is no longer unique (same template flies multiple days), kept as a
    # non-unique index purely for lookup/display purposes
    "CREATE INDEX flight_number_index IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() ON (f.flight_number)",

    "CREATE INDEX flight_price_index IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() ON (f.base_price)",

    "CREATE INDEX flight_departure_index IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() ON (f.departure_time)",
]


# ── Stage 2 – Seed Airport nodes (still from CSV — airports don't change per-run) ────

async def seed_airports(session) -> int:
    """Returns the number of Airport nodes upserted."""
    rows = read_csv(CSV_AIRPORTS)

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
    return len(nodes)


# ── Stage 3 – Seed FLIGHT edges, mirrored exactly from Postgres ─────────────

async def seed_flights_from_postgres(session) -> int:
    """Returns the number of FLIGHT edges created."""
    async with AsyncSessionLocal() as pg_session:
        result = await pg_session.execute(select(Flight))
        flights = result.scalars().all()

    edges = [
        {
            "flight_id":        str(f.flight_id),
            "flight_number":    f.flight_number,
            "service_date":     f.service_date.isoformat(),
            "from_iata":        f.departure_airport,
            "to_iata":          f.arrival_airport,
            "base_price":       f.base_price,
            "departure_time":   iso(f.scheduled_departure),
            "arrival_time":     iso(f.scheduled_arrival),
            "duration_minutes": int((f.scheduled_arrival - f.scheduled_departure).total_seconds() // 60),
            "status":           f.status,
        }
        for f in flights
    ]

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
            MERGE (dep)-[f:FLIGHT {flight_id: e.flight_id}]->(arr)
            SET f.flight_number    = e.flight_number,
                f.service_date     = date(e.service_date),
                f.base_price       = e.base_price,
                f.departure_time   = datetime(e.departure_time),
                f.arrival_time     = datetime(e.arrival_time),
                f.duration_minutes = e.duration_minutes,
                f.status           = e.status
            """,
            edges=chunk,
        )
        total += len(chunk)

    return total


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    print("[neo4j] Creating Neo4j graph...")

    async with neo4j_session() as session:
        for stmt in WIPE_STATEMENTS:
            await session.run(stmt)

        for stmt in CONSTRAINT_STATEMENTS:
            await session.run(stmt)

        await seed_airports(session)
        await seed_flights_from_postgres(session)

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.write_text("done")

    print("[neo4j] Created successfully.")

    await close_driver()


if __name__ == "__main__":
    asyncio.run(main())