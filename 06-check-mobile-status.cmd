@echo off
cd /d "%~dp0"
echo.
echo [Check] Local network status
echo.

echo Your computer IPv4 addresses:
ipconfig | findstr /c:"IPv4"

echo.
echo Port 3000 status:
netstat -ano | findstr :3000

echo.
echo Firewall rule:
netsh advfirewall firewall show rule name="Fangchan CRM Port 3000"

echo.
echo Phone URL should be:
echo http://192.168.2.21:3000
echo.
pause
