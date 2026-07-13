import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.mongodb import init_mongo, close_mongo
from app.db.neo4j import verify_connectivity as verify_neo4j, close_driver as close_neo4j
from app.db.postgres import dispose_engine
from app.api.routes import flights, bookings, routing, chat, live_flights
from app.api.routes.live_flights import watch_live_flights


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up connections so the first real request isn't slow
    await init_mongo()
    await verify_neo4j()
    
    # Start the MongoDB Change Stream WebSocket broadcaster
    change_stream_task = asyncio.create_task(watch_live_flights())
    
    yield
    
    # Shutdown: close everything cleanly
    change_stream_task.cancel()
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

app.include_router(flights.router, prefix="/flights", tags=["flights"])
app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
app.include_router(routing.router, prefix="/routes", tags=["routing"])
app.include_router(chat.router, prefix="/chat", tags=["rag-chat"])
app.include_router(live_flights.router, prefix="/live-flights", tags=["telemetry"])


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.ENV}
