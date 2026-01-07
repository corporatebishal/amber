@echo off
echo ========================================
echo Amber Price Monitor - Installation
echo ========================================
echo.

echo [1/3] Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Installing web UI dependencies...
cd web
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install web dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Building web UI...
cd web
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build web UI
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Your API key is already configured in .env
echo.
echo To start the application:
echo   npm run dev
echo.
echo Then open your browser to:
echo   http://localhost:3000
echo.
echo See SETUP.md for more details.
echo.
pause
