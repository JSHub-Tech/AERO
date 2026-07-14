<div align="center">

<img src="frontend/public/logo.png" alt="AERO Logo" width="120" />

# ✈️ AERO — Intelligent Flight Routing & Travel Agent

**A Natural Language-Powered Aviation Intelligence System**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Neo4j](https://img.shields.io/badge/Neo4j-Aura-008CC1?style=flat-square&logo=neo4j&logoColor=white)](https://neo4j.com/cloud/aura/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=flat-square&logo=redis&logoColor=white)](https://upstash.com)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)

*Type in plain English. Get real routes, live prices, baggage policies — instantly.*

</div>

---

## 🗺️ What Is AERO?

AERO is a **polyglot-persistence, AI-native flight routing agent** built for an aviation hackathon. A user can type a query like:

> *"Find me a way to get from Lahore to New York via London under $1000 and tell me the baggage policy at Heathrow."*

AERO simultaneously:
- 🧠 **Understands the intent** using Gemini LLM
- 🗺️ **Traverses the route graph** in Neo4j to find valid multi-hop paths (up to 3 legs) with chronological layover validation
- 💺 **Cross-references real-time seat counts and prices** in PostgreSQL (Supabase)
- 📄 **Retrieves baggage & transit policies** via RAG over a curated knowledge base
- 🛫 **Streams live aircraft positions** from MongoDB telemetry updated by the flight simulator

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│           Natural Language Chat  •  Live Flight Map             │
└──────────────────────┬──────────────────────────────────────────┘
                       │  HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────────────┐
│                   FastAPI Backend (async)                       │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Chat Route │  │ Routing Repo │  │  Live Flights Route │     │
│  │  (Gemini +  │  │  (Cypher +   │  │  (MongoDB Change    │     │
│  │   RAG)      │  │   SQL blend) │  │   Stream → WS)      │     │
│  └─────────────┘  └──────────────┘  └─────────────────────┘     │
└────┬───────────────────┬──────────────────┬──────────────────┬──┘
     │                   │                  │                  │
┌────▼────┐        ┌─────▼──────┐    ┌──────▼─────┐    ┌──────▼──┐
│ Neo4j   │        │ PostgreSQL │    │  MongoDB   │    │  Redis  │
│  Aura   │        │  Supabase  │    │   Atlas    │    │ Upstash │
│         │        │            │    │            │    │         │
│ Route   │        │ Seats,     │    │ Live       │    │ Seat    │
│ Graph   │        │ Bookings,  │    │ Telemetry  │    │ Locks & │
│ Topology│        │ Pricing    │    │ Positions  │    │ Cache   │
└─────────┘        └────────────┘    └────────────┘    └─────────┘
```

### Database Responsibilities

| Database | Provider | What It Owns |
|---|---|---|
| **Neo4j** | Aura | Airport network topology, multi-hop route discovery, chronological layover validation |
| **PostgreSQL** | Supabase | Flights, seats, bookings, passengers — ACID transactional ground truth |
| **MongoDB** | Atlas | Real-time aircraft telemetry (position, status) — updated by the flight simulator |
| **Redis** | Upstash | Distributed seat locks (prevents double-booking), routing result cache |

---

## 🧩 Key Features

### 🗣️ Natural Language Routing
Type any flight query in plain English. Gemini extracts origin, destination, waypoints, budget, and constraints — then AERO executes concurrent Cypher + SQL queries to answer.

### 🛤️ Multi-Hop Graph Routing
Neo4j finds all valid paths from A to B (up to 3 legs) with hard constraints:
- Each connecting leg departs **≥ 1 hour after the prior leg arrives**
- Cancelled or full flights are automatically excluded

### 💰 Real-Time Price & Seat Validation
Graph results feed directly into a single PostgreSQL query that returns live seat counts and confirmed pricing per class (Economy / Premium Economy / Business / First).

### 📄 RAG Policy Retrieval
Baggage allowances, transit visa rules, and terminal policies are answered via semantic search over Markdown knowledge-base documents using Gemini Embeddings.

### 🛫 Live Flight Simulator
A standalone async simulator drives a complete flight state machine:

```
scheduled → boarding → final_call → airborne → completed
```

While airborne, it interpolates aircraft position between airports and streams updates to the frontend map via MongoDB Change Streams + WebSocket.

---

## 📁 Project Structure

```
AERO/
├── backend/                         # FastAPI application
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── chat.py              # Natural language + RAG endpoint
│   │   │   ├── flights.py           # Flight search & detail endpoints
│   │   │   ├── routing.py           # Multi-hop route resolver
│   │   │   ├── bookings.py          # Booking & seat management
│   │   │   └── live_flights.py      # WebSocket live telemetry
│   │   ├── db/
│   │   │   ├── postgres.py          # SQLAlchemy async engine (Supabase)
│   │   │   ├── neo4j.py             # Neo4j async driver (Aura)
│   │   │   ├── mongodb.py           # Motor + Beanie (Atlas)
│   │   │   └── redis_client.py      # Upstash Redis
│   │   ├── models/
│   │   │   ├── sql_models.py        # SQLAlchemy ORM (Airport, Flight, Seat, Booking)
│   │   │   ├── mongo_models.py      # Beanie documents (LiveFlight)
│   │   │   └── graph_models.py      # Neo4j response models
│   │   ├── repositories/
│   │   │   └── routing_repository.py # All Cypher queries
│   │   ├── knowledge_base/
│   │   │   └── baggage_policy.md    # RAG source document
│   │   ├── config.py                # Pydantic settings (reads .env)
│   │   └── main.py                  # FastAPI app + lifespan
│   ├── scripts/
│   │   ├── create_postgres_tables.py  # Drop + create + seed Postgres
│   │   ├── create_neo4j_constraints.py # Wipe + recreate + seed Neo4j
│   │   ├── create_mongo_collections.py # Drop + recreate MongoDB
│   │   ├── verify_redis.py            # Verify + flush Redis
│   │   ├── setup_all.py               # Orchestrates all four scripts
│   │   └── flight_simulator.py        # Async live telemetry simulator
│   ├── setup.bat                    # One-command full reset + seed
│   ├── run_dev.bat                  # Start the API server
│   └── requirements.txt
│
└── frontend/
    ├── public/
    │   ├── airport.csv              # 39 airports (IATA, coords, metadata)
    │   ├── airport_details.csv      # Timezone, terminals, description
    │   ├── fleet.csv                # 65 aircraft (B777, A320, ATR)
    │   ├── flight_schedule.csv      # 80 scheduled routes
    │   ├── routes.csv               # 700 O&D pairs with distance + duration
    │   └── Team/                    # Airport imagery assets
    └── src/                         # React application
```

---

## ⚡ Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- Accounts on: [Supabase](https://supabase.com), [Neo4j Aura](https://neo4j.com/cloud/aura/), [MongoDB Atlas](https://www.mongodb.com/atlas), [Upstash](https://upstash.com), [Google AI Studio](https://aistudio.google.com)

### 1. Clone & configure

```bash
git clone https://github.com/JSHub-Tech/AERO.git
cd AERO/backend
cp .env.example .env
# Fill in all credentials in .env
```

### 2. Seed all databases

```bat
setup.bat
```

This drops and recreates all tables/collections/graph nodes, then seeds everything from the CSV files in `frontend/public/`. Safe to run repeatedly.

### 3. Start the API

```bat
run_dev.bat
```

API available at `http://localhost:8000` · Docs at `http://localhost:8000/docs`

### 4. Start the flight simulator *(separate terminal)*

```bash
python scripts/flight_simulator.py
```

### 5. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## 🔧 Environment Variables

```env
# PostgreSQL (Supabase)
DATABASE_URL=postgresql+asyncpg://postgres.xxxx:PASSWORD@host:5432/postgres

# Neo4j (Aura)
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

# MongoDB (Atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
MONGODB_DB_NAME=aero_adms

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# App
ENV=development
```

---

## 📊 Dataset

The system is seeded from five CSV files covering Pakistan International Airlines' route network:

| File | Records | Contents |
|---|---|---|
| `airport.csv` | 39 airports | IATA codes, coordinates, country |
| `airport_details.csv` | 39 airports | Timezone, terminals, annual passengers, description |
| `fleet.csv` | 65 aircraft | Boeing 777-300ER, Airbus A320-200, ATR 72-500 |
| `flight_schedule.csv` | 80 routes | Flight numbers, departure times, days of week, pricing |
| `routes.csv` | 700 O&D pairs | Distance (km), duration (minutes), base price (PKR) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | Google Gemini 2.5 Flash |
| **Embeddings** | Gemini Embedding 001 |
| **Backend** | FastAPI (fully async) |
| **Graph DB** | Neo4j Aura |
| **Relational DB** | PostgreSQL via Supabase |
| **Document DB** | MongoDB Atlas via Motor + Beanie |
| **Cache / Locks** | Redis via Upstash |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Frontend** | React 18 + Tailwind CSS |
| **Real-time** | WebSocket + MongoDB Change Streams |

---

## 👥 Team

| Name | Role |
|---|---|
| **Muhammad Jamal Matloob** | Database Design, Graph Routing, Neo4j Cypher |
| **Muhammad Umer** | Backend Architecture, AI Integration, RAG Pipeline |
| **Saad Asif** | Frontend, Real-time UI |

---

## 📄 License

This project was built for a hackathon. All rights reserved © 2025 JSHub-Tech.
