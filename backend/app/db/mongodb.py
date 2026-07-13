"""
Async MongoDB (Atlas, browsed locally with Compass) via Motor + Beanie.

Beanie documents are declared in app/models/mongo_models.py. `init_mongo()`
must run once at app startup (see app/main.py lifespan) before those
documents can be used.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.mongo_models import LiveFlight

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URI)
    return _client


async def init_mongo() -> None:
    client = get_client()
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[LiveFlight],
    )


async def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
