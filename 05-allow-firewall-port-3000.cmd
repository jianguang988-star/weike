@echo off
net session >nul 2>nul
if not %errorlevel%==0 (
  echo.
  echo Please right click this file and choose:
  echo Run as administrator
  echo.
  pause
  exit /b 1
)

echo.
echo Adding Windows Firewall rules for phone access...
echo.

netsh advfirewall firewall delete rule name="Fangchan CRM Port 3000" >nul 2>nul
netsh advfirewall firewall add rule name="Fangchan CRM Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any

echo.
echo Current rule:
netsh advfirewall firewall show rule name="Fangchan CRM Port 3000"

echo.
echo Done.
echo Keep 04-start-mobile.cmd running, then open this on your phone:
echo http://192.168.2.21:3000
echo.
pause
