@echo off
echo Starting Omran Sales in Development Mode...
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b %errorlevel%
)

echo.
echo Starting development server and Electron...
start /b npm run dev
timeout /t 5 /nobreak >nul
call electron .

echo.
pause