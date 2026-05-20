@echo off
cd /d "%~dp0"
echo.
echo [Database] Backup local SQLite database
echo.

if not exist "prisma\dev.db" (
  echo Database file was not found:
  echo prisma\dev.db
  pause
  exit /b 1
)

if not exist "backups" mkdir "backups"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%i"
set "TARGET=backups\weike-dev-%STAMP%.db"

copy "prisma\dev.db" "%TARGET%" >nul
if errorlevel 1 (
  echo Backup failed. Please close the system and try again.
  pause
  exit /b 1
)

echo Backup created:
echo %TARGET%
pause
