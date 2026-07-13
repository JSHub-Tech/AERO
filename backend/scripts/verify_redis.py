"""
scripts/verify_redis.py

Verifies Upstash Redis connectivity and flushes any stale seat-lock keys
from a previous seeding session.  No schema to create — just a health check
and cache invalidation.

Always runs end-to-end (no marker guard).

Run with:  python scripts/verify_redis.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.redis_client import get_redis

MARKER = Path(__file__).parent / ".markers" / "redis.done"


async def main() -> None:
    print("[redis] Pinging Upstash...")
    r = get_redis()

    # Basic liveness check
    await r.set("health:aero_adms", "ok", ex=60)
    value = await r.get("health:aero_adms")
    assert value == "ok", f"Redis health check failed — got: {value!r}"
    print("[redis] Ping OK — reachable and writable.")

    # Flush all seat-lock keys from any prior test run so re-seeding starts clean.
    # Pattern: lock:seat:<flight_id>:<seat_id>
    lock_keys = await r.keys("lock:seat:*")
    if lock_keys:
        await r.delete(*lock_keys)
        print(f"[redis] Flushed {len(lock_keys)} stale seat-lock key(s).")
    else:
        print("[redis] No stale seat locks to flush.")

    # Also clear any routing cache from previous seeding
    cache_keys = await r.keys("cache:*")
    if cache_keys:
        await r.delete(*cache_keys)
        print(f"[redis] Flushed {len(cache_keys)} routing cache key(s).")

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.write_text("done")
    print("[redis] ✅  Redis verified and cache cleared.")


if __name__ == "__main__":
    asyncio.run(main())
