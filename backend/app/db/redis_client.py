"""
Async Upstash Redis connection.

Two ways to talk to Upstash; pick ONE per deployment target:

1. TCP (recommended for a long-running server on Render/Railway/Fly.io):
   `redis.asyncio` speaking the normal Redis protocol over TLS. Lowest
   latency, supports all commands (needed for the SETNX-style seat locks).
   Requires UPSTASH_REDIS_TCP_URL (rediss://default:<password>@host:port)
   from the Upstash console's "Redis" connect tab.

2. REST (recommended for serverless / edge functions, e.g. Vercel):
   `upstash-redis`'s AsyncRedis client over HTTPS. Slightly higher latency
   per call but works anywhere outbound TCP is restricted.

get_redis() below defaults to TCP and falls back to REST automatically if
UPSTASH_REDIS_TCP_URL isn't set, so the rest of the app never needs to care
which transport is active.
"""
from functools import lru_cache
from typing import Protocol

import redis.asyncio as redis_tcp
from upstash_redis.asyncio import Redis as UpstashRestRedis

from app.config import settings


class AsyncRedisLike(Protocol):
    async def set(self, key: str, value: str, ex: int | None = None, nx: bool = False): ...
    async def get(self, key: str): ...
    async def delete(self, *keys: str): ...


@lru_cache
def get_redis() -> AsyncRedisLike:
    if settings.UPSTASH_REDIS_TCP_URL:
        return redis_tcp.from_url(settings.UPSTASH_REDIS_TCP_URL, decode_responses=True)
    return UpstashRestRedis(
        url=settings.UPSTASH_REDIS_REST_URL,
        token=settings.UPSTASH_REDIS_REST_TOKEN,
    )


async def acquire_lock(key: str, owner: str, ttl_seconds: int = 600) -> bool:
    """Distributed seat lock, e.g. key='lock:seat:999:9991'. Returns True if acquired."""
    r = get_redis()
    result = await r.set(key, owner, ex=ttl_seconds, nx=True)
    return bool(result)


async def release_lock(key: str) -> None:
    r = get_redis()
    await r.delete(key)
