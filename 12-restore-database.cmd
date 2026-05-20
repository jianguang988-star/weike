@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
echo.
echo [Database] Restore SQLite database from another computer
echo.
echo IMPORTANT:
echo 1. Close the running system first.
echo 2. Use this only with a trusted dev.db backup from your own computer.
echo.

set /p SOURCE=Drag dev.db here or enter full path, then press Enter: 
if "%SOURCE%"=="" (
  echo Source path cannot be empty.
  pause
  exit /b 1
)

set "SOURCE=%SOURCE:"=%"

if not exist "%SOURCE%" (
  echo Source file was not found:
  echo %SOURCE%
  pause
  exit /b 1
)

if not exist "backups" mkdir "backups"

if exist "prisma\dev.db" (
  for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%i"
  set "BACKUP=backups\before-restore-%STAMP%.db"
  copy "prisma\dev.db" "!BACKUP!" >nul
  if errorlevel 1 (
    echo Could not create safety backup. Restore stopped.
    pause
    exit /b 1
  )
  echo Safety backup created:
  echo !BACKUP!
)

copy /Y "%SOURCE%" "prisma\dev.db" >nul
if errorlevel 1 (
  echo Restore failed. Please close the system and try again.
  pause
  exit /b 1
)

echo.
echo Restore complete. You can now start the system.
pause
