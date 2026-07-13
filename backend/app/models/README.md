# Flight Model Architecture & State Machine Updates

This document explains the recent changes made to the flight models across `sql_models.py`, `schemas.py`, and `graph_models.py`.

## 1. Split Timelines: Scheduled vs. Estimated

Previously, flights only had `departure_time` and `arrival_time`. This was insufficient because if a flight is delayed and we update that time, we lose the original scheduled time (meaning passengers wouldn't know they are delayed).

**The Change:**
We split the timestamps into two separate concepts:
- **`scheduled_departure` / `scheduled_arrival`**: The original times printed on the passenger's ticket. These should **never change** once the flight is created.
- **`estimated_departure` / `estimated_arrival`**: The live, updated times. These default to `null` (or the scheduled time) but are updated if the flight is delayed or running early.

*Why?* 
Our background simulator (and frontend UI) will now strictly look at `estimated_departure` to know when to trigger boarding and takeoff events. This allows us to handle delays gracefully without losing the original schedule data.

## 2. Upgraded State Machine (Status)

Previously, the `Flight` status only supported `"scheduled"`, `"completed"`, or `"cancelled"`.

**The Change:**
We have expanded the flight lifecycle to officially support a real-world state machine. The new flow is:

1. **`scheduled`**: The default state.
2. **`boarding`**: Triggered roughly at T-45 minutes from `estimated_departure`.
3. **`final_call`**: Triggered roughly at T-15 minutes from `estimated_departure`.
4. **`airborne`**: Triggered at T-0. When this state is hit, the Postgres database hands off live tracking to the **MongoDB Telemetry Tier**, which starts tracking live GPS coordinates.
5. **`completed`**: Triggered when the flight lands. The MongoDB live document is then cleaned up.

*(Interrupt States: **`delayed`** and **`cancelled`** can be applied manually by an Admin at any point prior to takeoff).*

## 3. Files Modified
- **`sql_models.py`**: Updated the Postgres ORM to support the new columns and document the new states.
- **`schemas.py`**: Updated Pydantic schemas (`FlightCreate`, `FlightOut`, `RouteLeg`) so the FastAPI routes can send/receive the new split timestamps.
- **`graph_models.py`**: Updated the Neo4j schema definitions to ensure routing algorithms account for the new timestamp structures.
