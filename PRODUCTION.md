# HealthWise — Production Setup

Server: Hetzner Cloud Singapore (`5.223.76.20`)
SSH alias: `ssh syswise-hetzner`

---

## One-time server setup

Run these commands once on the Hetzner server via SSH.

### 1. Create the database

```bash
sudo -u postgres psql
CREATE DATABASE healthwise_db;
GRANT ALL PRIVILEGES ON DATABASE healthwise_db TO syswise_user;
\q
```

### 2. Create server directories

```bash
mkdir -p /var/www/healthwise/dist
mkdir -p /var/www/healthwise-server/dist
mkdir -p /var/www/healthwise-server/prisma
```

### 3. Upload and configure the production .env

From your local machine:
```powershell
scp "healthwise-local\server\.env.production" syswise-hetzner:/var/www/healthwise-server/.env
```

On the server, verify the file looks correct:
```bash
cat /var/www/healthwise-server/.env
```

Make sure these values are set correctly:
```
DATABASE_URL="postgresql://syswise_user:SysW1se2026!Secure@localhost:5432/healthwise_db?schema=public"
JWT_SECRET="<generate a long random secret>"
PORT=4500
NODE_ENV=production
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Install Node.js dependencies on server

```bash
cd /var/www/healthwise-server
npm install --omit=dev
```

### 5. Run database migration and seed

```bash
cd /var/www/healthwise-server
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Seed the exercise library (one time only)
# Copy seed script first:
# scp "healthwise-local\server\prisma\seed.ts" syswise-hetzner:/var/www/healthwise-server/prisma/
# Then on server:
npm install -g ts-node   # if not installed
ts-node prisma/seed.ts
```

Or run the seed from local after deploy:
```powershell
# From local, tunnel to server and run seed against production DB
# Only needed once — exercise library seeding
```

### 6. Start with PM2

```bash
cd /var/www/healthwise-server

pm2 start dist/index.js --name healthwise-backend
pm2 save
pm2 startup   # if not already set up
```

Verify it's running:
```bash
pm2 status
pm2 logs healthwise-backend --lines 20
```

### 7. Update nginx config on server

The nginx block to add to `/etc/nginx/sites-available/syswise.lk`:

```nginx
# HealthWise App - Static frontend
location /healthwise/ {
    alias /var/www/healthwise/dist/;
    index index.html;
    try_files $uri $uri/ /healthwise/index.html;
}

# HealthWise API - Port 4500
location /healthwise-api/ {
    rewrite ^/healthwise-api/(.*) /$1 break;
    proxy_pass http://localhost:4500;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

After editing:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Subsequent deploys

From your local machine (Windows), run:

```powershell
cd "c:\Users\dasun\Dasun Systems\Syswise\healthwise-local"
.\deploy.ps1
```

This will:
1. Build the frontend (`vite build`)
2. Build the backend (`tsc`)
3. Upload `dist/` to `/var/www/healthwise/dist/`
4. Upload compiled backend to `/var/www/healthwise-server/`
5. Run `prisma migrate deploy` on the server
6. Restart `healthwise-backend` via PM2

---

## PM2 process list (full ecosystem)

After adding HealthWise, the server should have these PM2 processes:

| Name | Command | Port |
|------|---------|------|
| `syswise-next` | `next start -p 3000` | 3000 |
| `syswise-django` | `gunicorn / uvicorn` | 8000 |
| `daywise-backend` | `node dist/index.js` | 4000 |
| `autowise-backend` | Django | 4001 |
| `autowise-flask` | Flask | 8010 |
| `cricwise-backend` | `node dist/index.js` | 4002 |
| `paywise-backend` | `node dist/index.js` | 4300 |
| `taskwise-backend` | `node dist/index.js` | 4300 |
| `healthwise-backend` | `node dist/index.js` | 4500 |

Save PM2 config after adding:
```bash
pm2 save
```

---

## Verify production is working

```bash
# Health check
curl https://syswise.lk/healthwise-api/api/health

# Expected response:
# {"status":"ok","app":"healthwise","timestamp":"..."}
```

Then open `https://syswise.lk/apps` in a browser, click HealthWise, and confirm SSO login works.

---

## Rollback

```bash
# On server — restart with previous build if something goes wrong
pm2 stop healthwise-backend

# Restore previous dist (keep a backup before each deploy)
# pm2 start dist/index.js --name healthwise-backend
```

---

## Environment variables reference

| Variable | Local value | Production value |
|----------|------------|-----------------|
| `DATABASE_URL` | `postgresql://postgres:wealthpeshala@localhost:5432/healthwise_local` | `postgresql://syswise_user:SysW1se2026!Secure@localhost:5432/healthwise_db` |
| `JWT_SECRET` | `healthwise_jwt_secret_change_in_production_2026` | Long random string |
| `PORT` | `4500` | `4500` |
| `NODE_ENV` | _(unset)_ | `production` |
