@echo off
REM Starts the FastAPI dev server with auto-reload.
call .venv\Scripts\activate.bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
