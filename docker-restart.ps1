# ===============================================================
# PRIME-PENTRIX V3 - Quick Docker Restart
# Restarts all services without rebuilding
# ===============================================================

Write-Host "[RESTART] Restarting Prime-Pentrix V3 services..." -ForegroundColor Cyan

$infraPath = Join-Path $PSScriptRoot "infrastructure"
Push-Location $infraPath

docker-compose restart

Write-Host ""
Write-Host "[OK] Services restarted!" -ForegroundColor Green
Write-Host "[WEB] Frontend: http://localhost:3000" -ForegroundColor Cyan

Pop-Location
