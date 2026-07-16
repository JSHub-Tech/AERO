@echo off
REM ============================================================
REM  AERO ADMS — Environment setup (Windows)
REM
REM  One-time (or as-needed) setup — no databases are touched:
REM    1. Creates a virtual environment (.venv) if missing
REM    2. Installs/updates Python dependencies from requirements.txt
REM    3. Verifies .env exists
REM
REM  Run this first. Once it finishes, run seed_all.bat to create
REM  and seed all four databases.
REM ============================================================

setlocal

REM ── 1. Virtual environment ───────────────────────────────────
if not exist ".venv\Scripts\python.exe" (
    echo [setup] No .venv found — creating one...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo [setup] Installing requirements...
    pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
    echo [setup] Updating requirements...
    pip install -r requirements.txt
)

REM ── 2. Guard: .env must exist ────────────────────────────────
if not exist ".env" (
    echo.
    echo [setup] ERROR: .env file not found.
    echo         Copy .env.example to .env and fill in your credentials.
    exit /b 1
)

echo.
echo ============================================================
echo   Environment ready.
echo.
echo   Next step:
echo     seed_all.bat   ^(create and seed all 4 databases^)
echo ============================================================
exit /b 0
