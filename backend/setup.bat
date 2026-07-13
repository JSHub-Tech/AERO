@echo off
REM ============================================================
REM  AERO ADMS — Full database reset and seed (Windows)
REM
REM  This script always performs a COMPLETE reset:
REM    1. Drops and recreates all PostgreSQL tables, then seeds
REM       from the CSV files in frontend/public/
REM    2. Wipes and rebuilds the Neo4j routing graph
REM    3. Drops and recreates the MongoDB live_flights collection
REM    4. Verifies Redis and flushes stale locks/cache
REM
REM  Run this after pulling new dataset CSVs or whenever you want
REM  a clean database state. Safe to run repeatedly.
REM ============================================================

setlocal

REM ── 1. Virtual environment ───────────────────────────────────
if not exist ".venv\Scripts\python.exe" (
    echo [setup] No .venv found — creating one and installing requirements...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

REM ── 2. Guard: .env must exist ────────────────────────────────
if not exist ".env" (
    echo.
    echo [setup] ERROR: .env file not found.
    echo         Copy .env.example to .env and fill in your credentials.
    exit /b 1
)

REM ── 3. Clear old markers so every step always runs ───────────
if exist "scripts\.markers" (
    echo [setup] Clearing old markers to force full re-seed...
    rmdir /s /q "scripts\.markers"
)
mkdir "scripts\.markers"

echo.
echo ============================================================
echo   AERO ADMS - Full Reset ^& Seed
echo ============================================================

REM ── 4. PostgreSQL — drop + create + seed ─────────────────────
echo.
echo [1/4] PostgreSQL ^(Supabase^) — drop, recreate, seed from CSVs
python scripts\create_postgres_tables.py || goto :error

REM ── 5. Neo4j — wipe + constraints + seed ─────────────────────
echo.
echo [2/4] Neo4j ^(Aura^) — wipe graph, recreate constraints, seed flights
python scripts\create_neo4j_constraints.py || goto :error

REM ── 6. MongoDB — drop + recreate collection ──────────────────
echo.
echo [3/4] MongoDB ^(Atlas^) — drop and recreate live_flights collection
python scripts\create_mongo_collections.py || goto :error

REM ── 7. Redis — verify + flush stale locks ────────────────────
echo.
echo [4/4] Redis ^(Upstash^) — verify connectivity, flush stale cache
python scripts\verify_redis.py || goto :error

REM ── 8. Done ──────────────────────────────────────────────────
echo.
echo ============================================================
echo   All databases reset and seeded successfully.
echo.
echo   Next steps:
echo     run_dev.bat                        ^(start the API^)
echo     python scripts\flight_simulator.py ^(start live telemetry^)
echo ============================================================
exit /b 0

:error
echo.
echo ============================================================
echo   [FAILED] A setup step failed — see the error above.
echo   Fix the issue and re-run setup.bat.
echo ============================================================
exit /b 1
