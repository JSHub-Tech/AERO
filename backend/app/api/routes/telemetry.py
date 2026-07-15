"""Live flight telemetry WebSocket (api.md 2.1 — ws://<backend_url>/ws/telemetry).

Mirrors MongoDB Change Streams on the `live_flights` collection out to
connected clients as batched FLIGHT_TELEMETRY_UPDATE snapshots, matching the
shape the frontend's Live Operations map expects.
"""
import json
from typing import List

from bson import json_util
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.mongo_models import LiveFlight

router = APIRouter()

_STATUS_MAP = {"airborne": "In-Air", "completed": "Landed"}


class TelemetryConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = TelemetryConnectionManager()


def _to_telemetry_item(doc: dict) -> dict:
    """Map a raw LiveFlight document into one entry of the FLIGHT_TELEMETRY_UPDATE.data array."""
    position = doc.get("position") or {}
    return {
        "id": f"{doc.get('flight_number')}-LIVE",
        "flightNumber": doc.get("flight_number"),
        "departure": doc.get("departure"),
        "dest": doc.get("dest"),
        "lat": position.get("lat"),
        "lng": position.get("lng"),
        "heading": doc.get("heading", 0),
        "progress": doc.get("progress", 0),
        "status": _STATUS_MAP.get(doc.get("status"), doc.get("status")),
    }


async def _airborne_snapshot() -> dict:
    airborne = await LiveFlight.find(LiveFlight.status == "airborne").to_list()
    docs = [json.loads(json_util.dumps(f.model_dump())) for f in airborne]
    return {"type": "FLIGHT_TELEMETRY_UPDATE", "data": [_to_telemetry_item(d) for d in docs]}


@router.websocket("/telemetry")
async def telemetry_socket(websocket: WebSocket):
    """Real-time flight position stream — moves airplanes across the Live Operations map."""
    await manager.connect(websocket)
    try:
        # Send a snapshot immediately so a client that joins mid-flight isn't blank
        # until the next Mongo change event fires.
        snapshot = await _airborne_snapshot()
        if snapshot["data"]:
            await websocket.send_json(snapshot)

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def watch_telemetry():
    """Background task: listen to MongoDB Change Streams and broadcast the full airborne snapshot."""
    print("📡 Starting MongoDB Change Stream listener for telemetry...")
    collection = LiveFlight.get_motor_collection()

    try:
        # full_document="updateLookup" guarantees the full document is returned on updates
        async with collection.watch(full_document="updateLookup") as stream:
            async for change in stream:
                if change.get("operationType") in ("insert", "update", "replace"):
                    await manager.broadcast_json(await _airborne_snapshot())
    except Exception as e:
        print(f"⚠️ Telemetry Change Stream failed (Are you running an Atlas Replica Set?): {e}")
