import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import stationApi from "../api/stationApi";
import Loading from "../components/Loading";
import StationCard from "../components/StationCard";

function RadiusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = [5, 10, 25, 50];

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="bg-white/10 backdrop-blur-md border border-blue-400/30 text-white rounded-xl px-5 py-2.5 hover:bg-white/20 hover:border-blue-400 transition-all duration-200 flex items-center gap-2"
      >
        <span>{value} km</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-[#0b1120] border border-white/10 rounded-xl text-white shadow-lg z-50 overflow-hidden">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 ${o === value ? "bg-blue-500/20" : "hover:bg-blue-500/20"} transition-colors`}
            >
              {o} km
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nearby() {
  const navigate = useNavigate();

  const [coords, setCoords] = useState({ lng: -0.1278, lat: 51.5074 }); // default London
  const [radiusKm, setRadiusKm] = useState(10);
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNearby = async (lng, lat, radius, facilities) => {
    setLoading(true);
    setError("");
    try {
      // Make sure stationApi has: nearby(lng, lat, radiusKm, facilities)
      const res = await stationApi.nearby(lng, lat, radius, facilities);
      // handle both array or normalized response
      const list = Array.isArray(res) ? res : res?.stations || res || [];
      setStations(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load nearby stations");
    } finally {
      setLoading(false);
    }
  };

  // Get browser location (optional)
  const location = useLocation();

  // Parse facilities from query param when URL changes
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const f = qs.get("facilities");
    if (f) {
      const arr = f.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
      setSelectedFacilities(arr);
    } else {
      setSelectedFacilities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // get browser location (store coords); actual loading happens in watcher below
  useEffect(() => {
    const ok = (pos) => {
      const lng = pos.coords.longitude;
      const lat = pos.coords.latitude;
      setCoords({ lng, lat });
    };

    const fail = () => {
      // keep default coords
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when coords, radius or selectedFacilities change
  useEffect(() => {
    loadNearby(coords.lng, coords.lat, radiusKm, selectedFacilities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords.lng, coords.lat, radiusKm, JSON.stringify(selectedFacilities)]);

  const handleRefresh = () => {
    loadNearby(coords.lng, coords.lat, radiusKm, selectedFacilities);
  };

  const toggleFacility = (f) => {
    const key = String(f).toLowerCase();
    setSelectedFacilities((prev) => {
      const has = prev.includes(key);
      if (has) return prev.filter((x) => x !== key);
      return [...prev, key];
    });
  };

  const clearFilters = () => setSelectedFacilities([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Nearby Stations</h1>
            <p className="text-gray-300 mt-1">Find motorway service stations near your current location.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-gray-300 text-sm mr-2 hidden sm:inline">Radius</span>
                <div className="relative" ref={useRef(null)}>
                  <RadiusDropdown
                    value={radiusKm}
                    onChange={(v) => setRadiusKm(v)}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-5 py-2.5 hover:opacity-90"
            >
              Refresh
            </button>

            <button
              onClick={() => navigate("/reports/create")}
              className="rounded-xl border border-white/20 text-white px-5 py-2.5 bg-white/5 hover:bg-white/10"
            >
              Create Report
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-10">
            <Loading />
          </div>
        )}

        {/* Stations grid */}
        {!loading && !error && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-300">Showing {stations.length} station{stations.length === 1 ? "" : "s"}</div>
              {selectedFacilities.length > 0 && (
                <div className="text-sm text-gray-300">Filters: {selectedFacilities.join(", ")}</div>
              )}
            </div>

            {stations.length === 0 ? (
              <div className="text-white/70 rounded-lg p-6 bg-white/3">
                {selectedFacilities.length > 0 ? (
                  <div>No stations match your selected filters. Try removing a filter.</div>
                ) : (
                  <div>No stations found in this radius.</div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {stations.map((s) => (
                  <StationCard
                    key={s._id}
                    station={s}
                    onClick={() => navigate(`/stations/${s._id}`)}
                    selectedFacilities={selectedFacilities}
                    onFacilityToggle={toggleFacility}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {/* Selected filters UI */}
        <div className="mt-6">
          {selectedFacilities.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-300">Selected filters:</div>
              <div className="flex flex-wrap gap-2">
                {selectedFacilities.map((f) => (
                  <button key={f} onClick={() => toggleFacility(f)} className="text-xs rounded-full px-2 py-1 bg-blue-500/60 text-white border border-blue-400">{f}</button>
                ))}
                <button onClick={clearFilters} className="text-xs rounded-full px-2 py-1 bg-white/5 text-white border border-white/20">Clear filters</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
