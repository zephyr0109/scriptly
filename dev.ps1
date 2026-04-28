# Scriptly 통합 개발 환경 실행 스크립트 (Windows PowerShell)

$CoreDir = "scriptly-api"
if (-not (Test-Path $CoreDir)) {
    $CoreDir = "scriptly-core"
}
$WebDir = "scriptly-web"

Write-Host "🚀 Scriptly 개발 환경을 시작합니다..." -ForegroundColor Cyan































# 1. 백엔드 (FastAPI) 실행
Write-Host "📦 [Backend] 가상환경 확인 및 서버 가동 (Port: 8000)..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd $CoreDir; .\.venv\Scripts\activate; python main.py" -WindowStyle Normal

# 2. 프론트엔드 (Next.js) 실행
Write-Host "📦 [Frontend] Next.js 서버 가동 (Port: 3000)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd $WebDir; npm run dev" -WindowStyle Normal

Write-Host "✅ 모든 서비스가 실행되었습니다." -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:8000"
Write-Host "- Frontend: http://localhost:3000"
Write-Host "각 서비스의 로그는 새로 열린 터미널 창에서 확인하세요."
