"""
All Cypher lives here — the async driver equivalent of an "ORM layer" for Neo4j.

NOTE: FLIGHT edges are now keyed by `flight_id` (a Postgres UUID), not
`flight_number` — the same flight_number legitimately appears on multiple
edges (one per service_date), so flight_number can no longer be used as a
unique lookup/prune key.
"""
from app.db.neo4j import neo4j_session


async def prune_flight_edge(flight_id: str) -> None:
    """Called when a flight hits 100% capacity or completes — keeps the graph in sync with Postgres.

    `flight_id` must be the Postgres Flight.flight_id (UUID string) for this specific
    departure instance — NOT the flight_number, which is shared across multiple dates.
    """
    query = "MATCH ()-[f:FLIGHT {flight_id: $flight_id}]->() DELETE f"
    async with neo4j_session() as session:
        await session.run(query, flight_id=str(flight_id))


async def list_network_routes() -> list[dict]:
    """Distinct origin -> destination airport pairs currently in the graph (api.md 1.3)."""
    query = """
    MATCH (a:Airport)-[:FLIGHT]->(b:Airport)
    RETURN DISTINCT a.iata AS source, b.iata AS destination
    ORDER BY source, destination
    """
    async with neo4j_session() as session:
        result = await session.run(query)
        return [{"source": record["source"], "destination": record["destination"]} async for record in result]


async def cheapest_path(origin: str, destination: str, max_hops: int = 3, max_price: float | None = None):
    """Cheapest path up to `max_hops` legs, optionally capped at max_price.

    Explicitly projects `iata_path` (the airport codes along the route) in
    Cypher rather than reading it off `relationship.start_node`/`.end_node`
    in Python — those are only "stub" nodes (id only, no properties) unless
    the nodes are themselves part of the RETURN clause, so leg.start_node["iata"]
    would silently come back None.
    """
    query = f"""
    MATCH path = (origin:Airport {{iata: $origin}})-[:FLIGHT*1..{max_hops}]->(dest:Airport {{iata: $destination}})
    WITH path, relationships(path) AS legs,
         [n IN nodes(path) | n.iata] AS iata_path,
         reduce(total = 0.0, r IN relationships(path) | total + r.base_price) AS total_price
    WHERE ($max_price IS NULL OR total_price <= $max_price)
      AND ALL(i IN range(0, size(legs) - 2) WHERE legs[i].arrival_time <= legs[i + 1].departure_time)
    RETURN legs, iata_path, total_price
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

    See `cheapest_path` docstring for why `iata_path` is projected explicitly
    in Cypher instead of read from relationship.start_node/.end_node.
    """
    query = f"""
    MATCH path = (origin:Airport {{iata: $origin}})-[:FLIGHT*1..{max_hops}]->(dest:Airport {{iata: $destination}})
    WITH path, relationships(path) AS legs, [n IN nodes(path) | n.iata] AS iata_path
    WHERE ALL(i IN range(0, size(legs) - 2) WHERE legs[i].arrival_time <= legs[i + 1].departure_time)
    WITH path, legs, iata_path,
         duration.between(legs[0].departure_time, legs[-1].arrival_time).minutes AS total_minutes
    RETURN legs, iata_path, total_minutes
    ORDER BY total_minutes ASC
    LIMIT 5
    """
    async with neo4j_session() as session:
        result = await session.run(query, origin=origin, destination=destination)
        return [record async for record in result]