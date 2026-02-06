# ===============================================================
# PRIME-PENTRIX V3 - Docker Stop Script
# Stops all running services
# ===============================================================

Write-Host "[STOP] Stopping Prime-Pentrix V3 services..." -ForegroundColor Yellow

$infraPath = Join-Path $PSScriptRoot "infrastructure"
Push-Location $infraPath

docker-compose down

Write-Host ""
Write-Host "[OK] All services stopped!" -ForegroundColor Green

Pop-Location
