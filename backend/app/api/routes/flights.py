"""Flight CRUD + search endpoints. Fill in with routing_repository / sql_models as you build it out."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_flights():
    return {"message": "TODO: query Flight table via app/db/postgres.py session"}
