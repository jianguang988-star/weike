@echo off
cd /d "%~dp0"
echo.
echo [Public Link] Start a temporary phone link
echo.

if not exist "node_modules" (
  echo Dependencies are missing. Please run 01-install-dependencies.cmd first.
  pause
  exit /b 1
)

echo This will open a second window for the local app server.
echo Keep both windows open.
echo.

start "Fangchan CRM Local Server" cmd /k "cd /d %~dp0 && npm.cmd run dev:mobile"

echo Waiting 8 seconds for local server...
timeout /t 8 /nobreak >nul

echo.
echo First check this URL on this computer:
echo http://127.0.0.1:3000
echo.
echo If the local page does not work on the computer, the phone link will not work either.
echo.

echo.
echo A public URL will appear below, usually like:
echo https://xxxx.loca.lt
echo.
echo Open that URL on your phone.
echo If the page asks for an endpoint IP password, enter this computer public IP shown by localtunnel.
echo.

npm.cmd run tunnel
pause
