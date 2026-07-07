@echo off
TITLE ModAI V4 Master Control
echo ==================================================
echo 🚀 INITIALIZING BIKE MODAI V4 PLATFORM...
echo ==================================================
echo.

:: 1. Cleanup
echo 🧹 Cleaning up stale connections...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

:: 2. Verify Backend
echo 🧠 Starting AI Engine (Backend)...
start "ModAI Backend" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"

:: 3. Verify Frontend
echo 🌐 Starting UI Dashboard (Frontend)...
cd frontend
start "ModAI Frontend" cmd /k "npm run dev"

echo.
echo ==================================================
echo ⏳ WAITING FOR SYNCHRONIZATION...
echo ==================================================

:wait_loop
timeout /t 3 >nul
curl -s http://localhost:8000/health >nul
if %errorlevel% neq 0 (
    echo   ... waiting for AI Engine (8000)
    goto wait_loop
)

echo.
echo ✅ ALL SYSTEMS NOMINAL.
echo 🌐 Opening browser to http://localhost:3000
start http://localhost:3000

pause
