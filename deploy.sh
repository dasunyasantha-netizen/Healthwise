#!/usr/bin/env bash
# HealthWise Deploy Script — run from healthwise-local/: bash deploy.sh
# Replaces deploy.ps1 — use this for git-based deploys
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()   { echo -e "${GREEN}[ok]${NC} $1"; }
fail() { echo -e "${RED}[fail]${NC} $1"; exit 1; }

log "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
  fail "Uncommitted changes. Commit and push to GitHub before deploying."
fi
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "unknown")
if [ "$LOCAL" != "$REMOTE" ]; then
  fail "Not in sync with origin/main. Run: git push origin main"
fi
ok "Git is clean and pushed."

CACHE_VERSION=$(git rev-parse --short HEAD)
log "Cache version: $CACHE_VERSION"

sed -i.bak "s/__CACHE_VERSION__/$CACHE_VERSION/" public/sw.js
log "Building frontend..."
npm run build || { mv public/sw.js.bak public/sw.js; fail "Build failed."; }
mv public/sw.js.bak public/sw.js
ok "Frontend built."

log "Deploying to production..."
ssh syswise-hetzner bash -s << 'REMOTE'
set -euo pipefail
cd /var/www/healthwise
echo "[remote] Pulling from GitHub..."
git fetch origin main && git reset --hard origin/main
echo "[remote] Installing dependencies..."
npm install --silent
cd server && npm install --silent && npm run build
cd ..
CACHE_VERSION=$(git rev-parse --short HEAD)
CURRENT_SHA=$(git rev-parse HEAD)
sed -i "s/__CACHE_VERSION__/$CACHE_VERSION/g" public/sw.js
echo "{\"sha\":\"$CURRENT_SHA\"}" > public/version.json
echo "[remote] Building frontend with VITE_BUILD_SHA=$CURRENT_SHA..."
VITE_BUILD_SHA=$CURRENT_SHA npm run build
git checkout public/sw.js
echo "[remote] Restarting backend..."
pm2 restart healthwise-backend
echo "[remote] Done. Deployed: $CACHE_VERSION"
REMOTE

ok "HealthWise deployed."
echo -e "${GREEN}  URL : https://syswise.lk/healthwise/${NC}"
echo -e "${GREEN}  SW cache version bumped — PWA clients will auto-update${NC}"
