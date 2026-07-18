"""
SQLAlchemy 2.0 ORM models — the Postgres "source of truth" tier (Supabase).
Mirrors the ER diagram: Aircraft -> Flight -> Seat -> Booking.
"""
import uuid
from datetime import datetime, date

from sqlalchemy import ForeignKey, String, Float, Boolean, DateTime, Date, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.postgres import Base


from app.db.postgres import Base


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")  # 'user' or 'admin'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    bookings: Mapped[list["Booking"]] = relationship(back_populates="user")


class Airport(Base):
    __tablename__ = "airport"

    iata: Mapped[str] = mapped_column(String(3), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # --- Enrichment columns for GET /api/v1/airports/details (cinematic "Airports View") ---
    operational_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    annual_passengers: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g. "7.3M" (display string, not numeric)
    description_blog: Mapped[str | None] = mapped_column(Text, nullable=True)


class Aircraft(Base):
    __tablename__ = "aircraft"

    aircraft_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registration_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    total_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")

    flights: Mapped[list["Flight"]] = relationship(back_populates="aircraft")


class Flight(Base):
    __tablename__ = "flight"

    flight_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Raw flight number as it appears in flight_schedule.csv (e.g. "PK1000") — NOT unique on
    # its own, since the same template flies on multiple days. `flight_id` (above) is the
    # only globally-unique identifier and is what APIs/bookings should reference.
    flight_number: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    service_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)  # calendar date of this specific departure
    aircraft_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("aircraft.aircraft_id"), nullable=False)
    departure_airport: Mapped[str] = mapped_column(ForeignKey("airport.iata"), nullable=False, index=True)
    arrival_airport: Mapped[str] = mapped_column(ForeignKey("airport.iata"), nullable=False, index=True)
    scheduled_departure: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estimated_departure: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_arrival: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estimated_arrival: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="scheduled")  # scheduled|boarding|final_call|delayed|airborne|completed|cancelled
    delay_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)  # populated when status == "delayed"
    region_shard: Mapped[str] = mapped_column(String(30), nullable=False, index=True)  # e.g. "lahore"

    aircraft: Mapped["Aircraft"] = relationship(back_populates="flights")
    seats: Mapped[list["Seat"]] = relationship(back_populates="flight", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="flight")

    __table_args__ = (
        UniqueConstraint("flight_number", "service_date", name="uq_flight_number_service_date"),
    )


class Seat(Base):
    __tablename__ = "seat"

    seat_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flight_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("flight.flight_id"), nullable=False)
    seat_number: Mapped[str] = mapped_column(String(5), nullable=False)
    seat_class: Mapped[str] = mapped_column(String(20), default="economy")
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False)

    flight: Mapped["Flight"] = relationship(back_populates="seats")
    booking: Mapped["Booking | None"] = relationship(back_populates="seat", uselist=False)


class Booking(Base):
    __tablename__ = "booking"

    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_reference: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # e.g. "AERO-X9F2A", shared across all seats in one checkout
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    flight_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("flight.flight_id"), nullable=False)
    seat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("seat.seat_id"), unique=True, nullable=False)
    # Nullable: the frontend's current POST /api/v1/flights/book payload
    # ({flightId, seats, passengers}) doesn't collect passenger name/email yet.
    # Fill these in when the booking flow gets a passenger-details step.
    passenger_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    passenger_email: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    price_paid: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")  # confirmed|cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="bookings")
    flight: Mapped["Flight"] = relationship(back_populates="bookings")
    seat: Mapped["Seat"] = relationship(back_populates="booking")