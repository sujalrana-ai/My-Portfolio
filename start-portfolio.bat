@echo off
setlocal

set "PORT=8000"
set "HOST=127.0.0.1"
set "URL=http://%HOST%:%PORT%/"
set "ROOT=%~dp0"

netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  echo Portfolio server is already running on %URL%
  start "" "%URL%"
  exit /b 0
)

echo Starting portfolio server on %URL%
start "Portfolio Server" /MIN cmd /c "cd /d "%ROOT%" && node server.js"
timeout /t 2 /nobreak >nul
start "" "%URL%"
