"""
ONE-TIME USE: creates Neo4j Aura constraints/indexes for the routing graph.
`IF NOT EXISTS` makes every statement idempotent on its own; the marker file
just lets setup.bat skip re-running this script entirely on subsequent runs.

Run directly:  python scripts/create_neo4j_constraints.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.neo4j import neo4j_session, close_driver

MARKER = Path(__file__).parent / ".markers" / "neo4j.done"

STATEMENTS = [
    "CREATE CONSTRAINT airport_iata_unique IF NOT EXISTS "
    "FOR (a:Airport) REQUIRE a.iata IS UNIQUE",

    "CREATE INDEX flight_number_index IF NOT EXISTS "
    "FOR ()-[f:FLIGHT]-() ON (f.flight_number)",
]


async def main() -> None:
    if MARKER.exists():
        print("[neo4j] marker found -> constraints already created, skipping.")
        return

    print("[neo4j] connecting to Aura and creating constraints/indexes...")
    async with neo4j_session() as session:
        for stmt in STATEMENTS:
            await session.run(stmt)
            print(f"  ok: {stmt.splitlines()[0]}...")

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.touch()
    print("[neo4j] done.")
    await close_driver()


if __name__ == "__main__":
    asyncio.run(main())
