import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import stationApi from "../api/stationApi";
import { useAuth } from "../context/AuthContext";

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
const kmToMi = (km) => (km * 0.621371).toFixed(1);

function openMaps(station, userCoords) {
  const coords = station.location?.coordinates;
  if (!coords) return;
  const [lng, lat] = coords;
  if (userCoords) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${lat},${lng}&travelmode=driving`,
      "_blank", "noopener"
    );
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener");
  }
}

function Loading() {
  return (
    <div className="flex justify-center items-center py-20">
      <div
        className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "#e5e7eb", borderTopColor: "#1a7a4a" }}
      />
    </div>
  );
}

function StationCard({ station, onViewDetails, userCoords }) {
  const hasEV  = (station.facilities || []).includes("ev");
  const isOpen = station.openNow;
  const [lng, lat] = station.location?.coordinates || [];

  // Use pre-computed distance from backend if available, else calculate
  const distKm = station.distanceKm != null
    ? station.distanceKm
    : (userCoords && lat && lng ? calcDistanceKm(userCoords.lat, userCoords.lng, lat, lng) : null);
  const distMi = distKm != null ? (distKm * 0.621371).toFixed(1) : null;
  const distLabel = distKm != null
    ? (distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)} km`)
    : null;

  return (
    <div
      className="rounded-xl p-5 flex flex-col transition-all duration-150"
      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c8d5c8"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug" style={{ color: "#1a1a1a" }}>{station.name}</h3>
          {station.operator && (
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#1a7a4a" }}>{station.operator}</p>
          )}
        </div>
        {distLabel && (
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: "#9ca3af" }}>
            {distLabel}
          </span>
        )}
      </div>

      {station.address && (
        <div className="flex items-start gap-1.5 mt-2">
          <svg className="flex-shrink-0 mt-0.5" width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#9ca3af"/>
          </svg>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "#4b5563" }}>{station.address}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {isOpen === true && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>
            Open 24/7
          </span>
        )}
        {hasEV && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(26,122,74,0.08)", color: "#1a7a4a", border: "1px solid rgba(26,122,74,0.2)" }}>
            EV Charging
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-4" style={{ borderTop: "1px solid #e5e7eb", marginTop: "auto" }}>
        <button
          onClick={() => onViewDetails(station._id)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
        >
          View Details
        </button>
        <button
          onClick={() => openMaps(station, userCoords)}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#4b5563" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#4b5563"}
        >
          Navigate
        </button>
      </div>
    </div>
  );
}

export default function Nearby() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [coords, setCoords]         = useState({ lng: -0.1278, lat: 51.5074 });
  const [userCoords, setUserCoords] = useState(null);
  const [radiusKm, setRadiusKm]     = useState(10);
  const [stations, setStations]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [viewMode, setViewMode]     = useState("grid");

  const loadNearby = async (lng, lat, radius) => {
    setLoading(true);
    setError("");
    try {
      const list = await stationApi.nearby(lng, lat, radius);
      setStations(Array.isArray(list) ? list : []);
    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message || err?.message || "";
      if (status === 403 || status === 401) {
        setError("Authentication error. Please refresh the page.");
      } else if (status === 500 && msg.toLowerCase().includes("index")) {
        setError("Location index not ready yet. Please re-seed stations and try again.");
      } else if (msg) {
        setError("Could not load nearby stations: " + msg);
      } else {
        setError("Could not load nearby stations. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) { loadNearby(coords.lng, coords.lat, radiusKm); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        setCoords(c);
        setUserCoords(c);
        loadNearby(c.lng, c.lat, radiusKm);
      },
      () => loadNearby(coords.lng, coords.lat, radiusKm),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  const handleRadiusChange = (e) => {
    const v = Number(e.target.value);
    setRadiusKm(v);
    loadNearby(coords.lng, coords.lat, v);
  };

  const handleRefresh = () => loadNearby(coords.lng, coords.lat, radiusKm);

  return (
    <div style={{ background: "#f0f4f0" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-3xl font-extrabold" style={{ color: "#1a1a1a" }}>Nearby Stations</h1>
          <p className="text-sm mt-1" style={{ color: "#4b5563" }}>
            Find motorway service stations near your current location
          </p>
        </div>

        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-3 mb-6"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm" style={{ color: "#4b5563" }}>Radius:</span>
            <select
              value={radiusKm}
              onChange={handleRadiusChange}
              className="text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#1a1a1a" }}
            >
              {[5, 10, 25, 50].map((v) => (
                <option key={v} value={v}>{v} km</option>
              ))}
            </select>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#4b5563" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#4b5563"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>

            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
              <button
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className="px-2.5 py-1.5 transition-colors"
                style={{
                  background: viewMode === "grid" ? "#e8f5ee" : "#ffffff",
                  color: viewMode === "grid" ? "#1a7a4a" : "#9ca3af",
                  borderRight: "1px solid #e5e7eb",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                className="px-2.5 py-1.5 transition-colors"
                style={{
                  background: viewMode === "list" ? "#e8f5ee" : "#ffffff",
                  color: viewMode === "list" ? "#1a7a4a" : "#9ca3af",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="3" cy="6" r="1.5" fill="currentColor"/>
                  <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="3" cy="18" r="1.5" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={() => isLoggedIn ? navigate("/reports/create") : navigate("/login")}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Create Report
          </button>
        </div>

        {!loading && !error && (
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>
            {stations.length === 0
              ? "No stations found"
              : `${stations.length} station${stations.length !== 1 ? "s" : ""} found`
            }
            {stations.length > 0 && stations[0]?.distanceKm != null && (
              <span> — nearest is {stations[0].distanceKm < 1
                ? `${Math.round(stations[0].distanceKm * 1000)}m away`
                : `${stations[0].distanceKm.toFixed(1)} km away`}
              </span>
            )}
          </p>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-6" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {loading && <Loading />}

        {!loading && !error && stations.length === 0 && (
          <div className="text-center py-16 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <p className="font-semibold" style={{ color: "#1a1a1a" }}>No stations found in this radius</p>
            <p className="text-sm mt-1" style={{ color: "#4b5563" }}>Try increasing the search radius</p>
          </div>
        )}

        {!loading && stations.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((s) => (
              <StationCard
                key={s._id}
                station={s}
                userCoords={userCoords}
                onViewDetails={(id) => navigate(`/stations/${id}`)}
              />
            ))}
          </div>
        )}

        {!loading && stations.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {stations.map((s) => {
              const [lng, lat] = s.location?.coordinates || [];
              const distKm = s.distanceKm != null
                ? s.distanceKm
                : (userCoords && lat && lng ? calcDistanceKm(userCoords.lat, userCoords.lng, lat, lng) : null);
              const distLabel = distKm != null
                ? (distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)} km`)
                : null;
              const hasEV  = (s.facilities || []).includes("ev");
              const isOpen = s.openNow;
              return (
                <div
                  key={s._id}
                  className="flex items-center justify-between gap-4 rounded-xl px-5 py-3.5 transition-all"
                  style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c8d5c8"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{s.name}</p>
                      {s.operator && <span className="text-xs" style={{ color: "#1a7a4a" }}>{s.operator}</span>}
                      {isOpen && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", color: "#059669", border: "1px solid rgba(16,185,129,0.2)" }}>Open 24/7</span>
                      )}
                      {hasEV && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(26,122,74,0.08)", color: "#1a7a4a", border: "1px solid rgba(26,122,74,0.2)" }}>EV</span>
                      )}
                    </div>
                    {s.address && <p className="text-xs mt-0.5 truncate" style={{ color: "#4b5563" }}>{s.address}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {distLabel && <span className="text-xs font-medium" style={{ color: "#9ca3af" }}>{distLabel}</span>}
                    <button
                      onClick={() => navigate(`/stations/${s._id}`)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openMaps(s, userCoords)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
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
        )}
      </div>
    </div>
  );
}
