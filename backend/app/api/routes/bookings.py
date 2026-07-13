"""Booking endpoints: create booking (ACID Postgres tx) + Redis distributed seat lock."""
from fastapi import APIRouter

router = APIRouter()


@router.post("/")
async def create_booking():
    return {"message": "TODO: acquire_lock() -> insert Booking row -> release_lock()"}
