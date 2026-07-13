"""
ONE-TIME USE: creates all Postgres tables on Supabase from the SQLAlchemy
metadata. Safe to re-run — `checkfirst=True` (the default) means
`create_all` skips any table that already exists.

Run directly:  python scripts/create_postgres_tables.py
Also invoked by setup.bat, which additionally skips this whole script if
scripts/.markers/postgres.done already exists.
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))  # allow `python scripts/x.py`

from app.db.postgres import engine, Base
from app.models import sql_models  # noqa: F401  (import so tables register on Base.metadata)

MARKER = Path(__file__).parent / ".markers" / "postgres.done"


async def main() -> None:
    if MARKER.exists():
        print("[postgres] marker found -> tables already created, skipping.")
        return

    print("[postgres] connecting to Supabase and creating tables (skips ones that already exist)...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.touch()
    print("[postgres] done. Tables: " + ", ".join(Base.metadata.tables.keys()))
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
