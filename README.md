# QuickBreak

A full-stack web application for finding motorway service stations across the UK. QuickBreak helps drivers locate nearby stations, view facilities, read and submit reviews, save favourites, and navigate — all without leaving the app.

Built with the MERN stack, TomTom Maps SDK, and a rule-based voice assistant called Bexxa.

## 🌐 Live Demo

**[View Live Application](https://quick-break-backend.onrender.com)**

> Initial load may take 30–60 seconds on the free hosting tier.

---

## ✨ Key Features

- **Nearby Station Search** — Uses browser geolocation to find motorway service stations within a configurable radius
- **TomTom Interactive Map** — Real map with station markers, popups, user location dot, and zoom/recenter controls
- **In-App Navigation** — Google Maps-style directions page with blue route line, A/B markers, multiple route options, and ETA
- **Location Search** — Search by town, city, or postcode using TomTom geocoding (UK-restricted)
- **Station Details** — View facilities, operator, motorway, address, and user reports per station
- **Station Reviews** — Submit and read community reviews and cleanliness ratings
- **Saved Stations** — Bookmark favourite stations (logged-in users)
- **Create Reports** — Submit crowd-sourced updates on parking, EV chargers, and busyness
- **Bexxa Voice Assistant** — Hands-free rule-based voice assistant using browser Speech Recognition and Speech Synthesis. Say "Hey Bexxa, find EV chargers near me" or "navigate to Heston Services"
- **Guest Access** — Browse and explore without creating an account
- **User Authentication** — Register, login, JWT-secured sessions
- **Mobile-Responsive UI** — Mobile-first layout, thumb-friendly buttons, collapsible nav

---

## 🛠 Tech Stack

**Frontend**
- React 19 with hooks and context API
- Vite (build tool)
- Tailwind CSS v4
- React Router v7
- Axios
- TomTom Maps SDK v6 (loaded via CDN)
- Browser Web Speech API (voice recognition + synthesis)

**Backend**
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- JWT authentication + bcrypt
- RESTful API

**External APIs**
- TomTom Maps SDK — interactive map rendering
- TomTom Routing API — multi-route calculation with traffic
- TomTom Search API — geocoding and location search (UK)

**Hosting**
- Render (Node.js web service — backend serves frontend build)
- MongoDB Atlas (cloud database)

---

## 📁 Project Structure

```
QuickBreak/
├── FRONTEND/
│   └── src/
│       ├── api/            # Axios API service layer
│       ├── components/     # Navbar, TomTomMap, BexxaVoiceAssistant, etc.
│       ├── context/        # AuthContext
│       ├── hooks/          # useCurrentLocation, useSavedStations, etc.
│       └── pages/          # Nearby, StationDetails, NavigationPage, etc.
│
├── BACKEND/
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── models/         # Mongoose schemas
│       ├── routes/         # API endpoints
│       ├── middleware/      # Auth, error handling
│       ├── services/        # TomTom API integration
│       └── utils/           # Seed data, helpers
│
└── DEPLOYMENT.md
```

---

## 🚀 Running Locally

**Prerequisites:** Node.js 18+, MongoDB Atlas account, TomTom API key

### 1. Clone

```bash
git clone https://github.com/Deep4755/quick_break.git
cd quick_break
```

### 2. Backend

```bash
cd BACKEND
cp .env.example .env
# Fill in your values (see below)
npm install
npm start
# Runs on http://localhost:3001
```

### 3. Frontend

```bash
cd FRONTEND
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Environment Variables

`BACKEND/.env`:
```env
PORT=3001
MONGO_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d
TOMTOM_API_KEY=your_tomtom_api_key
```

`FRONTEND/.env`:
```env
VITE_API_URL=/api
VITE_TOMTOM_API_KEY=your_tomtom_api_key
```

> The Vite dev server proxies `/api` requests to `http://localhost:3001` automatically.

---

## 🎤 Bexxa Voice Commands

Bexxa is a **rule-based voice assistant** — it uses the browser's built-in Speech Recognition and Speech Synthesis APIs. It does not use any AI or LLM.

| Say | What happens |
|-----|-------------|
| "Hey Bexxa, find EV chargers near me" | Searches nearby stations with EV facility |
| "Hey Bexxa, find fuel near me" | Searches for fuel stations |
| "Hey Bexxa, find nearest station" | Returns closest station |
| "Hey Bexxa, navigate" | Opens in-app navigation to last found station |
| "Hey Bexxa, details" | Opens station details page |
| "Hey Bexxa, create report" | Opens report form |
| "Hey Bexxa, help" | Lists available commands |

Works in Chrome and Edge (browsers with Web Speech API support).

---

## 🌍 Deployment

The backend serves the React frontend as static files from `BACKEND/public/`.

Build and deploy:
```bash
cd FRONTEND && npm run build
# Copy dist/ contents to BACKEND/public/
cd BACKEND && npm start
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Render deployment instructions.

---

## 👤 Author

**Sandeep** — [github.com/Deep4755](https://github.com/Deep4755)
