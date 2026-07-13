"""
Neo4j graph schema — documented as plain dataclasses since we're talking to
Aura through the raw async driver (see app/db/neo4j.py) rather than an OGM.

Schema:
  (:Airport {iata: str})
  (:Airport)-[:FLIGHT {
        flight_number: str,
        base_price: float,
        scheduled_departure: datetime (ISO string),
        estimated_departure: datetime | None (ISO string),
        scheduled_arrival: datetime (ISO string),
        estimated_arrival: datetime | None (ISO string)
  }]->(:Airport)

Constraints/indexes are created once by scripts/create_neo4j_constraints.py.
"""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class AirportNode:
    iata: str


@dataclass
class FlightEdge:
    flight_number: str
    base_price: float
    scheduled_departure: datetime
    estimated_departure: datetime | None
    scheduled_arrival: datetime
    estimated_arrival: datetime | None
    from_airport: str
    to_airport: str
