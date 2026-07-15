# TODO

Status of the AERO ADMS backend, ordered by priority.

---

## Completed

### Persistence layer
- Polyglot persistence layer: async connection modules for Postgres
  (Supabase), Neo4j (Aura), MongoDB (Atlas), and Redis (Upstash)
- SQLAlchemy models for the relational schema (Airport, Aircraft, Flight,
  Seat, Booking) and Beanie documents for live telemetry
- Airport enrichment columns (`operational_status`, `annual_passengers`,
  `description_blog`), Flight `delay_reason`, and Booking
  `booking_reference` (groups multi-seat checkouts under one reference code)
- Database setup scripts that reset and reseed all four databases from the
  CSV dataset (airports, airport details, fleet, flight schedule, routes) —
  fixed a bug where `airport_details.csv` was parsed but never actually
  merged into the seeded `Airport` rows
- Neo4j graph seeding for multi-hop route search (cheapest/fastest path
  queries in `routing_repository.py`), plus `list_network_routes()` for the
  distinct-edges network view
- Flight simulator: advances flight status (scheduled → boarding →
  final_call → airborne → completed), streams live position telemetry into
  MongoDB, and now also computes `heading` (great-circle bearing) and
  `progress` (0.0–1.0 along the route)
- FastAPI app wiring: lifespan-managed connections across all four
  databases, router registration

### REST API (api.md)
- `GET /api/v1/airports` — airport nodes for the Globe/Map
- `GET /api/v1/airports/details` — cinematic "Airports View" metadata
- `GET /api/v1/routes` — active network connections (Neo4j edges)
- `GET /api/v1/flights/schedule` — static daily schedule
- `GET /api/v1/flights/search` — origin/destination search backed by
  Neo4j cheapest + fastest path, joined back to Postgres for `plane`
- `GET /api/v1/flights/seats/{flight_id}` — booked seat numbers
- `GET /api/v1/fleet` — aircraft list for seat-map layout
- `POST /api/v1/booking/checkout` — multi-seat checkout: per-seat Redis
  lock → seat availability + booking insert in one Postgres transaction →
  lock release (success or failure)

### WebSockets (api.md)
- `ws://<host>/ws/telemetry` — MongoDB Change Stream → batched
  `FLIGHT_TELEMETRY_UPDATE` broadcasts (replaces the old `/live-flights/ws`)
- `ws://<host>/ws/operations` — Postgres poller → `OPERATIONAL_UPDATE`
  broadcasts (boarding / delayed panels), only pushes on actual change
- `GET /api/v1/live-flights` and `/api/v1/live-flights/{flight_number}` kept
  as plain REST snapshots for polling/debugging

### RAG chat service
- `app/services/rag_service.py` implemented using Gemini function calling
  (not the originally planned embeddings/vector-similarity approach — the
  baggage policy is injected directly into the system instruction, and
  flight search is exposed as a tool call into
  `routing_repository.cheapest_path()`)
- `app/api/routes/chat.py` wired to `rag_service.process_chat()`
- `GEMINI_API_KEY` / `GEMINI_MODEL` added to environment configuration

---

## In progress / not yet started

### Knowledge base content
- [ ] Generate per-airport markdown files from airport description data
- [ ] Write refund policy content (baggage policy is the only doc so far)
- [ ] If genuine RAG (embeddings + similarity search) is still wanted over
      the current single-document system-prompt approach, that's a
      separate, larger piece of work — confirm whether it's still in scope
      before the knowledge base grows beyond a file or two

### Flight status / delay flow
- [ ] Nothing currently transitions a `Flight.status` to `"delayed"` or
      sets `Flight.delay_reason` — the simulator's state machine only ever
      produces scheduled → boarding → final_call → airborne → completed.
      `/ws/operations`'s `delayed` list and `reason` field will stay empty
      until this is added (either to the simulator or a separate ops-input
      path)

### Booking flow
- [ ] No cancellation/refund endpoint yet (`Booking.status` supports
      `"cancelled"` but nothing sets it)
- [ ] `price_paid` is charged at full `base_price` per seat — confirm
      whether multi-passenger bookings should split/discount pricing

### Data verification
- [ ] Confirm `airport_details.csv` actually has `Operational_Status`,
      `Annual_Passengers`, and `Description_Blog` columns with those exact
      headers — the seeding fix assumes this shape but hasn't been run
      against the real CSV yet

### Hardening
- [ ] Tighten CORS (`allow_origins=["*"]`) before deploying publicly
- [ ] `alembic init` if proper migrations are wanted instead of
      drop/recreate + reseed on every schema change

---

## Verification

- [ ] Full end-to-end pass: database reset/seed, API startup, flight
      simulator, booking flow, chat endpoint, and both WebSocket channels
      working together
- [ ] Confirm frontend integration against the deployed API (CORS,
      response shapes) — cross-check every endpoint in `api.md` against the
      live responses, especially the `flight_id` semantics (flight_number,
      not the internal Postgres UUID) used by `/flights/seats/{flight_id}`
      and `/booking/checkout`
