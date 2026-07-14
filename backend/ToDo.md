# TODO

Status of the AERO ADMS backend, ordered by priority.

---

## Completed

- Polyglot persistence layer: async connection modules for Postgres
  (Supabase), Neo4j (Aura), MongoDB (Atlas), and Redis (Upstash)
- SQLAlchemy models for the relational schema (Airport, Aircraft, Flight,
  Seat, Booking) and Beanie documents for live telemetry
- Database setup scripts that reset and reseed all four databases from the
  CSV dataset (airports, fleet, flight schedule, routes)
- Neo4j graph seeding for multi-hop route search (cheapest/fastest path
  queries in `routing_repository.py`)
- Flight simulator: advances flight status (scheduled → boarding →
  final_call → airborne → completed) and streams live position telemetry
  into MongoDB
- WebSocket endpoint (`/live-flights/ws`) broadcasting MongoDB Change
  Streams to connected clients
- FastAPI app wiring: lifespan-managed connections across all four
  databases, router registration

---

## In progress / not yet started

### RAG chat service
This is the core feature of the natural-language routing agent and is not
yet implemented.

- [ ] Add `GEMINI_API_KEY` to the environment configuration
- [ ] Implement `app/services/rag_service.py`:
  - [ ] Load and chunk content from `app/knowledge_base/`
  - [ ] Generate embeddings with the Gemini embedding model
  - [ ] Implement similarity search over the embeddings
  - [ ] Combine retrieved context with structured results from
        `routing_repository.cheapest_path()` / `fastest_path()` and generate
        a response via Gemini
- [ ] Wire `app/api/routes/chat.py` to the RAG service

### Knowledge base content
- [ ] Generate per-airport markdown files from airport description data
- [ ] Write baggage policy content covering the airports in the dataset
- [ ] Write refund policy content

### Booking flow
- [ ] Implement `POST /bookings/`:
  - [ ] Acquire a Redis-backed seat lock before writing to Postgres
  - [ ] Validate seat availability and insert the booking inside a single
        transaction
  - [ ] Release the lock on both success and failure paths
- [ ] Verify concurrent booking requests for the same seat are serialized
      correctly (one succeeds, the other receives a conflict response)

### Flights and routing endpoints
- [ ] Implement flight search and retrieval endpoints (`app/api/routes/flights.py`)
- [ ] Map Neo4j path query results into the `RouteOut` / `RouteLeg` response
      schema in `app/api/routes/routing.py`

---

## Verification

- [ ] Full end-to-end pass: database reset/seed, API startup, flight
      simulator, booking flow, and chat endpoint working together
- [ ] Confirm frontend integration against the deployed API (CORS,
      response shapes)
