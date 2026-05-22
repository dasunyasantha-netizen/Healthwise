# HealthWise Deployment Guide

This guide explains how to deploy updates from your local development environment to the production server.

## Prerequisites

- SSH access configured: `ssh syswise-hetzner`
- Git repository: `github.com/dasunyasantha-netizen/Healthwise`
- Server path: `/var/www/healthwise`

---

## Quick Deployment (TL;DR)

### Frontend Only Changes
```bash
# 1. Commit and push locally
cd "c:\Users\dasun\Dasun Systems\Syswise\healthwise-local"
git add .
git commit -m "your commit message"
git push origin main

# 2. Deploy to server
ssh syswise-hetzner "cd /var/www/healthwise && git pull origin main && npm install && npm run build"
```

### Backend Changes (includes server/ folder)
```bash
# 1. Commit and push locally
cd "c:\Users\dasun\Dasun Systems\Syswise\healthwise-local"
git add .
git commit -m "your commit message"
git push origin main

# 2. Deploy to server
ssh syswise-hetzner "cd /var/www/healthwise && git pull origin main && npm install && npm run build && cd server && npm install && npm run build && pm2 restart healthwise-backend"
```

### Full Deployment (Frontend + Backend + Prisma)
```bash
ssh syswise-hetzner "cd /var/www/healthwise && git pull origin main && npm install && npm run build && cd server && npm install && npx prisma generate && npm run build && pm2 restart healthwise-backend"
```

---

## Step-by-Step Deployment

### Step 1: Commit Your Changes Locally

```bash
cd "c:\Users\dasun\Dasun Systems\Syswise\healthwise-local"
git status
git add <files>
git commit -m "feat: description of change"
```

### Step 2: Push to GitHub

```bash
git push origin main
```

### Step 3: Deploy on Server

```bash
ssh syswise-hetzner "cd /var/www/healthwise && git pull origin main && npm install && npm run build && cd server && npm install && npm run build && pm2 restart healthwise-backend"
```

---

## Server Details

| Item | Value |
|------|-------|
| Server IP | 5.223.76.20 |
| SSH Config | `syswise-hetzner` |
| App Directory | `/var/www/healthwise` |
| Frontend URL | https://syswise.lk/healthwise/ |
| API URL | https://syswise.lk/healthwise-api/ |
| Backend Port | 4500 (internal) |
| PM2 App Name | `healthwise-backend` |
| Database | PostgreSQL (`healthwise_db`) |

---

## File Structure

```
/var/www/healthwise/
├── dist/                  # Built frontend (served by Nginx)
├── src/                   # Frontend source
├── server/
│   ├── dist/             # Built backend
│   ├── src/              # Backend source
│   ├── prisma/           # Prisma schema + seed
│   └── .env              # Backend environment variables (not in git)
├── package.json
└── vite.config.ts        # base: '/healthwise/'
```

---

## Common Commands

### View Status
```bash
pm2 list
pm2 show healthwise-backend
pm2 logs healthwise-backend --lines 20
pm2 logs healthwise-backend --err
```

### Restart Backend
```bash
pm2 restart healthwise-backend
```

### Run Prisma Migration (schema changes)
```bash
cd /var/www/healthwise/server
npx prisma db push
npx prisma generate
```

### Check Nginx
```bash
nginx -t
systemctl reload nginx
```

---

## Environment Variables

Backend `.env` file location: `/var/www/healthwise/server/.env` (not in git — set once on server)

```env
DATABASE_URL="postgresql://syswise_user:SysW1se2026!Secure@localhost:5432/healthwise_db?schema=public"
JWT_SECRET="<long random string>"
PORT=4500
NODE_ENV=production
```

---

## Rollback

```bash
cd /var/www/healthwise
git log --oneline -10
git checkout <commit-hash>
npm run build
cd server && npm run build && pm2 restart healthwise-backend
```

---

## Troubleshooting

### Frontend not updating?
- Hard refresh: Ctrl+Shift+R
- Check build: `ls -la /var/www/healthwise/dist/`

### Backend errors?
- Check logs: `pm2 logs healthwise-backend --err`
- Verify env: `cat /var/www/healthwise/server/.env`
- Test API: `curl http://localhost:4500/api/health`

### 502 Bad Gateway?
- Restart: `pm2 restart healthwise-backend`
- Check port: `ss -tlnp | grep 4500`

### SSO not working?
- Test endpoint: `curl https://syswise.lk/healthwise-api/api/auth/sso-login -X POST -H "Content-Type: application/json" -d '{"token":"test","phone":"0771234567","email":"test@test.com","name":"Test"}'`
- Clear localStorage in browser and retry

---

## Git Branch Info

| Location | Branch |
|----------|--------|
| Local (Windows) | `main` |
| Server | `main` |
| Remote (GitHub) | `main` |
