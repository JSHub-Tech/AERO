import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import settings
from app.db.mongodb import init_mongo, close_mongo
from app.db.neo4j import verify_connectivity as verify_neo4j, close_driver as close_neo4j
from app.db.postgres import dispose_engine
from app.api.routes import (
    airports,
    bookings,
    chat,
    dashboard,
    flights,
    fleet,
    live_flights,
    network,
    operations,
    routing,
    telemetry,
)
from app.api.routes.operations import watch_operations
from app.api.routes.telemetry import watch_telemetry
from scripts.flight_simulator import run_simulator_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up connections so the first real request isn't slow
    await init_mongo()
    await verify_neo4j()

    # Background broadcasters backing the two ws/* channels
    telemetry_task = asyncio.create_task(watch_telemetry())
    operations_task = asyncio.create_task(watch_operations())
    
    # Run the flight simulator in the background so it works automatically on Render
    simulator_task = asyncio.create_task(run_simulator_loop(skip_db_init=True))

    yield

    # Shutdown: close everything cleanly
    telemetry_task.cancel()
    operations_task.cancel()
    simulator_task.cancel()
    await close_mongo()
    await close_neo4j()
    await dispose_engine()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before submitting/deploying publicly
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compresses any JSON response over 1KB (airports/routes/flights lists benefit most)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# --- REST endpoints, mounted to match what services/api.js actually calls ---
app.include_router(airports.router, prefix="/api/v1/airports", tags=["airports"])
app.include_router(network.router, prefix="/api/v1/routes", tags=["network-routes"])
app.include_router(flights.router, prefix="/api/v1/flights", tags=["flights"])
# Frontend calls GET /fleets (plural) — api.md documents /fleet (singular); matching the frontend.
app.include_router(fleet.router, prefix="/api/v1/fleets", tags=["fleet"])
# Frontend calls POST /flights/book, not api.md's POST /booking/checkout — matching the frontend.
app.include_router(bookings.router, prefix="/api/v1/flights", tags=["booking"])
# Not in api.md — LiveOperations.jsx already polls these three routes; required by the UI design.
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])

# --- Supporting APIs not in api.md, kept for the natural-language chat feature ---
app.include_router(routing.router, prefix="/api/v1/routing", tags=["routing"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["rag-chat"])
app.include_router(live_flights.router, prefix="/api/v1/live-flights", tags=["telemetry-rest"])

# --- WebSockets from api.md — implemented, not yet consumed by the frontend (no WS client there today) ---
app.include_router(telemetry.router, prefix="/ws", tags=["websocket"])
app.include_router(operations.router, prefix="/ws", tags=["websocket"])


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.ENV}