@echo off
REM ============================================================
REM  AERO ADMS - one-command database setup (Windows)
REM  Safe to run multiple times: each step is skipped if its
REM  marker file in scripts\.markers already exists, and the
REM  underlying SQL/Cypher/Mongo calls are themselves idempotent.
REM ============================================================

setlocal

if not exist ".venv\Scripts\python.exe" (
    echo [setup] No .venv found - creating one and installing requirements...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

if not exist ".env" (
    echo [setup] ERROR: .env file not found. Copy .env.example to .env and fill in your credentials.
    exit /b 1
)

if not exist "scripts\.markers" mkdir "scripts\.markers"

echo.
echo ==============================
echo   PostgreSQL (Supabase)
echo ==============================
if exist "scripts\.markers\postgres.done" (
    echo [skip] Postgres tables already created.
) else (
    python scripts\create_postgres_tables.py || goto :error
)

echo.
echo ==============================
echo   Neo4j (Aura)
echo ==============================
if exist "scripts\.markers\neo4j.done" (
    echo [skip] Neo4j constraints already created.
) else (
    python scripts\create_neo4j_constraints.py || goto :error
)

echo.
echo ==============================
echo   MongoDB (Atlas)
echo ==============================
if exist "scripts\.markers\mongo.done" (
    echo [skip] Mongo collections already created.
) else (
    python scripts\create_mongo_collections.py || goto :error
)

echo.
echo ==============================
echo   Redis (Upstash)
echo ==============================
if exist "scripts\.markers\redis.done" (
    echo [skip] Redis already verified.
) else (
    python scripts\verify_redis.py || goto :error
)

echo.
echo All databases are ready. Run "run_dev.bat" to start the API.
exit /b 0

:error
echo.
echo [setup] A step failed - see the error above. Fix it and re-run setup.bat;
echo         already-completed steps will be skipped automatically.
exit /b 1
