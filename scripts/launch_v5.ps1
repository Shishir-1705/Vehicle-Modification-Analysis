# ModAI V5 Platform Master Launcher
# This script orchestrates the full Next-Gen AI stack.

Write-Host "--- 🏍️  MOTORCYCLE MODAI PLATFORM V5  ---" -ForegroundColor Blue
Write-Host "--- Professional Enforcement & Verification Engine ---" -ForegroundColor Cyan

# 1. Dependency Validation
if (-not (Test-Path "venv")) {
    Write-Host "⚠️  Virtual environment not found. Initializing..." -ForegroundColor Yellow
    python -m venv venv
    ./venv/Scripts/pip install -r requirements.txt
}

# 2. Database & Infrastructure Check
$dockerChoice = Read-Host "Start Enterprise Infrastructure (Docker)? (y/n) [Default: n (Local Dev Mode)]"
if ($dockerChoice -eq 'y') {
    Write-Host "🐳 Spin-up Docker Compose Cluster..." -ForegroundColor Blue
    docker-compose up -d
}

# 3. Service Orchestration
Write-Host "`n🚀 Launching Core Services..." -ForegroundColor Green

# A. FastAPI Backend (AI Inference Gateway)
Write-Host "[1/2] Starting ModAI API Port 8000..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit -Command `./venv/Scripts/uvicorn backend.main:app --port 8000 --reload`"

# B. Next.js Dashboard (Intelligence Portal)
Write-Host "[2/2] Starting Interactive Portal Port 3000..." -ForegroundColor Green
Set-Location -Path "./frontend"
Start-Process powershell -ArgumentList "-NoExit -Command `npm run dev`"
Set-Location -Path ".."

Write-Host "`n✅ Full-Stack Deployment Initialized." -ForegroundColor Green
Write-Host "→ API Discovery: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "→ Admin Portal: http://localhost:3000" -ForegroundColor Gray
Write-Host "`nPress any key to exit this launcher (services will remain running)..." -ForegroundColor Yellow
Pause
