@echo off
cd /d "%~dp0"
echo.
echo [Step 2] Initialize SQLite database
echo.

if not exist "node_modules" (
  echo Dependencies are missing. Please run 01-install-dependencies.cmd first.
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env file.
)

npm.cmd run prisma:migrate -- --name init
if errorlevel 1 (
  echo.
  echo Database initialization failed. Please send the error text above to Codex.
  pause
  exit /b 1
)

echo.
echo Done. Next, double click 03-start-app.cmd
pause
