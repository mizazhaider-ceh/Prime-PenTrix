# ===============================================================
# PRIME-PENTRIX V3 - Docker Startup Script
# Starts all services: PostgreSQL, Brain API, and Next.js Frontend
# ===============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     PRIME-PENTRIX V3 - Starting All Services with Docker  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to infrastructure directory
$infraPath = Join-Path $PSScriptRoot "infrastructure"
Push-Location $infraPath

try {
    # Stop any existing containers
    Write-Host "[STOP] Stopping existing containers..." -ForegroundColor Yellow
    docker-compose down 2>$null

    # Build images with latest changes
    Write-Host ""
    Write-Host "[BUILD] Building Docker images..." -ForegroundColor Cyan
    docker-compose build --no-cache

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[X] Build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    # Start all services
    Write-Host ""
    Write-Host "[START] Starting all services..." -ForegroundColor Green
    docker-compose up -d

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[X] Failed to start services!" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    # Wait for services to be healthy
    Write-Host ""
    Write-Host "[WAIT] Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # Show service status
    Write-Host ""
    Write-Host "[STATUS] Service Status:" -ForegroundColor Cyan
    docker-compose ps

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "              ALL SERVICES RUNNING SUCCESSFULLY             " -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "[WEB] Frontend:    " -NoNewline -ForegroundColor Cyan
    Write-Host "http://localhost:3000" -ForegroundColor White
    Write-Host "[API] Brain API:   " -NoNewline -ForegroundColor Cyan
    Write-Host "http://localhost:8000" -ForegroundColor White
    Write-Host "[DOCS] API Docs:    " -NoNewline -ForegroundColor Cyan
    Write-Host "http://localhost:8000/docs" -ForegroundColor White
    Write-Host "[DB] PostgreSQL:  " -NoNewline -ForegroundColor Cyan
    Write-Host "localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "[LOGS] View logs:       " -NoNewline -ForegroundColor Yellow
    Write-Host "docker-compose logs -f" -ForegroundColor White
    Write-Host "[STOP] Stop services:   " -NoNewline -ForegroundColor Yellow
    Write-Host "docker-compose down" -ForegroundColor White
    Write-Host "[RESTART] Restart service: " -NoNewline -ForegroundColor Yellow
    Write-Host "docker-compose restart [service-name]" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "[ERROR] $_" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}
