"""
scripts/setup_all.py

Runs all four database setup-and-seed scripts in the correct dependency order.
Every script does a full DROP + recreate + seed on each run, so this is safe
to run repeatedly — it always ends up with a clean, fully-seeded state.

Order matters:
  1. PostgreSQL first  — airports and aircraft must exist before flights/seats
  2. Neo4j second      — mirrors the same flight schedule as Postgres
  3. MongoDB third     — creates the empty telemetry collection (simulator fills it)
  4. Redis last        — flush stale locks after new seats are seeded

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
    print("=" * 60)
    print("  AERO ADMS — Full Database Reset & Seed")
    print("=" * 60)

    for name, step in STEPS:
        print(f"\n{'─' * 60}")
        print(f"  {name}")
        print(f"{'─' * 60}")
        try:
            await step()
        except Exception as exc:
            print(f"\n[FAILED] {name}")
            print(f"  Error: {exc}")
            raise

    print("\n" + "=" * 60)
    print("  ✅  All databases reset and seeded.")
    print("  Run 'run_dev.bat' to start the API server.")
    print("  Run 'python scripts/flight_simulator.py' for live telemetry.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
