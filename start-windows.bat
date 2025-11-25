@echo off
REM ResumeRank - Windows Local Development Startup Script
REM This script sets up environment and starts the development server

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║    ResumeRank - Windows Local Development Startup          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Set Node.js memory limit for Windows compatibility
set NODE_OPTIONS=--max-old-space-size=4096

REM Set development environment
set NODE_ENV=development

REM Check if PostgreSQL is running
echo [1/4] Checking PostgreSQL connection...
timeout /t 1 /nobreak >nul
echo ✓ PostgreSQL check skipped (ensure it's running on localhost:5432)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo.
    echo [2/4] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ✗ Failed to install dependencies
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo [2/4] Dependencies already installed
    echo ✓ Skipping npm install
)

REM Sync database schema
echo.
echo [3/4] Syncing database schema...
call npm run db:push
if errorlevel 1 (
    echo ⚠ Database push failed, trying with --force flag...
    call npm run db:push -- --force
    if errorlevel 1 (
        echo ✗ Database schema sync failed
        echo Please ensure PostgreSQL is running and .env.local is configured correctly
        pause
        exit /b 1
    )
)
echo ✓ Database schema synced

REM Start development server
echo.
echo [4/4] Starting development server...
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Development server starting on http://localhost:5000      ║
echo ║                                                             ║
echo ║  Admin Login:                                              ║
echo ║    Email: soorajmalhi18tl48@gmail.com                      ║
echo ║    Password: (use email/password signup or OAuth)          ║
echo ║                                                             ║
echo ║  Press Ctrl+C to stop the server                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Start the dev server
call npm run dev

REM If script reaches here, server was stopped
echo.
echo Development server stopped.
pause
