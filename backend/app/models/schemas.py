"""
Pydantic v2 schemas — the API's request/response contracts. Kept separate
from the SQLAlchemy ORM models (app/models/sql_models.py) on purpose: ORM
models describe storage, these describe the wire format.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Aircraft ----------
class AircraftCreate(BaseModel):
    registration_code: str
    manufacturer: str
    model: str
    total_seats: int = Field(gt=0)


class AircraftOut(AircraftCreate):
    model_config = ConfigDict(from_attributes=True)
    aircraft_id: uuid.UUID
    status: str


# ---------- Flight ----------
class FlightCreate(BaseModel):
    flight_number: str
    aircraft_id: uuid.UUID
    departure_airport: str = Field(min_length=3, max_length=3)
    arrival_airport: str = Field(min_length=3, max_length=3)
    departure_time: datetime
    arrival_time: datetime
    base_price: float = Field(gt=0)
    region_shard: str


class FlightOut(FlightCreate):
    model_config = ConfigDict(from_attributes=True)
    flight_id: uuid.UUID
    status: str


# ---------- Seat ----------
class SeatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    seat_id: uuid.UUID
    flight_id: uuid.UUID
    seat_number: str
    seat_class: str
    is_booked: bool


# ---------- Booking ----------
class BookingCreate(BaseModel):
    flight_id: uuid.UUID
    seat_id: uuid.UUID
    passenger_name: str
    passenger_email: EmailStr


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    booking_id: uuid.UUID
    flight_id: uuid.UUID
    seat_id: uuid.UUID
    passenger_name: str
    passenger_email: EmailStr
    price_paid: float
    status: str
    created_at: datetime


# ---------- Routing (Neo4j) ----------
class RouteLeg(BaseModel):
    flight_number: str
    departure_airport: str
    arrival_airport: str
    departure_time: datetime
    arrival_time: datetime
    price: float


class RouteOut(BaseModel):
    legs: list[RouteLeg]
    total_price: float
    total_duration_minutes: int
    hops: int


# ---------- Natural-language / RAG chat ----------
class ChatQuery(BaseModel):
    message: str
    max_price: float | None = None


class ChatResponse(BaseModel):
    answer: str
    route: RouteOut | None = None
    sources: list[str] = []
