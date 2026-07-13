import sys
from pathlib import Path
import asyncio
from datetime import datetime, timezone, timedelta

# Add the project root to python path so we can import 'app'
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.db.postgres import db_session
from app.db.mongodb import init_mongo, close_mongo
from app.models.sql_models import Flight, Airport
from app.models.mongo_models import LiveFlight, GeoPoint


def interpolate_position(start_coords, end_coords, progress):
    """Linearly interpolate between two lat/lng pairs based on progress (0.0 to 1.0)."""
    lat1, lng1 = start_coords
    lat2, lng2 = end_coords
    progress = max(0.0, min(1.0, progress))
    
    current_lat = lat1 + (lat2 - lat1) * progress
    current_lng = lng1 + (lng2 - lng1) * progress
    return GeoPoint(lat=current_lat, lng=current_lng)

async def run_simulator_loop():
    await init_mongo()
    print("✈️  Flight Simulator Started! Monitoring Postgres every 5 seconds...")
    
    try:
        while True:
            try:
                now = datetime.now(timezone.utc)
                
                async with db_session() as session:
                    # Get all flights that haven't landed yet
                    result = await session.execute(
                        select(Flight).where(Flight.status.in_(["scheduled", "boarding", "final_call", "delayed", "airborne"]))
                    )
                    active_flights = result.scalars().all()
                    
                    # Preload airport coordinates for this tick
                    airport_result = await session.execute(select(Airport))
                    airport_coords = {a.iata: (a.latitude, a.longitude) for a in airport_result.scalars().all()}
                    
                    def get_coords(iata: str):
                        return airport_coords.get(iata.upper(), (0.0, 0.0))
                    
                    for flight in active_flights:
                        departure_time = flight.estimated_departure or flight.scheduled_departure
                        arrival_time = flight.estimated_arrival or flight.scheduled_arrival
                        
                        # Ensure timezone awareness
                        if departure_time.tzinfo is None:
                            departure_time = departure_time.replace(tzinfo=timezone.utc)
                        if arrival_time.tzinfo is None:
                            arrival_time = arrival_time.replace(tzinfo=timezone.utc)
                            
                        # ----- STATE MACHINE TRANSITIONS -----
                        if flight.status == "scheduled":
                            if now >= departure_time - timedelta(minutes=45) and now < departure_time - timedelta(minutes=15):
                                print(f"[BOARDING] Flight {flight.flight_number} is boarding.")
                                flight.status = "boarding"
                            elif now >= departure_time - timedelta(minutes=15) and now < departure_time:
                                print(f"[FINAL CALL] Flight {flight.flight_number} final call.")
                                flight.status = "final_call"
                                
                        elif flight.status == "boarding":
                            if now >= departure_time - timedelta(minutes=15) and now < departure_time:
                                print(f"[FINAL CALL] Flight {flight.flight_number} final call.")
                                flight.status = "final_call"
                                
                        # Handle takeoff (from any pre-flight state)
                        if flight.status in ("scheduled", "boarding", "final_call", "delayed"):
                            if now >= departure_time:
                                print(f"[TAKEOFF] Flight {flight.flight_number} is Airborne!")
                                flight.status = "airborne"
                                
                                # Initialize MongoDB Telemetry
                                start_coords = get_coords(flight.departure_airport)
                                live_flight = LiveFlight(
                                    flight_number=flight.flight_number,
                                    status="airborne",
                                    position=GeoPoint(lat=start_coords[0], lng=start_coords[1]),
                                    updated_at=now
                                )
                                await live_flight.insert()
                                
                        # Handle Airborne and Telemetry Updates
                        elif flight.status == "airborne":
                            if now >= arrival_time:
                                print(f"[LANDED] Flight {flight.flight_number} has arrived.")
                                flight.status = "completed"
                                
                                # Update MongoDB to completed
                                live = await LiveFlight.find_one(LiveFlight.flight_number == flight.flight_number)
                                if live:
                                    live.status = "completed"
                                    live.updated_at = now
                                    await live.save()
                            else:
                                # Interpolate coordinates
                                total_duration = (arrival_time - departure_time).total_seconds()
                                elapsed = (now - departure_time).total_seconds()
                                progress = elapsed / total_duration if total_duration > 0 else 1.0
                                
                                start_coords = get_coords(flight.departure_airport)
                                end_coords = get_coords(flight.arrival_airport)
                                current_position = interpolate_position(start_coords, end_coords, progress)
                                
                                # Update MongoDB
                                live = await LiveFlight.find_one(LiveFlight.flight_number == flight.flight_number)
                                if live:
                                    live.position = current_position
                                    live.updated_at = now
                                    await live.save()
                                    print(f"[TELEMETRY] {flight.flight_number}: {current_position.lat:.4f}, {current_position.lng:.4f} ({progress*100:.1f}%)")
                                else:
                                    # Just in case the script restarted and missed the takeoff event
                                    new_live = LiveFlight(
                                        flight_number=flight.flight_number,
                                        status="airborne",
                                        position=current_position,
                                        updated_at=now
                                    )
                                    await new_live.insert()
                    
                    # Commit Postgres state changes
                    await session.commit()
                    
            except Exception as e:
                print(f"Error in simulator loop: {e}")
                
            await asyncio.sleep(5)
            
    finally:
        await close_mongo()

if __name__ == "__main__":
    try:
        asyncio.run(run_simulator_loop())
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
