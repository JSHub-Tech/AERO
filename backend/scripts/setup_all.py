"""
Runs every one-time database setup script in sequence. Each script is
independently idempotent (see their docstrings), so this is safe to re-run
any time — already-done steps just print "skipping" and return instantly.

Called by setup.bat. Can also be run directly: python scripts/setup_all.py
"""
import asyncio

from create_postgres_tables import main as setup_postgres
from create_neo4j_constraints import main as setup_neo4j
from create_mongo_collections import main as setup_mongo
from verify_redis import main as setup_redis


async def main() -> None:
    steps = [
        ("PostgreSQL (Supabase)", setup_postgres),
        ("Neo4j (Aura)", setup_neo4j),
        ("MongoDB (Atlas)", setup_mongo),
        ("Redis (Upstash)", setup_redis),
    ]
    for name, step in steps:
        print(f"\n=== {name} ===")
        try:
            await step()
        except Exception as exc:
            print(f"[FAILED] {name}: {exc}")
            raise

    print("\nAll databases are set up.")


if __name__ == "__main__":
    asyncio.run(main())
