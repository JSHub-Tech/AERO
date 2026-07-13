"""
All Cypher lives here — the async driver equivalent of an "ORM layer" for Neo4j.
"""
from app.db.neo4j import neo4j_session


async def upsert_flight_edge(
    flight_number: str,
    from_iata: str,
    to_iata: str,
    base_price: float,
    departure_time: str,
    arrival_time: str,
) -> None:
    query = """
    MERGE (a:Airport {iata: $from_iata})
    MERGE (b:Airport {iata: $to_iata})
    MERGE (a)-[f:FLIGHT {flight_number: $flight_number}]->(b)
    SET f.base_price = $base_price,
        f.departure_time = datetime($departure_time),
        f.arrival_time = datetime($arrival_time)
    """
    async with neo4j_session() as session:
        await session.run(
            query,
            flight_number=flight_number,
            from_iata=from_iata,
            to_iata=to_iata,
            base_price=base_price,
            departure_time=departure_time,
            arrival_time=arrival_time,
        )


async def prune_flight_edge(flight_number: str) -> None:
    """Called when a flight hits 100% capacity or completes — keeps the graph in sync with Postgres."""
    query = "MATCH ()-[f:FLIGHT {flight_number: $flight_number}]->() DELETE f"
    async with neo4j_session() as session:
        await session.run(query, flight_number=flight_number)


async def cheapest_path(origin: str, destination: str, max_hops: int = 3, max_price: float | None = None):
    """Cheapest path up to `max_hops` legs, optionally capped at max_price."""
    query = f"""
    MATCH path = (origin:Airport {{iata: $origin}})-[:FLIGHT*1..{max_hops}]->(dest:Airport {{iata: $destination}})
    WITH path, relationships(path) AS legs,
         reduce(total = 0.0, r IN relationships(path) | total + r.base_price) AS total_price
    WHERE $max_price IS NULL OR total_price <= $max_price
    RETURN legs, total_price
    ORDER BY total_price ASC
    LIMIT 5
    """
    async with neo4j_session() as session:
        result = await session.run(query, origin=origin, destination=destination, max_price=max_price)
        return [record async for record in result]


async def fastest_path(origin: str, destination: str, max_hops: int = 3):
    """
    Fastest path enforcing chronological layover validity: each leg's
    departure must be >= the previous leg's arrival.
    """
    query = f"""
    MATCH path = (origin:Airport {{iata: $origin}})-[:FLIGHT*1..{max_hops}]->(dest:Airport {{iata: $destination}})
    WITH path, relationships(path) AS legs
    WHERE ALL(i IN range(0, size(legs) - 2) WHERE legs[i].arrival_time <= legs[i + 1].departure_time)
    WITH path, legs,
         duration.between(legs[0].departure_time, legs[-1].arrival_time).minutes AS total_minutes
    RETURN legs, total_minutes
    ORDER BY total_minutes ASC
    LIMIT 5
    """
    async with neo4j_session() as session:
        result = await session.run(query, origin=origin, destination=destination)
        return [record async for record in result]
