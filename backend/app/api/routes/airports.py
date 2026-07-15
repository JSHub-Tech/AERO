"""Airport listing + extended metadata endpoints (api.md 1.1 / 1.2)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.models.schemas import AirportDetailOut, AirportOut
from app.models.sql_models import Airport

router = APIRouter()


@router.get("", response_model=list[AirportOut])
async def list_airports(db: AsyncSession = Depends(get_db)):
    """All airports in the network — used to render nodes on the 3D Globe and 2D Map."""
    result = await db.execute(select(Airport).order_by(Airport.iata))
    return result.scalars().all()


@router.get("/details", response_model=list[AirportDetailOut])
async def list_airport_details(db: AsyncSession = Depends(get_db)):
    """Extended metadata for airports used in the cinematic 'Airports View'."""
    result = await db.execute(select(Airport).order_by(Airport.iata))
    return result.scalars().all()
