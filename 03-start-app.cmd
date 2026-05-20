@echo off
cd /d "%~dp0"
echo.
echo [Step 3] Start app
echo.

if not exist "node_modules" (
  echo Dependencies are missing. Please run 01-install-dependencies.cmd first.
  pause
  exit /b 1
)

echo Keep this window open.
echo Open this URL in your browser:
echo http://localhost:3000
echo.
echo For phone access, use 04-start-mobile.cmd instead.
echo.

npm.cmd run dev
pause
