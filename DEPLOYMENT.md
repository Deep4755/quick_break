# QuickBreak — Deployment Guide

## Architecture

Single full-stack deployment: Express backend serves the React frontend build.
One Node.js app, one domain, no CORS issues in production.

```
Hostinger Node.js App
└── BACKEND/               ← app root on Hostinger
    ├── src/server.js      ← entry point
    └── ../FRONTEND/dist/  ← built React app served as static files
```

---

## Step 1 — Push to GitHub

Run these commands from your project root:

```bash
git add .
git commit -m "feat: production ready"
git push origin main
```

If this is your first push to a new repo:
```bash
git init
git add .
git commit -m "feat: initial production ready commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quick_break.git
git push -u origin main
```

---

## Step 2 — Hostinger Setup

### In Hostinger hPanel:

1. Go to **Hosting → Manage → Node.js**
2. Create a new Node.js application with these settings:

| Setting | Value |
|---|---|
| Node.js version | 18 or 20 (LTS) |
| Application root | `BACKEND` |
| Application URL | your domain |
| Application startup file | `src/server.js` |

3. Set the **build command** (Hostinger runs this once on deploy):
```
npm install && npm install --prefix ../FRONTEND && npm run build --prefix ../FRONTEND
```

4. Set the **start command**:
```
node src/server.js
```

---

## Step 3 — Set Environment Variables on Hostinger

In Hostinger hPanel → Node.js → Environment Variables, add:

```
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/quickbreak?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
MAPBOX_TOKEN=pk.your_mapbox_token_here
MAPBOX_PROFILE=driving
```

Optional (only if using contact form email sending):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SUPPORT_EMAIL=support@quickbreak.uk
```

**Do NOT set CORS_ORIGIN** — in single-app mode it is not needed.

---

## Step 4 — Connect GitHub to Hostinger (Auto-Deploy)

1. In Hostinger hPanel → Git
2. Connect your GitHub repository
3. Set branch to `main`
4. Enable auto-deploy on push

Now every `git push` will trigger a redeploy automatically.

---

## Step 5 — Seed the Database

After first deployment, seed the service stations once:

```bash
curl -X POST https://yourdomain.com/api/service-stations/seed
```

Or open Postman and POST to `https://yourdomain.com/api/service-stations/seed`

---

## Verify Deployment

| Check | URL |
|---|---|
| App loads | `https://yourdomain.com` |
| API health | `https://yourdomain.com/api/health` |
| Stations API | `https://yourdomain.com/api/service-stations/search?q=heston` |
| React routing | `https://yourdomain.com/nearby` (refresh should work) |

---

## Local Development (recap)

```bash
# Terminal 1 — Backend
cd BACKEND
npm install
npm run dev        # http://localhost:5000

# Terminal 2 — Frontend
cd FRONTEND
npm install
npm run dev        # http://localhost:5173
```

---

## Common Issues

**White screen after deploy**
- Check that `FRONTEND/dist/` was built (build command ran successfully)
- Check Hostinger build logs for errors

**API calls failing (404 or network error)**
- Confirm `NODE_ENV=production` is set in Hostinger env vars
- Confirm `VITE_API_URL=/api` is in `FRONTEND/.env.production` (already set)

**MongoDB connection error**
- Double-check `MONGO_URI` in Hostinger env vars
- Make sure your MongoDB Atlas cluster allows connections from all IPs (0.0.0.0/0)

**React routes return 404 on refresh**
- This is handled by the SPA fallback in `BACKEND/src/app.js` — ensure `NODE_ENV=production`

**Port issues**
- Hostinger assigns its own port via `process.env.PORT` — the app already uses this
