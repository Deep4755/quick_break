import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BexxaVoiceAssistant from "../components/BexxaVoiceAssistant";
import stationApi from "../api/stationApi";

const IconTrend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#1a7a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 7 22 7 22 13" stroke="#1a7a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4" stroke="#22a05e" strokeWidth="2"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#22a05e" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" stroke="#22a05e" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);
const IconPin = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#1a7a4a" strokeWidth="2" fill="rgba(26,122,74,0.1)"/>
    <circle cx="12" cy="9" r="2.5" stroke="#1a7a4a" strokeWidth="2"/>
  </svg>
);
const IconReport = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#22a05e" strokeWidth="2" fill="rgba(34,160,94,0.1)" strokeLinejoin="round"/>
    <polyline points="14 2 14 8 20 8" stroke="#22a05e" strokeWidth="2" strokeLinejoin="round"/>
    <line x1="16" y1="13" x2="8" y2="13" stroke="#22a05e" strokeWidth="2" strokeLinecap="round"/>
    <line x1="16" y1="17" x2="8" y2="17" stroke="#22a05e" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke="#1a7a4a" strokeWidth="2" fill="rgba(26,122,74,0.08)"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#1a7a4a" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconBookmark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#f59e0b" strokeWidth="2" fill="rgba(245,158,11,0.1)" strokeLinejoin="round"/>
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="#1a7a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="#f59e0b" strokeWidth="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function GuestModal({ onClose, onSignIn }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "linear-gradient(135deg, #e8f5ee 0%, #f0f4f0 100%)", borderBottom: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(26,122,74,0.12)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1a7a4a"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>Welcome to QuickBreak</p>
              <p className="text-xs" style={{ color: "#4b5563" }}>Explore as a guest</p>
            </div>
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: "#9ca3af" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
          >
            <IconClose />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm mb-5" style={{ color: "#4b5563" }}>
            You're browsing as a guest. Here's what you can access without creating an account:
          </p>

          <div className="flex items-center gap-2 mb-3">
            <IconCheck />
            <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Available as Guest</span>
          </div>
          <div className="space-y-2 mb-5">
            {[
              { icon: "📍", title: "Browse nearby stations", desc: "Find service stations near your location" },
              { icon: "📊", title: "View station details",   desc: "See amenities, ratings, and reviews" },
              { icon: "💬", title: "Use Bexxa assistant", desc: "Voice-enabled assistant for hands-free navigation" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: "#f5f7f5", border: "1px solid #e5e7eb" }}
              >
                <span className="text-base mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <IconLock />
            <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Requires Account</span>
          </div>
          <div className="space-y-2 mb-6">
            {[
              { icon: "🔖", title: "Save favourite stations", desc: "Bookmark stations for quick access" },
              { icon: "📝", title: "Post reviews and reports", desc: "Share your experiences with the community" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: "#fafafa", border: "1px solid #e5e7eb" }}
              >
                <span className="text-base mt-0.5 flex-shrink-0 opacity-40">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#9ca3af" }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
            >
              Start as Guest
            </button>
            <button
              onClick={onSignIn}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#1a1a1a" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e8f0e8"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f5f7f5"}
            >
              Create Account
            </button>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: "#9ca3af" }}>
            You can create an account anytime to unlock all features
          </p>
        </div>
      </div>
    </div>
  );
}

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function kmToMi(km) { return (km * 0.621371).toFixed(1); }

export default function Home() {
  const navigate = useNavigate();
  const { isGuest, isLoggedIn } = useAuth();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [userCoords, setUserCoords]         = useState(null);

  useEffect(() => {
    if (isGuest && !sessionStorage.getItem("qb_guest_modal_seen")) {
      setShowGuestModal(true);
      sessionStorage.setItem("qb_guest_modal_seen", "true");
    }
  }, [isGuest]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;
        setUserCoords({ lat, lng });
        try {
          const res = await stationApi.nearby(lng, lat, 20);
          const list = Array.isArray(res) ? res : res?.stations || [];
          setNearbyStations(list.slice(0, 3));
        } catch { /* silent */ }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  const handleCreateReport = () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    navigate("/reports/create");
  };

  const STATS = [
    { icon: <IconTrend />, value: "2,847", label: "Service Stations" },
    { icon: <IconUsers />, value: "45.2K", label: "Active Users" },
    { icon: <IconStar />,  value: "127K",  label: "Reviews Posted" },
  ];

  const QUICK_ACTIONS = [
    { icon: <IconPin />,      label: "Nearby Stations", desc: "Find stations near your location",  onClick: () => navigate("/nearby") },
    { icon: <IconReport />,   label: "Create Report",   desc: "Share your experience",             onClick: handleCreateReport },
    { icon: <IconSearch />,   label: "Browse Stations", desc: "Explore all service stations",      onClick: () => navigate("/nearby") },
    { icon: <IconBookmark />, label: "Saved Stations",  desc: "View your bookmarked stops",        onClick: () => isLoggedIn ? navigate("/nearby") : navigate("/login") },
  ];

  return (
    <div style={{ background: "#f0f4f0" }}>
      {showGuestModal && (
        <GuestModal
          onClose={() => setShowGuestModal(false)}
          onSignIn={() => { setShowGuestModal(false); navigate("/register"); }}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Hero + Bexxa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-[2.75rem] font-extrabold leading-tight" style={{ color: "#1a1a1a" }}>
              Find the perfect motorway service station for your journey
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "#4b5563" }}>
              Discover, review, and navigate to service stations along UK motorways.
              Get real-time insights, amenities information, and user reviews to make informed stops.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button
                onClick={() => navigate("/nearby")}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
              >
                Nearby Stations
              </button>
              <button
                onClick={handleCreateReport}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#1a1a1a" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f7f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
              >
                Create Report
              </button>
            </div>
          </div>

          {/* Bexxa panel */}
          <div className="rounded-2xl p-6 flex flex-col" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#1a7a4a"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Bexxa Assistant</span>
            </div>

            <BexxaVoiceAssistant mode="home" />

            <div className="mt-4 space-y-2">
              {[
                '"Find the nearest Shell station"',
                '"Show stations with EV charging"',
                '"What\'s at junction 15A?"',
              ].map((s) => (
                <div
                  key={s}
                  className="text-xs px-3 py-2 rounded-lg cursor-default"
                  style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#4b5563" }}
                >
                  {s}
                </div>
              ))}
              <p className="text-xs text-center pt-1" style={{ color: "#9ca3af" }}>
                Ask Bexxa about stations, amenities or directions
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-5 py-4 flex items-center justify-between"
              style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
            >
              <div className="flex-shrink-0">{s.icon}</div>
              <div className="text-right">
                <p className="text-2xl font-extrabold" style={{ color: "#1a1a1a" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1a1a1a" }}>Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="text-left rounded-xl px-5 py-5 transition-all duration-150"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#c8d5c8";
                  e.currentTarget.style.background  = "#f5f7f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background  = "#ffffff";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "#f0f4f0" }}
                >
                  {a.icon}
                </div>
                <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{a.label}</p>
                <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{a.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Nearby Stations preview */}
        {nearbyStations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>Nearby Stations</h2>
              <button
                onClick={() => navigate("/nearby")}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: "#1a7a4a" }}
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {nearbyStations.map((s) => {
                const [lng, lat] = s.location?.coordinates || [];
                const distMi = userCoords && lat && lng
                  ? kmToMi(calcDistanceKm(userCoords.lat, userCoords.lng, lat, lng))
                  : null;

                return (
                  <div
                    key={s._id}
                    className="rounded-xl px-5 py-4 flex flex-col"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{s.name}</p>
                        {s.operator && (
                          <p className="text-xs mt-0.5 font-medium" style={{ color: "#1a7a4a" }}>{s.operator}</p>
                        )}
                      </div>
                      {distMi && (
                        <span className="text-xs flex-shrink-0 font-medium" style={{ color: "#9ca3af" }}>
                          {distMi} mi
                        </span>
                      )}
                    </div>

                    {s.address && (
                      <p className="text-xs mt-1 line-clamp-1" style={{ color: "#4b5563" }}>{s.address}</p>
                    )}

                    <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px solid #e5e7eb" }}>
                      <button
                        onClick={() => navigate(`/stations/${s._id}`)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate("/navigate", { state: { station: s, userLocation: null } })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#4b5563" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#4b5563"}
                      >
                        Navigate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
