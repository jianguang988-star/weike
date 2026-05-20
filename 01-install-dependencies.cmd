@echo off
cd /d "%~dp0"
echo.
echo [Step 1] Install dependencies
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Please install Node.js LTS from https://nodejs.org
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found.
  echo Please reinstall Node.js LTS and enable Add to PATH.
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env file.
)

echo Installing dependencies. This may take several minutes...
npm.cmd install
if errorlevel 1 (
  echo.
  echo Install failed. Please send the error text above to Codex.
  pause
  exit /b 1
)

echo.
echo Done. Next, double click 02-init-database.cmd
pause
