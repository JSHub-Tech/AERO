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
- Booking `passenger_name`/`passenger_email` are now nullable — the
  frontend's current booking flow doesn't collect them yet (see "Booking
  flow" below)
- Database setup scripts that reset and reseed all four databases from the
  CSV dataset (airports, airport details, fleet, flight schedule, routes) —
  fixed a bug where `airport_details.csv` was parsed but never actually
  merged into the seeded `Airport` rows
- **Verified against the real CSVs**: `airport_details.csv` does have
  `Operational_Status`/`Annual_Passengers`/`Description_Blog` columns with
  those exact headers, confirming the seeding fix is correct
- Neo4j graph seeding for multi-hop route search (cheapest/fastest path
  queries in `routing_repository.py`), plus `list_network_routes()` for the
  distinct-edges network view
- Flight simulator: advances flight status (scheduled → boarding →
  final_call → airborne → completed), streams live position telemetry into
  MongoDB, and also computes `heading` (great-circle bearing) and
  `progress` (0.0–1.0 along the route)
- FastAPI app wiring: lifespan-managed connections across all four
  databases, router registration

### REST API — wired to match the frontend's actual calls (see note below)
- `GET /api/v1/airports` — airport nodes for the Globe/Map
- `GET /api/v1/airports/details` — cinematic "Airports View" metadata
- `GET /api/v1/routes` — active network connections (Neo4j edges)
- `GET /api/v1/flights/schedule` — static daily schedule
- `GET /api/v1/flights/search` — origin/destination search backed by
  Neo4j cheapest + fastest path, joined back to Postgres for `plane`
- `GET /api/v1/flights/seats/{flight_id}` — booked seat numbers (implemented
  per api.md; not yet called by the frontend's seat map, which fakes
  availability locally — left as-is, ready for when it's wired up)
- `GET /api/v1/flights/live` — **new**, not in api.md. `AviationMap.jsx` had
  a `// TODO: IMPLEMENT REAL MONGODB API POLLING HERE` stub expecting a flat
  array of live positions; this fills that in directly (id, flightNumber,
  source, destination, lat, lng, heading, progress) instead of requiring a
  WebSocket client
- `GET /api/v1/fleets` — **renamed from `/fleet`** (api.md's spelling) to
  match `services/api.js`'s `getFleets()` call
- `POST /api/v1/flights/book` — **moved from `/booking/checkout`**, request
  body renamed to camelCase (`flightId`, `seats`, `passengers`,
  `customerDetails?`) and response to `{ success, pnr }` to match
  `bookFlight()`'s call and its consumption in `Booking.jsx`
  (`result.pnr`). Same Redis-locked, transactional seat-booking logic as
  before, `customerDetails` is now optional (see "Booking flow" below)
- `GET /api/v1/dashboard/active-flights` — **new**, not in api.md.
  `LiveOperations.jsx` polls this every 15s for the "Active In-Air" panel
- `GET /api/v1/dashboard/onboarding-flights` — **new**, same page's
  "Boarding" panel
- `GET /api/v1/dashboard/delayed-flights` — **new**, same page's "Delayed
  Warnings" panel (see "Flight status / delay flow" below — will return an
  empty list until something actually sets `status = "delayed"`)

### WebSockets (api.md — implemented, not yet consumed by the frontend)
- `ws://<host>/ws/telemetry` — MongoDB Change Stream → batched
  `FLIGHT_TELEMETRY_UPDATE` broadcasts
- `ws://<host>/ws/operations` — Postgres poller → `OPERATIONAL_UPDATE`
  broadcasts (boarding / delayed panels), only pushes on actual change
- `GET /api/v1/live-flights` and `/api/v1/live-flights/{flight_number}` kept
  as plain REST snapshots for polling/debugging
- None of the above are called by the frontend today — there is no
  WebSocket client anywhere in `src/`. `/flights/live` and `/dashboard/*`
  above were added as REST equivalents so the existing UI works without
  requiring a WS client. **This means live data now has two parallel
  paths (WS per api.md + REST polling for the frontend as it stands) —
  worth collapsing to one once the frontend team decides which they want.**

### RAG chat service
- `app/services/rag_service.py` implemented using Gemini function calling
  (not the originally planned embeddings/vector-similarity approach — the
  baggage policy is injected directly into the system instruction, and
  flight search is exposed as a tool call into
  `routing_repository.cheapest_path()`)
- `app/api/routes/chat.py` wired to `rag_service.process_chat()`
- `GEMINI_API_KEY` / `GEMINI_MODEL` added to environment configuration
- Left untouched during the frontend-alignment pass per explicit request —
  see "Frontend gaps" below for the (currently harmless, since unwired)
  contract mismatch with `sendChatMessage()`

---

## In progress / not yet started

### Frontend gaps (not backend work — flagging so nothing gets missed)
- [ ] **Booking flow collects no passenger name/email anywhere** in the
      4-step UI, but the confirmation screen claims tickets were "sent to
      your email." `Booking.passenger_name`/`passenger_email` are nullable
      now so `/flights/book` works without this, but real bookings need a
      form step added before this is production-ready
- [ ] `Home.jsx` is internally inconsistent about flight-schedule field
      names: the `mappedFlights` enrichment step reads `flight.src`/`flight.dst`
      (the old mock's shape) while the `airportFlights` filter a few lines
      later reads `flight.departure_airport`/`flight.arrival_airport` (the
      real API's shape, left unchanged since it's the correct one). Fix the
      first block to match the second
- [ ] `sendChatMessage()` posts to `/chat` (no trailing slash) and expects
      `{ text, sender }` back; the real endpoint is `/api/v1/chat/` and
      returns `{ answer, sources, route }`. Currently harmless since
      `Chat.jsx`/`ChatWidget.jsx` both hardcode a canned response instead of
      calling it — but needs a small mapping fix whenever it's wired up
- [ ] No WebSocket client exists for `/ws/telemetry` or `/ws/operations`
      (see above) — decide whether to add one and retire the REST polling
      endpoints, or keep both

### Flight status / delay flow
- [ ] Nothing currently transitions a `Flight.status` to `"delayed"` or
      sets `Flight.delay_reason` — the simulator's state machine only ever
      produces scheduled → boarding → final_call → airborne → completed.
      Both `/ws/operations` and `/dashboard/delayed-flights`'s delayed
      lists will stay empty until this is added (either to the simulator
      or a separate ops-input path)

### Booking flow
- [ ] No cancellation/refund endpoint yet (`Booking.status` supports
      `"cancelled"` but nothing sets it)
- [ ] `price_paid` is charged at full `base_price` per seat — confirm
      whether multi-passenger bookings should split/discount pricing
- [ ] Once the frontend adds a passenger-details step, wire
      `customerDetails` back to required on `/flights/book`

### Knowledge base content
- [ ] Generate per-airport markdown files from airport description data
- [ ] Write refund policy content (baggage policy is the only doc so far)
- [ ] If genuine RAG (embeddings + similarity search) is still wanted over
      the current single-document system-prompt approach, that's a
      separate, larger piece of work — confirm whether it's still in scope
      before the knowledge base grows beyond a file or two

### Hardening
- [ ] Tighten CORS (`allow_origins=["*"]`) before deploying publicly
- [ ] `alembic init` if proper migrations are wanted instead of
      drop/recreate + reseed on every schema change

---

## Verification

- [ ] Full end-to-end pass: database reset/seed, API startup, flight
      simulator, booking flow, dashboard polling, chat endpoint, and both
      WebSocket channels working together
- [ ] Confirm the frontend actually works end-to-end against these
      endpoints once `USE_MOCK_DATA` is flipped to `false` — the field-name
      and endpoint mismatches caught so far were found by reading the code,
      not by running it live
