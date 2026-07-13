"""
ONE-TIME USE: Redis/Upstash has no schema to create, so this just verifies
connectivity and writes a health-check key. Kept in `scripts/` for symmetry
with the other three databases so setup.bat can drive all four the same way.

Run directly:  python scripts/verify_redis.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.redis_client import get_redis

MARKER = Path(__file__).parent / ".markers" / "redis.done"


async def main() -> None:
    if MARKER.exists():
        print("[redis] marker found -> already verified, skipping.")
        return

    print("[redis] pinging Upstash...")
    r = get_redis()
    await r.set("health:aero_adms", "ok", ex=60)
    value = await r.get("health:aero_adms")
    assert value == "ok", "Redis health check failed"

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.touch()
    print("[redis] reachable and writable. done.")


if __name__ == "__main__":
    asyncio.run(main())
