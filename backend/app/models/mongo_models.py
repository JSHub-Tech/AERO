"""
Beanie (async ODM) documents — the MongoDB telemetry tier.
"""
from datetime import datetime

from beanie import Document
from pydantic import BaseModel


class GeoPoint(BaseModel):
    lat: float
    lng: float


class LiveFlight(Document):
    flight_number: str
    status: str  # "airborne" | "completed"
    position: GeoPoint
    updated_at: datetime

    class Settings:
        name = "live_flights"
        indexes = ["flight_number"]
