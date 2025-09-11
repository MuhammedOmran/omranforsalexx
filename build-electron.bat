@echo off
echo Building Omran Sales Desktop App...
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b %errorlevel%
)

echo.
echo Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build React app
    pause
    exit /b %errorlevel%
)

echo.
echo Building Windows executable...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo Error: Failed to build executable
    pause
    exit /b %errorlevel%
)

echo.
echo Build completed successfully!
echo Check the 'dist-electron' folder for the .exe file
echo.
pause