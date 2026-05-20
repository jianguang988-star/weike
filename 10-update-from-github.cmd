@echo off
cd /d "%~dp0"
echo.
echo [GitHub] Update system from private repository
echo.

where git >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT=C:\Program Files\Git\cmd\git.exe"
  ) else (
    echo Git was not found.
    echo Please install Git for Windows first.
    pause
    exit /b 1
  )
) else (
  set "GIT=git"
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found.
  echo Please install Node.js LTS first.
  pause
  exit /b 1
)

echo Pulling latest code from GitHub...
"%GIT%" pull
if errorlevel 1 (
  echo.
  echo Git pull failed. Please check your network, GitHub login, or local changes.
  pause
  exit /b 1
)

echo.
echo Installing or updating dependencies...
npm.cmd install
if errorlevel 1 (
  echo.
  echo npm install failed. Please send the error text above to Codex.
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo.
    echo Created .env from .env.example.
  )
)

echo.
echo Applying database migrations...
npm.cmd run prisma:migrate
if errorlevel 1 (
  echo.
  echo Database migration failed. Please send the error text above to Codex.
  pause
  exit /b 1
)

echo.
echo Done. The system is up to date.
echo You can now start it with 03-start-app.cmd.
pause
