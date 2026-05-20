@echo off
cd /d "%~dp0"
echo.
echo [GitHub] Push system updates
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

"%GIT%" status --short --branch
if errorlevel 1 (
  echo.
  echo Git status failed. Please send the error text above to Codex.
  pause
  exit /b 1
)

echo.
set /p MSG=Enter update note, then press Enter: 
if "%MSG%"=="" (
  echo Update note cannot be empty.
  pause
  exit /b 1
)

"%GIT%" add .
if errorlevel 1 (
  echo.
  echo Git add failed. Please send the error text above to Codex.
  pause
  exit /b 1
)

"%GIT%" diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo No code changes to commit.
  pause
  exit /b 0
)

"%GIT%" commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo Git commit failed. Please send the error text above to Codex.
  pause
  exit /b 1
)

"%GIT%" push
if errorlevel 1 (
  echo.
  echo Git push failed. Please check your network or GitHub login.
  echo You can run this script again after the network is ready.
  pause
  exit /b 1
)

echo.
echo Done. Updates have been pushed to GitHub.
pause
