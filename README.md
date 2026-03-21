# QuickBreak

A MERN stack web app for finding motorway service stations in the UK.

## Project Structure

```
Quick_Break/
├── BACKEND/          ← Express + MongoDB API
│   ├── src/
│   ├── package.json
│   └── .env.example  ← copy to .env and fill in your values
├── FRONTEND/         ← React + Vite + Tailwind
│   ├── src/
│   ├── package.json
│   └── .env.example  ← copy to .env for local dev
├── .gitignore
├── README.md
└── DEPLOYMENT.md
```

## Local Development

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/quick_break.git
cd quick_break
```

**2. Backend setup**
```bash
cd BACKEND
cp .env.example .env
# Fill in your real values in .env
npm install
npm run dev
# Runs on http://localhost:5000
```

**3. Frontend setup**
```bash
cd FRONTEND
cp .env.example .env
# .env already has VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
# Runs on http://localhost:5173
```

## Environment Variables

### Backend (`BACKEND/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` |
| `MAPBOX_TOKEN` | Mapbox public access token |
| `MAPBOX_PROFILE` | `driving` (default) |
| `TOMTOM_API_KEY` | TomTom key (optional, for seeding) |
| `SMTP_HOST` | Email host (optional) |
| `SMTP_PORT` | Email port (optional) |
| `SMTP_USER` | Email user (optional) |
| `SMTP_PASS` | Email password (optional) |

### Frontend (`FRONTEND/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

In production this is automatically set to `/api` via `FRONTEND/.env.production`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Hostinger deployment steps.
