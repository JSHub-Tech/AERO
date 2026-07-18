"""Network route (airport-to-airport connection) listing (api.md 1.3).

Named `network.py` (not `routes.py`) to avoid clashing with the existing
cheapest/fastest-path `routing.py` router — that one answers "how do I get
from A to B", this one answers "what connections currently exist at all".
"""
import json

from fastapi import APIRouter

from app.db.redis_client import get_redis
from app.models.schemas import NetworkRouteOut
from app.repositories.routing_repository import list_network_routes

router = APIRouter()

# `list_network_routes()` runs `MATCH (a)-[:FLIGHT]->(b) RETURN DISTINCT ...`
# over every FLIGHT edge in the graph (one edge per scheduled flight
# instance, not per route) — every Home/Airports page load was re-running
# that full scan. The distinct route set only changes when the schedule is
# reseeded, so it's a perfect fit for the same short-TTL Redis cache pattern
# already used by /flights/search.
_CACHE_KEY = "cache:network-routes"
_CACHE_TTL_SECONDS = 3600


@router.get("", response_model=list[NetworkRouteOut])
async def get_network_routes():
    """Distinct active network connections — glowing arcs on the globe, dashed lines on the 2D map."""
    r = get_redis()

    cached_data = await r.get(_CACHE_KEY)
    if cached_data:
        return [NetworkRouteOut(**item) for item in json.loads(cached_data)]

    edges = await list_network_routes()
    routes = [
        NetworkRouteOut(Source_Airport_Code=edge["source"], Destination_Airport_Code=edge["destination"])
        for edge in edges
    ]

    await r.set(_CACHE_KEY, json.dumps([item.model_dump() for item in routes]), ex=_CACHE_TTL_SECONDS)

    return routes