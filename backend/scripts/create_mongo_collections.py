"""
scripts/create_mongo_collections.py

Drops and recreates the 'live_flights' MongoDB Atlas collection with a
strict schema validator and the required indexes.

Always runs end-to-end (no marker guard).

Run with:  python scripts/create_mongo_collections.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.mongodb import get_client, close_mongo
from app.config import settings

MARKER = Path(__file__).parent / ".markers" / "mongo.done"

# ── Collection validator ──────────────────────────────────────────────────────
# Matches the LiveFlight Beanie document in app/models/mongo_models.py

LIVE_FLIGHTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["flight_number", "status", "position", "updated_at"],
        "properties": {
            "flight_number": {
                "bsonType": "string",
                "description": "Unique flight identifier e.g. PK1000_1",
            },
            "status": {
                "enum": ["airborne", "completed"],
                "description": "Operational status of the flight",
            },
            "position": {
                "bsonType": "object",
                "required": ["lat", "lng"],
                "description": "Current interpolated geolocation",
                "properties": {
                    "lat": {"bsonType": "double"},
                    "lng": {"bsonType": "double"},
                },
            },
            "updated_at": {
                "bsonType": "date",
                "description": "Timestamp of last telemetry update (UTC)",
            },
        },
    }
}


async def main() -> None:
    print("[mongo] Creating MongoDB collection...")

    db = get_client()[settings.MONGODB_DB_NAME]
    existing = await db.list_collection_names()

    # Drop if it already exists so we start clean
    if "live_flights" in existing:
        await db.drop_collection("live_flights")

    await db.create_collection("live_flights", validator=LIVE_FLIGHTS_VALIDATOR)

    col = db["live_flights"]

    # Index on flight_number for fast single-flight lookups (WebSocket updates)
    await col.create_index("flight_number", unique=True, name="idx_flight_number_unique")

    # Index on status for efficient "get all airborne" queries
    await col.create_index("status", name="idx_status")

    # Compound index for the most common query: status=airborne ordered by updated_at
    await col.create_index(
        [("status", 1), ("updated_at", -1)],
        name="idx_status_updated_at",
    )

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.write_text("done")

    print("[mongo] Created successfully.")

    await close_mongo()


if __name__ == "__main__":
    asyncio.run(main())
