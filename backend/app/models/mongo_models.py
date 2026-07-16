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
    departure: str | None = None  # origin IATA, needed for ws/telemetry payload
    dest: str | None = None       # destination IATA, needed for ws/telemetry payload
    position: GeoPoint
    heading: float = 0.0          # degrees, 0-360
    progress: float = 0.0         # 0.0 -> 1.0 along the route
    updated_at: datetime

    class Settings:
        name = "live_flights"
        indexes = ["flight_number"]
