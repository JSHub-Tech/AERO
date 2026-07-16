"""Network route (airport-to-airport connection) listing (api.md 1.3).

Named `network.py` (not `routes.py`) to avoid clashing with the existing
cheapest/fastest-path `routing.py` router — that one answers "how do I get
from A to B", this one answers "what connections currently exist at all".
"""
from fastapi import APIRouter

from app.models.schemas import NetworkRouteOut
from app.repositories.routing_repository import list_network_routes

router = APIRouter()


@router.get("", response_model=list[NetworkRouteOut])
async def get_network_routes():
    """Distinct active network connections — glowing arcs on the globe, dashed lines on the 2D map."""
    edges = await list_network_routes()
    return [
        NetworkRouteOut(Source_Airport_Code=edge["source"], Destination_Airport_Code=edge["destination"])
        for edge in edges
    ]
