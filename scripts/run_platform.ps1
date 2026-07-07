# ModAI V4 Platform Launcher

Write-Host "--- 🏍️  Motorcycle Modification AI Platform  ---" -ForegroundColor Cyan

# 1. Check for Virtual Environment
if (-not (Test-Path "venv")) {
    Write-Host "⚠️  Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
}

# 2. Install Requirements
Write-Host "📦 Ensuring all dependencies are up to date..." -ForegroundColor Green
./venv/Scripts/pip install -r requirements.txt
./venv/Scripts/pip install streamlit ultralytics # Ensure frontend specific ones too

# 3. Ask for Database Mode
$choice = Read-Host "Start Docker for PostgreSQL? (y/n) [Default: n (SQLite)]"
if ($choice -eq 'y') {
    Write-Host "🐳 Starting Docker Compose..." -ForegroundColor Blue
    docker-compose up -d
} else {
    Write-Host "📂 Running in SQLite local mode..." -ForegroundColor Blue
}

# 4. Launch Services in separate windows
Write-Host "🚀 Launching Backend API (FastAPI)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit -Command `./venv/Scripts/uvicorn backend.main:app --reload`"

Write-Host "🚀 Launching Frontend UI (Streamlit)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `./venv/Scripts/streamlit run streamlit_app/app.py`"

Write-Host "✅ Platform check triggered. Monitor the separate windows for output." -ForegroundColor Green
