"""Airport listing + extended metadata endpoints (api.md 1.1 / 1.2)."""
import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.db.redis_client import get_redis
from app.models.schemas import AirportDetailOut, AirportOut
from app.models.sql_models import Airport

router = APIRouter()

# Both endpoints below run a full-table scan over Airport on every single
# call, and the Home + Airports pages both call BOTH endpoints on every
# load (two extra Postgres round trips for data that changes essentially
# never between deployments). Same short-TTL Redis cache pattern used for
# /flights/search and /routes — cuts this straight to an in-memory hit
# after the first request.
_LIST_CACHE_KEY = "cache:airports:list"
_DETAILS_CACHE_KEY = "cache:airports:details"
_CACHE_TTL_SECONDS = 3600


@router.get("", response_model=list[AirportOut])
async def list_airports(db: AsyncSession = Depends(get_db)):
    """All airports in the network — used to render nodes on the 3D Globe and 2D Map."""
    r = get_redis()

    cached_data = await r.get(_LIST_CACHE_KEY)
    if cached_data:
        return [AirportOut(**item) for item in json.loads(cached_data)]

    result = await db.execute(select(Airport).order_by(Airport.iata))
    airports = [AirportOut.model_validate(row) for row in result.scalars().all()]

    await r.set(_LIST_CACHE_KEY, json.dumps([a.model_dump() for a in airports]), ex=_CACHE_TTL_SECONDS)

    return airports


@router.get("/details", response_model=list[AirportDetailOut])
async def list_airport_details(db: AsyncSession = Depends(get_db)):
    """Extended metadata for airports used in the cinematic 'Airports View'."""
    r = get_redis()

    cached_data = await r.get(_DETAILS_CACHE_KEY)
    if cached_data:
        return [AirportDetailOut(**item) for item in json.loads(cached_data)]

    result = await db.execute(select(Airport).order_by(Airport.iata))
    details = [AirportDetailOut.model_validate(row) for row in result.scalars().all()]

    await r.set(_DETAILS_CACHE_KEY, json.dumps([d.model_dump() for d in details]), ex=_CACHE_TTL_SECONDS)

    return details