import asyncio
from app.db.redis_client import get_redis

async def flush():
    r = get_redis()
    await r.flushdb()
    print('Redis flushed')

if __name__ == '__main__':
    asyncio.run(flush())
