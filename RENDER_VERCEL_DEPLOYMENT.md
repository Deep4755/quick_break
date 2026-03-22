# QuickBreak — Split Deployment Guide (Render + Vercel)

## Architecture

Split deployment: Backend API on Render, Frontend on Vercel.

```
Backend (Render)                Frontend (Vercel)
├── Express API                 ├── React SPA
├── MongoDB Atlas               ├── Vite build
└── CORS enabled                └── API calls to Render
```

---

## Step 1 — Deploy Backend to Render

### 1.1 Create Render Account & Connect GitHub
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account
3. Select your QuickBreak repository

### 1.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select your repository
3. Configure settings:

| Setting | Value |
|---------|-------|
| **Name** | `quickbreak-api` (or your choice) |
| **Root Directory** | `BACKEND` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Node Version** | `20` |

### 1.3 Set Environment Variables
In Render dashboard → Environment tab, add:

```
NODE_ENV=production
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_secure_random_jwt_secret
JWT_EXPIRES_IN=7d
MAPBOX_TOKEN=pk.your_mapbox_public_token_here
MAPBOX_PROFILE=driving
TOMTOM_API_KEY=your_tomtom_api_key_here
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

**Important:** Replace `your-frontend-app.vercel.app` with your actual Vercel domain after Step 2.

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment to complete
3. Note your Render URL: `https://quickbreak-api.onrender.com`

---

## Step 2 — Deploy Frontend to Vercel

### 2.1 Update Frontend Environment
Before deploying, update `FRONTEND/.env.production`:

```env
VITE_API_URL=https://quickbreak-api.onrender.com/api
```

Replace `quickbreak-api` with your actual Render service name.

### 2.2 Create Vercel Account & Deploy
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `FRONTEND` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.3 Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://quickbreak-api.onrender.com/api
```

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Note your Vercel URL: `https://your-frontend-app.vercel.app`

---

## Step 3 — Update CORS Configuration

### 3.1 Update Backend CORS
Go back to Render dashboard → Environment tab and update:

```
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

Replace with your actual Vercel domain from Step 2.4.

### 3.2 Redeploy Backend
In Render dashboard, trigger a manual redeploy to apply the CORS changes.

---

## Step 4 — Seed Database (One Time)

After both deployments are complete:

```bash
curl -X POST https://quickbreak-api.onrender.com/api/service-stations/seed
```

---

## Step 5 — Verify Deployment

| Check | URL |
|-------|-----|
| **Backend API** | `https://quickbreak-api.onrender.com` |
| **API Health** | `https://quickbreak-api.onrender.com/api/health` |
| **Frontend App** | `https://your-frontend-app.vercel.app` |
| **Stations API** | `https://quickbreak-api.onrender.com/api/service-stations/search?q=heston` |

---

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_secure_random_jwt_secret
JWT_EXPIRES_IN=7d
MAPBOX_TOKEN=pk.your_mapbox_public_token_here
MAPBOX_PROFILE=driving
TOMTOM_API_KEY=your_tomtom_api_key_here
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://quickbreak-api.onrender.com/api
```

---

## Local Development (Unchanged)

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

**CORS errors in browser console**
- Verify `CORS_ORIGIN` is set correctly in Render
- Ensure Vercel domain matches exactly (no trailing slash)
- Redeploy backend after CORS changes

**API calls failing (404/network errors)**
- Check `VITE_API_URL` in Vercel environment variables
- Verify Render backend is running and accessible
- Check Render logs for backend errors

**Render backend sleeping (cold starts)**
- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier for production

**MongoDB connection errors**
- Verify `MONGO_URL` is correct in Render
- Ensure MongoDB Atlas allows connections from `0.0.0.0/0`
- Check Render logs for specific connection errors