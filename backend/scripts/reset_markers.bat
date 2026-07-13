@echo off
REM Deletes the "already done" markers so setup.bat re-runs every step.
REM This does NOT drop tables/collections/constraints - it only forces the
REM idempotent creation scripts to run again (they'll just no-op on
REM anything that still exists in the actual databases).
if exist ".markers" (
    rmdir /s /q ".markers"
    echo Markers cleared. Next setup.bat run will re-check every database.
) else (
    echo No markers found - nothing to clear.
)
