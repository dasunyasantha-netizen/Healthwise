# HealthWise — Deployment Guide

## ⚠️ Mandatory Rules

1. **Never deploy by SCP or direct file copy.** All deploys must go through GitHub. The old `deploy.ps1` is superseded by `deploy.sh`.
2. **Always commit and push to `main` before deploying.** The script enforces this.
3. **Never restart PM2 manually** without rebuilding first.

## How to Deploy

```bash
bash deploy.sh
```

| Step | What it does |
|------|-------------|
| 1 | Checks git is clean and pushed to `origin/main` |
| 2 | Stamps `public/sw.js` with the current git SHA |
| 3 | Builds frontend locally to catch errors first |
| 4 | SSHs to server: `git reset --hard origin/main` |
| 5 | `npm install` (frontend + backend) |
| 6 | Builds backend (`tsc`) |
| 7 | Builds frontend on server with stamped SW |
| 8 | `pm2 restart healthwise-backend` |

## Cache Strategy

HealthWise uses VitePWA with `injectManifest` strategy and a custom SW template:

```js
const CACHE_VERSION = '__CACHE_VERSION__'  // e.g. a1b2c3d — injected at deploy time
```

- `public/sw.js` is the SW template; Vite injects the Workbox precache manifest + font routes
- Served with `no-cache` by nginx → browser always re-fetches it
- When SHA changes, the activate handler deletes all stale `workbox-*` caches
- `skipWaiting()` + `clientsClaim()` ensure immediate takeover

## Prerequisites

- SSH alias `syswise-hetzner` in `~/.ssh/config`
- Push access to `github.com/dasunyasantha-netizen/Healthwise`

## Rollback

```bash
ssh syswise-hetzner "cd /var/www/healthwise && git log --oneline -5"
ssh syswise-hetzner "cd /var/www/healthwise && git reset --hard <sha> && npm run build && pm2 restart healthwise-backend"
```
