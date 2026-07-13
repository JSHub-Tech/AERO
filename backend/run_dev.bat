@echo off
REM ============================================================
REM  AERO ADMS — Start the FastAPI development server
REM
REM  The flight simulator runs as a SEPARATE process.
REM  Open a second terminal and run:
REM    python scripts\flight_simulator.py
REM ============================================================

call .venv\Scripts\activate.bat

echo.
echo ============================================================
echo   Starting AERO ADMS API on http://localhost:8000
echo   Docs:  http://localhost:8000/docs
echo   Health: http://localhost:8000/health
echo.
echo   To also run live telemetry, open a NEW terminal and run:
echo     python scripts\flight_simulator.py
echo ============================================================
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
