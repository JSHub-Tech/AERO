"""Cheapest/fastest path endpoints backed by Neo4j via routing_repository.py."""
from fastapi import APIRouter

from app.repositories.routing_repository import cheapest_path, fastest_path

router = APIRouter()


@router.get("/cheapest")
async def get_cheapest(origin: str, destination: str, max_price: float | None = None):
    records = await cheapest_path(origin, destination, max_price=max_price)
    return {"count": len(records)}


@router.get("/fastest")
async def get_fastest(origin: str, destination: str):
    records = await fastest_path(origin, destination)
    return {"count": len(records)}
