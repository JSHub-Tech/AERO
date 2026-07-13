from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List
import json
from bson import json_util
import asyncio

from app.models.mongo_models import LiveFlight
from app.models.schemas import LiveFlightOut

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: dict):
        # Create a copy to safely iterate while items might be removed
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time flight telemetry."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and wait for disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/", response_model=List[LiveFlightOut])
async def get_live_flights():
    """Get all currently airborne flights from MongoDB."""
    flights = await LiveFlight.find(LiveFlight.status == "airborne").to_list()
    return flights

@router.get("/{flight_number}", response_model=LiveFlightOut)
async def get_live_flight(flight_number: str):
    """Get the live tracking data for a specific flight."""
    flight = await LiveFlight.find_one(LiveFlight.flight_number == flight_number)
    if not flight:
        raise HTTPException(status_code=404, detail="Live flight not found or has landed.")
    return flight

async def watch_live_flights():
    """Background task to listen to MongoDB Change Streams and broadcast via WebSocket."""
    print("📡 Starting MongoDB Change Stream listener for Live Flights...")
    collection = LiveFlight.get_motor_collection()
    
    try:
        # full_document="updateLookup" guarantees the full document is returned on updates
        async with collection.watch(full_document="updateLookup") as stream:
            async for change in stream:
                operation = change.get("operationType")
                if operation in ("insert", "update", "replace"):
                    full_doc = change.get("fullDocument")
                    if full_doc:
                        # Serialize MongoDB BSON (like ObjectId, datetime) to standard JSON
                        cleaned_doc = json.loads(json_util.dumps(full_doc))
                        await manager.broadcast_json({
                            "type": operation, 
                            "flight": cleaned_doc
                        })
    except Exception as e:
        print(f"⚠️ Change Stream failed (Are you running an Atlas Replica Set?): {e}")
