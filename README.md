# QuickBreak

A modern web application for finding motorway service stations across the UK. Built with the MERN stack, QuickBreak helps drivers locate nearby stations, view facilities and amenities, read reviews, and save favorite locations. The app features an integrated voice assistant (Bexxa), interactive maps powered by Mapbox, and comprehensive station data including fuel prices, food options, and accessibility information.

## 🌐 Live Demo

**[View Live Application](https://quick-break-backend.onrender.com)**

*Note: Initial load may take 30-60 seconds due to free hosting tier.*

## ✨ Key Features

- **Station Search & Discovery** - Find service stations by location, name, or route
- **Interactive Maps** - Mapbox integration with real-time location data
- **Voice Assistant (Bexxa)** - AI-powered conversational interface
- **User Reviews & Ratings** - Community feedback and station ratings
- **Saved Stations** - Personal favorites and trip planning
- **Comprehensive Facility Data** - Fuel, food, amenities, and accessibility details
- **User Authentication** - Secure login and personalized experience
- **Guest Access** - Limited functionality without registration
- **Mobile Responsive** - Optimized for desktop and mobile devices

## 🛠 Tech Stack

**Frontend**
- React 19 with modern hooks and context
- Vite for fast development and building
- Tailwind CSS for responsive styling
- React Router for navigation
- Axios for API communication

**Backend**
- Node.js with Express.js framework
- MongoDB Atlas for cloud database
- Mongoose for data modeling
- JWT authentication with bcrypt
- RESTful API architecture

**External Services**
- Mapbox for maps and geocoding
- TomTom API for additional location data
- Render for deployment hosting

## 📁 Project Structure

```
QuickBreak/
├── FRONTEND/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Application pages/routes
│   │   ├── api/             # API service layer
│   │   ├── context/         # React context providers
│   │   └── hooks/           # Custom React hooks
│   └── package.json
│
├── BACKEND/                  # Express API server
│   ├── src/
│   │   ├── controllers/     # Route handlers and business logic
│   │   ├── models/          # MongoDB schemas and models
│   │   ├── routes/          # API endpoint definitions
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── services/        # External API integrations
│   │   └── utils/           # Helper functions and utilities
│   └── package.json
│
└── DEPLOYMENT.md            # Deployment documentation
```

## 🚀 How to Run Locally

**Prerequisites:** Node.js 18+, MongoDB Atlas account, Mapbox API key

**1. Clone and Setup**
```bash
git clone <repository-url>
cd QuickBreak
```

**2. Backend Setup**
```bash
cd BACKEND
cp .env.example .env
# Configure environment variables in .env
npm install
npm run dev
# Server runs on http://localhost:5000
```

**3. Frontend Setup**
```bash
cd FRONTEND
cp .env.example .env
# VITE_API_URL is pre-configured for local development
npm install
npm run dev
# Application runs on http://localhost:5173
```

**4. Environment Configuration**
Create `BACKEND/.env` with your credentials:
```env
MONGO_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_secret
MAPBOX_TOKEN=your_mapbox_public_token
TOMTOM_API_KEY=your_tomtom_api_key
```

## 🌍 Deployment Summary

The application uses a full-stack deployment approach:
- **Hosting**: Render (Node.js web service)
- **Database**: MongoDB Atlas (cloud database)
- **Architecture**: Express backend serves React frontend as static files
- **Domain**: Custom domain with SSL certificate
- **Environment**: Production-optimized with environment variables

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
