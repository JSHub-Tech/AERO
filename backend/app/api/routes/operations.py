"""Operational status WebSocket (api.md 2.2 — ws://<backend_url>/ws/operations).

There's no Postgres change-stream equivalent to Mongo's, so this polls the
`flight` table on an interval and only broadcasts when the boarding/delayed
snapshot actually changes.
"""
import asyncio
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.db.postgres import db_session
from app.models.sql_models import Flight

router = APIRouter()

POLL_INTERVAL_SECONDS = 5
DEFAULT_DELAY_REASON = "Operational delay"


class OperationsConnectionManager:
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


manager = OperationsConnectionManager()


async def _fetch_operational_snapshot() -> dict:
    async with db_session() as session:
        boarding_result = await session.execute(
            select(Flight).where(Flight.status.in_(("boarding", "final_call")))
        )
        delayed_result = await session.execute(select(Flight).where(Flight.status == "delayed"))

        boarding = [
            {
                "route": f"{f.departure_airport} - {f.arrival_airport}",
                "flight": f.flight_number,
                "time": (f.estimated_departure or f.scheduled_departure).strftime("%H:%M"),
            }
            for f in boarding_result.scalars().all()
        ]
        delayed = [
            {
                "route": f"{f.departure_airport} - {f.arrival_airport}",
                "flight": f.flight_number,
                "reason": f.delay_reason or DEFAULT_DELAY_REASON,
            }
            for f in delayed_result.scalars().all()
        ]

    return {"type": "OPERATIONAL_UPDATE", "data": {"boarding": boarding, "delayed": delayed}}


@router.websocket("/operations")
async def operations_socket(websocket: WebSocket):
    """Boarding/delayed panels on the left side of the Live Operations page."""
    await manager.connect(websocket)
    try:
        await websocket.send_json(await _fetch_operational_snapshot())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def watch_operations():
    """Background task: poll Postgres for boarding/delayed flights and broadcast on change."""
    print("🛫 Starting operational status poller...")
    last_snapshot: dict | None = None
    try:
        while True:
            snapshot = await _fetch_operational_snapshot()
            if snapshot != last_snapshot:
                await manager.broadcast_json(snapshot)
                last_snapshot = snapshot
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
    except asyncio.CancelledError:
        print("Operational status poller cancelled — shutting down cleanly.")
