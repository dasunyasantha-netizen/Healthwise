# HealthWise Production Deploy Script
# Builds frontend + backend, transfers to Hetzner, restarts PM2
# Usage: .\deploy.ps1

param(
    [string]$Server = "syswise-hetzner",
    [string]$RemoteBase = "/var/www/healthwise",
    [string]$RemoteServerBase = "/var/www/healthwise/server"
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HealthWise Deploy to Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. BUILD FRONTEND ──────────────────────────────────────────────────────────
Write-Host "[1/5] Building frontend..." -ForegroundColor Yellow
Set-Location $Root
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed." -ForegroundColor Red; exit 1 }
Write-Host "  Frontend built successfully." -ForegroundColor Green

# ── 2. BUILD BACKEND ───────────────────────────────────────────────────────────
Write-Host "[2/5] Building backend..." -ForegroundColor Yellow
Set-Location "$Root\server"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Backend build failed." -ForegroundColor Red; exit 1 }
Write-Host "  Backend built successfully." -ForegroundColor Green

# ── 3. UPLOAD FRONTEND DIST ────────────────────────────────────────────────────
Write-Host "[3/5] Uploading frontend dist..." -ForegroundColor Yellow
ssh $Server "mkdir -p $RemoteBase/dist"
scp -r "$Root\dist\*" "${Server}:${RemoteBase}/dist/"
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend upload failed." -ForegroundColor Red; exit 1 }
Write-Host "  Frontend uploaded to $RemoteBase/dist/" -ForegroundColor Green

# ── 4. UPLOAD BACKEND ─────────────────────────────────────────────────────────
Write-Host "[4/5] Uploading backend..." -ForegroundColor Yellow
ssh $Server "mkdir -p $RemoteServerBase"

# Upload compiled dist
scp -r "$Root\server\dist\*" "${Server}:${RemoteServerBase}/dist/"

# Upload package.json + prisma schema (not node_modules or .env)
scp "$Root\server\package.json" "${Server}:${RemoteServerBase}/"
scp "$Root\server\prisma\schema.prisma" "${Server}:${RemoteServerBase}/prisma/"

if ($LASTEXITCODE -ne 0) { Write-Host "Backend upload failed." -ForegroundColor Red; exit 1 }
Write-Host "  Backend uploaded to $RemoteServerBase" -ForegroundColor Green

# ── 5. RESTART ON SERVER ──────────────────────────────────────────────────────
Write-Host "[5/5] Restarting PM2 process on server..." -ForegroundColor Yellow
ssh $Server @"
set -e
cd $RemoteServerBase

# Install production dependencies if needed
npm install --omit=dev

# Run prisma migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Restart or start PM2 process
if pm2 describe healthwise-backend > /dev/null 2>&1; then
    pm2 restart healthwise-backend
else
    pm2 start dist/index.js --name healthwise-backend
    pm2 save
fi

echo 'HealthWise backend restarted.'
"@
if ($LASTEXITCODE -ne 0) { Write-Host "Server restart failed." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy complete!" -ForegroundColor Green
Write-Host "  Frontend: https://syswise.lk/healthwise/" -ForegroundColor White
Write-Host "  API:      https://syswise.lk/healthwise-api/" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
