@echo off
REM ============================================================
REM  AERO ADMS — Reset setup markers
REM
REM  NOTE: As of the new schema, setup.bat already clears markers
REM  automatically before every run, so you rarely need this.
REM  It is kept for manual use when you want to re-run a single
REM  script (e.g., just python scripts\verify_redis.py) without
REM  running the full setup.bat pipeline.
REM ============================================================

if exist ".markers" (
    rmdir /s /q ".markers"
    echo Markers cleared.
) else if exist "scripts\.markers" (
    rmdir /s /q "scripts\.markers"
    echo Markers cleared.
) else (
    echo No markers found — nothing to clear.
)
echo Re-run setup.bat or an individual script to rebuild.
