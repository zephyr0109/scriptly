# Script to build and push Docker images for Scriptly Web and API
# Usage: .\build-docker.ps1 [VERSION] [NEXT_PUBLIC_API_URL]

param (
    [string]$Version = "v$(Get-Date -Format 'yyyyMMdd_HHmm')",
    [string]$ApiUrl = "http://zephyr0109.duckdns.org:8100"
)

$HubId = "zephyr0109"

Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "🚀 Building Scriptly Images (Version: $Version)" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# 1. API Image
Write-Host "📦 Building API..." -ForegroundColor Gray
docker build -t "$HubId/scriptly-api:$Version" ./scriptly-api
docker tag "$HubId/scriptly-api:$Version" "$HubId/scriptly-api:latest"

# 2. Web Image
Write-Host "📦 Building Web (API_URL: $ApiUrl)..." -ForegroundColor Gray
docker build -t "$HubId/scriptly-web:$Version" `
  --build-arg NEXT_PUBLIC_API_URL=$ApiUrl `
  ./scriptly-web
docker tag "$HubId/scriptly-web:$Version" "$HubId/scriptly-web:latest"

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "⬆️ Pushing to Docker Hub..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

docker push "$HubId/scriptly-api:$Version"
docker push "$HubId/scriptly-api:latest"
docker push "$HubId/scriptly-web:$Version"
docker push "$HubId/scriptly-web:latest"

Write-Host ""
Write-Host "✅ Push complete! (Version: $Version)" -ForegroundColor Green
Write-Host "You can now pull these images on your Oracle Cloud server." -ForegroundColor Gray
