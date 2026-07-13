# AERO Backend — Managed-Services Edition

Same polyglot architecture as the original AERO ADMS report, rebuilt for a
hackathon deploy: no Docker, no local DB containers — everything runs
against managed cloud services, and the whole backend is async end to end.

## Databases & their async libraries

| Store | Service | Async library | Why |
|---|---|---|---|
| Relational | Supabase (Postgres) | **SQLAlchemy 2.0 (async) + asyncpg** | Most mature async Python ORM; works cleanly through Supabase's PgBouncer pooler once prepared statements are disabled (already handled in `app/db/postgres.py`) |
| Graph | Neo4j Aura | **Official `neo4j` driver's `AsyncGraphDatabase`** | There's no mature async OGM (neomodel is sync-only) — raw async driver + a thin repository (`app/repositories/routing_repository.py`) is faster to build and fully async |
| Document | MongoDB Atlas | **Motor + Beanie** | Motor is Mongo's official async driver; Beanie layers Pydantic-based ODM on top so documents are just Pydantic models |
| Key-value | Upstash Redis | **`redis.asyncio` (TCP) or `upstash-redis` (REST)** | TCP is faster for a persistent server (Render/Railway); REST is the fallback for serverless. `app/db/redis_client.py` auto-picks based on what's in `.env` |

## Folder structure

```
aero-adms-backend/
├── app/
│   ├── main.py                 # FastAPI app + lifespan (opens/closes all 4 DB connections)
│   ├── config.py                # pydantic-settings, loads .env once
│   ├── db/                      # one connection module per database
│   │   ├── postgres.py          # async engine/session
│   │   ├── neo4j.py              # async driver + session context manager
│   │   ├── mongodb.py            # motor client + beanie init
│   │   └── redis_client.py       # upstash client (TCP or REST)
│   ├── models/
│   │   ├── sql_models.py         # SQLAlchemy ORM (Aircraft, Flight, Seat, Booking)
│   │   ├── graph_models.py       # Neo4j schema reference (dataclasses, documentation only)
│   │   ├── mongo_models.py       # Beanie documents (LiveFlight)
│   │   └── schemas.py            # Pydantic API request/response models
│   ├── repositories/             # raw Cypher / query logic lives here, not in routes
│   │   └── routing_repository.py
│   ├── services/                 # business logic (RAG, routing orchestration) — add rag_service.py here
│   ├── api/routes/                # one router per resource
│   └── knowledge_base/            # static docs for the RAG system (baggage policy, refund rules...)
├── scripts/                      # ONE-TIME setup scripts, see below
├── setup.bat                     # one-command, idempotent DB setup
├── run_dev.bat                   # starts uvicorn
├── requirements.txt
└── .env.example
```

**Why `repositories/` is separate from `models/`:** SQLAlchemy models are
declarative and queried through sessions directly in routes/services, but
Neo4j has no ORM — so all its Cypher is centralized in one place instead of
scattered across route handlers.

## One-time setup scripts (`scripts/`)

Each script creates schema for exactly one database and is independently
idempotent:

- `create_postgres_tables.py` — `Base.metadata.create_all()`, which
  natively skips existing tables.
- `create_neo4j_constraints.py` — uses `CREATE CONSTRAINT IF NOT EXISTS` /
  `CREATE INDEX IF NOT EXISTS`.
- `create_mongo_collections.py` — checks `list_collection_names()` before
  creating the validated `live_flights` collection.
- `verify_redis.py` — Redis is schemaless, so this just confirms Upstash is
  reachable and writable.
- `setup_all.py` — runs all four in sequence (used internally by `setup.bat`).

On top of the idempotency built into each script, every step also writes a
marker file to `scripts/.markers/<name>.done` once it succeeds. `setup.bat`
checks for that marker **first** and skips the whole script if present —
so re-running `setup.bat` after a partial failure only redoes what didn't
finish. Run `scripts\reset_markers.bat` if you ever want to force
everything to be re-checked (it does not drop any data).

## Running it

```bat
setup.bat        REM creates venv, installs requirements, sets up all 4 databases
run_dev.bat       REM starts uvicorn on :8000 with --reload
```

## Deployment recommendation for the hackathon

- **Backend (FastAPI):** Render or Railway (free tier, native Python
  buildpack, no Docker needed — both auto-detect `requirements.txt`). Set
  the start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  and paste the same `.env` values into their dashboard's env-var UI.
- Avoid serverless platforms (Vercel/Netlify functions) for this backend:
  Neo4j Bolt and Motor's connection pooling both want a long-lived process,
  which matches Render/Railway's model much better.
- **Frontend (React/Vite):** Vercel or Netlify — both build static Vite
  output for free and it's a two-click GitHub import.
- Keep `UPSTASH_REDIS_TCP_URL` set in production (Render/Railway support
  outbound TCP) for lower-latency seat locks; the REST client is only a
  fallback for platforms that block raw TCP.
- Add a GitHub Actions workflow later if you want CI, but for hackathon
  speed, Render/Railway's "auto-deploy on push to main" is enough.

## Next steps (not yet built)

- `app/services/rag_service.py`: embed `app/knowledge_base/*.md` with
  Gemini's embedding model, store vectors (in Postgres via `pgvector`,
  Supabase supports it natively, or in-memory with numpy for a hackathon),
  and blend retrieval with the Neo4j/Postgres structured queries for the
  natural-language chat endpoint.
- Fill in `app/api/routes/flights.py` and `bookings.py` with real
  SQLAlchemy queries and the Redis seat-lock flow described in the AERO
  ADMS report (`acquire_lock` / `release_lock` in `app/db/redis_client.py`
  are already there for this).
- `alembic init` if you want proper migrations instead of `create_all`.
