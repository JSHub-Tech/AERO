"""
scripts/setup_all.py

Runs all four database setup-and-seed scripts in the correct dependency order.
Every script does a full DROP + recreate + seed on each run, so this is safe
to run repeatedly — it always ends up with a clean, fully-seeded state.

Order matters:
  1. PostgreSQL first  — airports and aircraft must exist before flights/seats.
                          This is now the sole source of truth for flight timing.
  2. Neo4j second      — reads the `flight` table Postgres just committed and
                          mirrors it 1:1 (exact same timestamps, keyed by flight_id).
                          It no longer recomputes schedule dates independently,
                          which previously let Neo4j and Postgres drift apart.
  3. MongoDB third     — creates the empty telemetry collection (simulator fills it)
  4. Redis last        — flush stale locks after new seats are seeded

This script is for a full destructive reset (drops + reseeds everything) —
run it manually when you want a clean slate. For keeping the schedule
populated day-to-day WITHOUT wiping bookings, schedule
scripts/extend_schedule.py to run periodically (e.g. daily via cron /
Task Scheduler) instead of re-running this.

Can be called from setup.bat or directly:
    python scripts/setup_all.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
sys.path.append(str(Path(__file__).resolve().parent))

from create_postgres_tables import main as setup_postgres
from create_neo4j_constraints import main as setup_neo4j
from create_mongo_collections import main as setup_mongo
from verify_redis import main as setup_redis


STEPS = [
    ("PostgreSQL (Supabase) — drop, recreate, seed", setup_postgres),
    ("Neo4j (Aura) — wipe, recreate constraints, seed graph", setup_neo4j),
    ("MongoDB (Atlas) — drop, recreate collection + indexes", setup_mongo),
    ("Redis (Upstash) — verify + flush stale locks", setup_redis),
]


async def main() -> None:
    for name, step in STEPS:
        try:
            await step()
        except Exception as exc:
            print(f"[FAILED] {name}: {exc}")
            raise

    print("All databases created successfully.")


if __name__ == "__main__":
    asyncio.run(main())