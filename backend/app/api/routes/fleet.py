"""Fleet listing endpoint (api.md 1.7) — drives the interactive seat map layout."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.models.schemas import FleetOut
from app.models.sql_models import Aircraft

router = APIRouter()


@router.get("", response_model=list[FleetOut])
async def list_fleet(db: AsyncSession = Depends(get_db)):
    """Fleet details — e.g. A320 = 6 across, B777 = 9 across, computed client-side from Total_Seats."""
    result = await db.execute(select(Aircraft).order_by(Aircraft.registration_code))
    aircraft = result.scalars().all()
    return [
        FleetOut(Aircraft_ID=a.registration_code, Model=a.model, Total_Seats=a.total_seats)
        for a in aircraft
    ]
