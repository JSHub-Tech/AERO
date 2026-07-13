"""
ONE-TIME USE: creates the MongoDB Atlas collection(s) with a schema
validator and indexes. Checks `list_collection_names()` first so re-running
is a no-op (Mongo also just implicitly creates collections on first insert,
but an explicit validator is worth setting up once, up front).

Run directly:  python scripts/create_mongo_collections.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.mongodb import get_client, close_mongo
from app.config import settings

MARKER = Path(__file__).parent / ".markers" / "mongo.done"

LIVE_FLIGHTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["flight_number", "status", "position", "updated_at"],
        "properties": {
            "flight_number": {"bsonType": "string"},
            "status": {"enum": ["airborne", "completed"]},
            "position": {
                "bsonType": "object",
                "required": ["lat", "lng"],
                "properties": {
                    "lat": {"bsonType": "double"},
                    "lng": {"bsonType": "double"},
                },
            },
            "updated_at": {"bsonType": "date"},
        },
    }
}


async def main() -> None:
    if MARKER.exists():
        print("[mongo] marker found -> collections already created, skipping.")
        return

    db = get_client()[settings.MONGODB_DB_NAME]
    existing = await db.list_collection_names()

    if "live_flights" in existing:
        print("[mongo] 'live_flights' already exists, skipping creation.")
    else:
        print("[mongo] creating 'live_flights' with schema validator...")
        await db.create_collection("live_flights", validator=LIVE_FLIGHTS_VALIDATOR)
        await db["live_flights"].create_index("flight_number")

    MARKER.parent.mkdir(parents=True, exist_ok=True)
    MARKER.touch()
    print("[mongo] done.")
    await close_mongo()


if __name__ == "__main__":
    asyncio.run(main())
