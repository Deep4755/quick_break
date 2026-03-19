# QuickBreak — Deployment Guide

## Strategy: Single Full-Stack App on Hostinger

Backend (Express) serves the React frontend build.
One Node.js app, one domain, no CORS issues.

---

## Local Development

```bash
# Terminal 1 — Backend
cd BACKEND
npm install
npm run dev        # runs on http://localhost:5000

# Terminal 2 — Frontend
cd FRONTEND
npm install
npm run dev        # runs on http://localhost:5173
```

---

## Build for Production (run locally before pushing)

```bash
cd FRONTEND
npm install
npm run build      # creates FRONTEND/dist/
```

Then push everything (including FRONTEND/dist) to GitHub,
OR let Hostinger build it using the build command below.

---

## GitHub — Push Commands

```bash
# First time
git init
git add .
git commit -m "feat: QuickBreak production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quickbreak.git
git push -u origin main

# After changes
git add .
git commit -m "your message"
git push
```

---

## Hostinger Deployment

### Which folder to deploy from: BACKEND

Hostinger Node.js app root = BACKEND folder

### Node version: 18 or 20 (LTS)

### Build command (Hostinger runs this once on deploy):
```
npm install && cd ../FRONTEND && npm install && npm run build
```

### Start command:
```
NODE_ENV=production node src/server.js
```

### Entry point:
```
src/server.js
```

---

## Environment Variables (set in Hostinger control panel)

```
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/quickbreak?retryWrites=true&w=majority
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=7d
MAPBOX_TOKEN=pk.your_mapbox_token_here
MAPBOX_PROFILE=driving
TOMTOM_API_KEY=your_tomtom_key_here
```

Note: Do NOT set CORS_ORIGIN — in single-app mode it is not needed.

---

## After Deployment — Seed the Database

Visit this URL once (POST request via Postman or browser fetch):
```
https://yourdomain.com/api/service-stations/seed
```

Or use curl:
```bash
curl -X POST https://yourdomain.com/api/service-stations/seed
```

---

## Test Checklist After Deployment

- [ ] https://yourdomain.com — loads React app
- [ ] https://yourdomain.com/api/health — returns { status: "OK" }
- [ ] https://yourdomain.com/api/service-stations/search?q=heston — returns stations
- [ ] /nearby page loads and shows stations
- [ ] /login and /register work
- [ ] Create Report works after login
- [ ] Bexxa voice assistant works (Chrome/Edge only)

---

## File Structure on Hostinger

```
project-root/
├── BACKEND/          ← Hostinger deploys from here
│   ├── src/
│   ├── package.json
│   └── .env          ← set via Hostinger env panel, NOT committed to git
└── FRONTEND/
    └── dist/         ← built by build command, served by Express
```
