"""
Async Neo4j Aura connection.

There is no mature async OGM for Python (neomodel is sync-only), so the
recommended pattern is: use the official async driver directly and put all
Cypher behind a thin repository layer (see app/repositories/routing_repository.py).
This is also faster to build for a hackathon than fighting an OGM's abstractions.
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession

from app.config import settings

_driver: AsyncDriver | None = None


def get_driver() -> AsyncDriver:
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
        )
    return _driver


@asynccontextmanager
async def neo4j_session() -> AsyncGenerator[AsyncSession, None]:
    driver = get_driver()
    session = driver.session(database=settings.NEO4J_DATABASE)
    try:
        yield session
    finally:
        await session.close()


async def verify_connectivity() -> bool:
    driver = get_driver()
    await driver.verify_connectivity()
    return True


async def close_driver() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
