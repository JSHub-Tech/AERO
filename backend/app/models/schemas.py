"""
Pydantic v2 schemas — the API's request/response contracts. Kept separate
from the SQLAlchemy ORM models (app/models/sql_models.py) on purpose: ORM
models describe storage, these describe the wire format.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Airports (api.md 1.1 / 1.2) ----------
class AirportOut(BaseModel):
    """GET /api/v1/airports — node data for the 3D Globe / 2D Map."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    Airport_Code: str = Field(validation_alias="iata", serialization_alias="Airport_Code")
    Airport_Name: str = Field(validation_alias="name", serialization_alias="Airport Name")
    City: str = Field(validation_alias="city", serialization_alias="City")
    Country: str = Field(validation_alias="country", serialization_alias="Country")
    Latitude: float = Field(validation_alias="latitude", serialization_alias="Latitude")
    Longitude: float = Field(validation_alias="longitude", serialization_alias="Longitude")


class AirportDetailOut(BaseModel):
    """GET /api/v1/airports/details — cinematic 'Airports View' metadata."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    Airport_Code: str = Field(validation_alias="iata", serialization_alias="Airport_Code")
    Operational_Status: str | None = Field(default=None, validation_alias="operational_status", serialization_alias="Operational_Status")
    Annual_Passengers: str | None = Field(default=None, validation_alias="annual_passengers", serialization_alias="Annual_Passengers")
    Description_Blog: str | None = Field(default=None, validation_alias="description_blog", serialization_alias="Description_Blog")


# ---------- Network routes (api.md 1.3) ----------
class NetworkRouteOut(BaseModel):
    """GET /api/v1/routes — glowing arcs / dashed lines on the map."""
    Source_Airport_Code: str
    Destination_Airport_Code: str


# ---------- Flight schedule (api.md 1.4) ----------
class FlightScheduleOut(BaseModel):
    """GET /api/v1/flights/schedule — 'Live Flight Schedule' tables."""
    flight_number: str        # raw CSV value, e.g. "PK1000" (same number recurs across service_dates)
    service_date: str         # "YYYY-MM-DD" — disambiguates recurring flight_numbers
    departure_airport: str
    arrival_airport: str
    departure_time_of_day: str  # "HH:MM"
    arrival_time_of_day: str    # "HH:MM"


class FlightDelayRequest(BaseModel):
    delay_minutes: int
    delay_reason: str | None = None


# ---------- Flight search (api.md 1.5) ----------
class FlightSearchResult(BaseModel):
    """GET /api/v1/flights/search — Booking Portal results.

    `id` is the booking key (Flight.flight_id UUID(s), "+"-joined for multi-leg
    itineraries) — use this for /flights/seats/{id} and booking checkout.
    `flight_number` is the human-readable label (e.g. "PK1000+PK1002") for display only.
    """
    id: str
    flight_number: str
    departureTime: str  # "08:00 AM"
    arrivalTime: str    # "10:00 AM"
    duration: str        # "2h 0m"
    price: str            # "$120"
    path: list[str]
    type: str              # "Direct" | "1-Stop" | ...
    plane: str


# ---------- Fleet (api.md 1.7) ----------
class FleetOut(BaseModel):
    """GET /api/v1/fleet — seat-map layout lookup."""
    Aircraft_ID: str
    Model: str
    Total_Seats: int


# ---------- Seat availability (api.md 1.8) ----------
class SeatsAvailabilityOut(BaseModel):
    """GET /api/v1/flights/seats/{flight_id}"""
    booked_seats: list[str]


# ---------- Booking checkout (api.md 1.6, called by frontend as POST /api/v1/flights/book) ----------
class CustomerDetails(BaseModel):
    name: str
    email: EmailStr


class BookFlightRequest(BaseModel):
    """Matches services/api.js: bookFlight(flightId, seats, passengers) ->
    POST /flights/book, body {flightId, seats, passengers}."""
    flightId: str  # Postgres Flight.flight_id UUID, matching FlightSearchResult.id (single-leg)
    seats: list[str]
    passengers: int = Field(gt=0)
    # Not sent by the current booking flow (no name/email step yet) — optional
    # so /flights/book keeps working as-is; wire this up once that UI exists.
    customerDetails: CustomerDetails | None = None


class BookFlightResponse(BaseModel):
    """Matches services/api.js mock: resolve({ success: true, pnr }), and
    Booking.jsx's `result.pnr`."""
    success: bool
    pnr: str


# ---------- Live flight positions (AviationMap.jsx — not in api.md, required by UI design) ----------
class LiveFlightMapOut(BaseModel):
    """GET /api/v1/flights/live — matches the shape AviationMap.jsx's commented-out
    `fetch('/api/flights/live')` TODO expects: a flat array, not wrapped in {data: [...]}."""
    id: str
    flightNumber: str
    source: str | None = None
    destination: str | None = None
    lat: float
    lng: float
    heading: float
    progress: float


# ---------- Live Operations dashboard (LiveOperations.jsx — not in api.md, required by UI design) ----------
class DashboardFlightItem(BaseModel):
    """Shared shape for the 'Active In-Air' and 'Boarding' panels."""
    id: str            # Flight.flight_id UUID (string) — required by admin actions (delay/cancel)
    flightNum: str
    source: str
    dest: str
    targetTime: str | None = None  # ISO datetime — arrival ETA (active) or departure ETD (boarding)


class DashboardDelayedItem(BaseModel):
    id: str
    flightNum: str
    source: str
    dest: str
    delayTime: str  # display string, e.g. "45m"


class DashboardFlightsResponse(BaseModel):
    flights: list[DashboardFlightItem]


class DashboardDelayedResponse(BaseModel):
    flights: list[DashboardDelayedItem]


class DashboardSummaryOut(BaseModel):
    """GET /api/v1/dashboard/summary — Command Center overview cards."""
    todays_revenue: float
    todays_bookings: int
    todays_flights: int
    on_time_pct: float          # % of today's flights not delayed/cancelled
    load_factor_pct: float      # booked seats / total seats across today's flights
    active_flights: int         # currently airborne
    delayed_flights: int
    fleet_size: int
    aircraft_in_maintenance: int
    total_users: int
    total_bookings_all_time: int


# ---------- Telemetry websocket (api.md 2.1) ----------
class TelemetryFlightOut(BaseModel):
    id: str
    flightNumber: str
    departure: str | None = None
    dest: str | None = None
    lat: float
    lng: float
    heading: float
    progress: float
    status: str


class TelemetryUpdateMessage(BaseModel):
    type: str = "FLIGHT_TELEMETRY_UPDATE"
    data: list[TelemetryFlightOut]


# ---------- Operations websocket (api.md 2.2) ----------
class OperationsBoardingItem(BaseModel):
    route: str
    flight: str
    time: str


class OperationsDelayedItem(BaseModel):
    route: str
    flight: str
    reason: str


class OperationsData(BaseModel):
    boarding: list[OperationsBoardingItem]
    delayed: list[OperationsDelayedItem]


class OperationsUpdateMessage(BaseModel):
    type: str = "OPERATIONAL_UPDATE"
    data: OperationsData


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


class AircraftUpdate(BaseModel):
    """PATCH /fleets/{id} — every field optional, only supplied ones change."""
    manufacturer: str | None = None
    model: str | None = None
    total_seats: int | None = Field(default=None, gt=0)
    status: str | None = None  # 'active' | 'maintenance' | 'retired'


# ---------- Flight ----------
class FlightCreate(BaseModel):
    flight_number: str
    aircraft_id: uuid.UUID
    departure_airport: str = Field(min_length=3, max_length=3)
    arrival_airport: str = Field(min_length=3, max_length=3)
    scheduled_departure: datetime
    estimated_departure: datetime | None = None
    scheduled_arrival: datetime
    estimated_arrival: datetime | None = None
    base_price: float = Field(gt=0)
    region_shard: str = "lahore"
    seat_class: str = "economy"  # class assigned to every auto-generated seat


class FlightOut(FlightCreate):
    model_config = ConfigDict(from_attributes=True)
    flight_id: uuid.UUID
    status: str


class FlightUpdate(BaseModel):
    """PATCH /flights/{id} — admin reschedule/edit. Every field optional."""
    aircraft_id: uuid.UUID | None = None
    departure_airport: str | None = Field(default=None, min_length=3, max_length=3)
    arrival_airport: str | None = Field(default=None, min_length=3, max_length=3)
    scheduled_departure: datetime | None = None
    estimated_departure: datetime | None = None
    scheduled_arrival: datetime | None = None
    estimated_arrival: datetime | None = None
    base_price: float | None = Field(default=None, gt=0)
    status: str | None = None


class FlightCancelRequest(BaseModel):
    reason: str | None = None


# ---------- Seat ----------
class SeatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    seat_id: uuid.UUID
    flight_id: uuid.UUID
    seat_number: str
    seat_class: str
    is_booked: bool


# ---------- User ----------
class UserCreate(BaseModel):
    email: EmailStr
    password_hash: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=1)


class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    current_password: str = Field(min_length=1)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: uuid.UUID
    email: EmailStr
    role: str
    is_active: bool = True
    created_at: datetime


class UserRoleUpdate(BaseModel):
    role: str = Field(pattern="^(user|admin)$")


class UserStatusUpdate(BaseModel):
    is_active: bool


# ---------- Booking ----------
class BookingCreate(BaseModel):
    user_id: uuid.UUID
    flight_id: uuid.UUID
    seat_id: uuid.UUID
    passenger_name: str
    passenger_email: EmailStr


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    booking_id: uuid.UUID
    booking_reference: str
    user_id: uuid.UUID
    flight_id: uuid.UUID
    seat_id: uuid.UUID
    passenger_name: str | None
    passenger_email: EmailStr | None
    price_paid: float
    status: str
    created_at: datetime
    # Joined display fields — populated by the admin listing (GET /flights/bookings)
    # for the Command Center table; absent (None) is fine for other callers.
    flight_number: str | None = None
    departure_airport: str | None = None
    arrival_airport: str | None = None
    scheduled_departure: datetime | None = None
    account_email: EmailStr | None = None
    seat_number: str | None = None


# ---------- Routing (Neo4j) ----------
class RouteLeg(BaseModel):
    flight_number: str
    departure_airport: str
    arrival_airport: str
    scheduled_departure: datetime
    estimated_departure: datetime | None = None
    scheduled_arrival: datetime
    estimated_arrival: datetime | None = None
    price: float


class RouteOut(BaseModel):
    legs: list[RouteLeg]
    total_price: float
    total_duration_minutes: int
    hops: int


# ---------- Natural-language / RAG chat ----------
class ChatMessage(BaseModel):
    text: str
    sender: str

class ChatQuery(BaseModel):
    messages: list[ChatMessage]
    max_price: float | None = None


class ChatResponse(BaseModel):
    answer: str
    route: RouteOut | None = None
    sources: list[str] = []


# ---------- Telemetry (MongoDB) ----------
class GeoPointOut(BaseModel):
    lat: float
    lng: float


class LiveFlightOut(BaseModel):
    flight_number: str
    status: str
    position: GeoPointOut
    updated_at: datetime