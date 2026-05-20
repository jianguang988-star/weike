@echo off
cd /d "%~dp0"
echo.
echo [Mobile] Start app for phone access
echo.

if not exist "node_modules" (
  echo Dependencies are missing. Please run 01-install-dependencies.cmd first.
  pause
  exit /b 1
)

echo Keep this window open.
echo.
echo On your phone:
echo 1. Connect to the same WiFi as this computer.
echo 2. Open one of the URLs below in your phone browser.
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo http://%%b:3000
)

echo.
echo If Windows Firewall asks for permission, click Allow access.
echo.

npm.cmd run dev:mobile
pause
