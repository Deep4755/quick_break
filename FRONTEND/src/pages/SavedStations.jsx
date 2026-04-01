import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import savedStationApi from "../api/savedStationApi";
import { useAuth } from "../context/AuthContext";

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (mins < 60)   return "Saved just now";
  if (hours < 24)  return `Saved ${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7)    return `Saved ${days} day${days !== 1 ? "s" : ""} ago`;
  if (weeks < 5)   return `Saved ${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  return `Saved ${months} month${months !== 1 ? "s" : ""} ago`;
}

function openMaps(station, navigate) {
  // Build a minimal station object NavigationPage expects
  const { lat, lng } = station.coordinates || {};
  const stationObj = {
    _id: station.stationId,
    name: station.name,
    operator: station.brand || "",
    motorway: station.motorway || "",
    address: station.address || "",
    facilities: station.amenities || [],
    location: lat && lng ? { coordinates: [lng, lat] } : null,
  };
  navigate("/navigate", { state: { station: stationObj, userLocation: null } });
}

const AMENITY_LABELS = {
  ev:       "EV Charging",
  food:     "Food Court",
  toilets:  "Toilets",
  showers:  "Showers",
  fuel:     "Fuel",
  parking:  "Parking",
  coffee:   "Coffee",
  wifi:     "WiFi",
};

function amenityLabel(key) {
  return AMENITY_LABELS[key?.toLowerCase()] || key;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2"
      style={{ background: type === "success" ? "#16a34a" : "#dc2626", color: "#fff", minWidth: 240 }}
    >
      {type === "success"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
      }
      {message}
    </div>
  );
}

// ── SavedStationCard ──────────────────────────────────────────────────────────

function SavedStationCard({ station, onRemove, removing, navigate }) {
  const distMi = station.distanceKm != null
    ? (station.distanceKm * 0.621371).toFixed(1)
    : null;

  const roadLine = station.roadLabel || (station.motorway ? `${station.motorway} Motorway` : null);

  return (
    <div
      className="rounded-xl flex flex-col transition-all duration-150"
      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c8d5c8"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold leading-snug" style={{ color: "#111827" }}>{station.name}</h3>
            {station.brand && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: "#16a34a" }}>{station.brand}</p>
            )}
          </div>
          {/* Filled bookmark */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a" className="flex-shrink-0 mt-0.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>

        {/* Road label */}
        {roadLine && (
          <p className="text-sm font-medium mt-1" style={{ color: "#374151" }}>{roadLine}</p>
        )}

        {/* Address */}
        {station.address && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6b7280" }}>{station.address}</p>
        )}

        {/* Distance */}
        {distMi && (
          <div className="flex items-center gap-1 mt-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="2"/>
              <path d="M12 8v4l3 3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-xs" style={{ color: "#9ca3af" }}>{distMi} miles away</span>
          </div>
        )}

        {/* Amenity chips */}
        {station.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {station.amenities.map((a) => (
              <span
                key={a}
                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}
              >
                {amenityLabel(a)}
              </span>
            ))}
          </div>
        )}

        {/* Note box */}
        {station.note && (
          <div
            className="mt-3 px-3 py-2 rounded-lg text-xs italic leading-relaxed"
            style={{ background: "#fefce8", border: "1px solid #fde68a", color: "#92400e" }}
          >
            "{station.note}"
          </div>
        )}

        {/* Saved time */}
        {station.savedAt && (
          <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>{timeAgo(station.savedAt)}</p>
        )}
      </div>

      {/* Action buttons */}
      <div
        className="flex gap-2 px-5 pb-5"
      >
        <button
          onClick={() => navigate(`/stations/${station.stationId}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="15 3 21 3 21 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="10" y1="14" x2="21" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          View Details
        </button>
        <button
          onClick={() => openMaps(station, navigate)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#374151" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#e9ecef"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#f5f7f5"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Navigate
        </button>
        <button
          onClick={() => onRemove(station.stationId)}
          disabled={removing === station.stationId}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#fff5f5"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: "all",     label: "All Stations" },
  { value: "ev",      label: "EV Charging" },
  { value: "food",    label: "Food Court" },
  { value: "toilets", label: "Toilets" },
  { value: "fuel",    label: "Fuel" },
  { value: "parking", label: "Parking" },
];

const SORT_OPTIONS = [
  { value: "recent",  label: "Recently Saved" },
  { value: "nearest", label: "Nearest" },
  { value: "az",      label: "A–Z" },
];

export default function SavedStations() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [stations, setStations]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [viewMode, setViewMode]   = useState("grid");

  // controls
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [sort, setSort]       = useState("recent");

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    savedStationApi.getAll()
      .then(data => setStations(Array.isArray(data) ? data : []))
      .catch(() => setStations([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleRemove = async (stationId) => {
    setRemovingId(stationId);
    setStations(prev => prev.filter(s => s.stationId !== stationId));
    try {
      await savedStationApi.remove(stationId);
      setToast({ message: "Station removed from saved stations" });
    } catch {
      const data = await savedStationApi.getAll().catch(() => []);
      setStations(Array.isArray(data) ? data : []);
      setToast({ message: "Failed to remove station", type: "error" });
    } finally {
      setRemovingId(null);
    }
  };

  // client-side search + filter + sort
  const displayed = useMemo(() => {
    let list = [...stations];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.brand?.toLowerCase().includes(q) ||
        s.roadLabel?.toLowerCase().includes(q) ||
        s.motorway?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
      );
    }

    // filter by amenity
    if (filter !== "all") {
      list = list.filter(s => (s.amenities || []).map(a => a.toLowerCase()).includes(filter));
    }

    // sort
    if (sort === "recent") {
      list.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    } else if (sort === "nearest") {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else if (sort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [stations, search, filter, sort]);

  return (
    <div style={{ background: "#f0f4f0", minHeight: "100vh" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: "#111827" }}>Saved Stations</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              View and manage your bookmarked motorway service stations
            </p>
          </div>
          <button
            onClick={() => navigate("/nearby")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="15 3 21 3 21 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="10" y1="14" x2="21" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Explore Nearby Stations
          </button>
        </div>

        {/* Control bar */}
        <div
          className="rounded-2xl px-5 py-4 mb-6 flex flex-wrap items-center gap-3"
          style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          {/* Count */}
          <span className="text-sm font-medium flex-shrink-0" style={{ color: "#374151" }}>
            You have {stations.length} saved station{stations.length !== 1 ? "s" : ""}
          </span>

          <div className="flex-1 flex flex-wrap items-center gap-3 justify-end">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search saved stations"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm pl-8 pr-3 py-1.5 rounded-lg outline-none"
                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827", width: 200 }}
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg outline-none cursor-pointer"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151" }}
            >
              {FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg outline-none cursor-pointer"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151" }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Grid / List toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
              <button
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className="px-2.5 py-1.5 transition-colors"
                style={{
                  background: viewMode === "grid" ? "#e8f5ee" : "#ffffff",
                  color: viewMode === "grid" ? "#16a34a" : "#9ca3af",
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
                  color: viewMode === "list" ? "#16a34a" : "#9ca3af",
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
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "#e5e7eb", borderTopColor: "#16a34a" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && stations.length === 0 && (
          <div className="text-center py-20 rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-lg font-bold mb-1" style={{ color: "#111827" }}>No saved stations yet</p>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
              Save stations from Nearby or Station Details to view them here later.
            </p>
            <button
              onClick={() => navigate("/nearby")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}
            >
              Find Nearby Stations
            </button>
          </div>
        )}

        {/* No search results */}
        {!loading && stations.length > 0 && displayed.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <p className="font-semibold" style={{ color: "#111827" }}>No stations match your search</p>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Try a different search term or filter</p>
          </div>
        )}

        {/* Grid view */}
        {!loading && displayed.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {displayed.map(s => (
              <SavedStationCard
                key={s._id}
                station={s}
                onRemove={handleRemove}
                removing={removingId}
                navigate={navigate}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && displayed.length > 0 && viewMode === "list" && (
          <div className="space-y-3">
            {displayed.map(s => {
              const distMi = s.distanceKm != null ? (s.distanceKm * 0.621371).toFixed(1) : null;
              const roadLine = s.roadLabel || (s.motorway ? `${s.motorway} Motorway` : null);
              return (
                <div
                  key={s._id}
                  className="rounded-xl px-5 py-4 flex items-center gap-4 transition-all"
                  style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c8d5c8"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: "#111827" }}>{s.name}</p>
                      {s.brand && <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>{s.brand}</span>}
                    </div>
                    {roadLine && <p className="text-xs mt-0.5" style={{ color: "#374151" }}>{roadLine}</p>}
                    {s.address && <p className="text-xs mt-0.5 truncate" style={{ color: "#6b7280" }}>{s.address}</p>}
                    {distMi && <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{distMi} miles away</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/stations/${s.stationId}`)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openMaps(s, navigate)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#374151" }}
                    >
                      Navigate
                    </button>
                    <button
                      onClick={() => handleRemove(s.stationId)}
                      disabled={removingId === s.stationId}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626" }}
                    >
                      Remove
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
