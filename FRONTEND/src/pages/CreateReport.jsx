import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import reportApi from "../api/reportApi";
import stationApi from "../api/stationApi";
import BexxaVoiceAssistant from "../components/BexxaVoiceAssistant";

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

const selStyle = {
  width: "100%",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#1a1a1a",
  fontSize: "14px",
  outline: "none",
  appearance: "none",
  cursor: "pointer",
};

export default function CreateReport() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form, setForm] = useState({
    stationId: "",
    cleanlinessRating: 5,
    busyLevel: "Low",
    parkingStatus: "Available",
    evStatus: "NoEV",
    comment: "",
  });

  const [searchQuery, setSearchQuery]         = useState("");
  const [searchResults, setSearchResults]     = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searching, setSearching]             = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);

  useEffect(() => {
    const prefilledId = location.state?.stationId;
    const bexxaData   = location.state?.bexxaData;

    if (bexxaData) {
      if (bexxaData.cleanlinessRating) setForm((p) => ({ ...p, cleanlinessRating: bexxaData.cleanlinessRating }));
      if (bexxaData.busyLevel)         setForm((p) => ({ ...p, busyLevel: bexxaData.busyLevel }));
      if (bexxaData.parkingStatus)     setForm((p) => ({ ...p, parkingStatus: bexxaData.parkingStatus }));
      if (bexxaData.evStatus)          setForm((p) => ({ ...p, evStatus: bexxaData.evStatus }));
      if (bexxaData.comment)           setForm((p) => ({ ...p, comment: bexxaData.comment }));
      if (bexxaData.stationName) {
        setSearchQuery(bexxaData.stationName);
        stationApi.search(bexxaData.stationName).then((res) => {
          const list = Array.isArray(res) ? res : [];
          if (list.length >= 1) handleSelectStation(list[0]);
          else setSearchResults(list);
        }).catch(() => {});
      }
    }

    if (prefilledId) {
      stationApi.details(prefilledId)
        .then((s) => {
          if (s && s._id) {
            setSelectedStation(s);
            setForm((p) => ({ ...p, stationId: s._id }));
            setSearchQuery(s.name || "");
          }
        })
        .catch(() => {});
    }
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await stationApi.search(q);
      setSearchResults(Array.isArray(res) ? res : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 400);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (selectedStation) {
      setSelectedStation(null);
      setForm((p) => ({ ...p, stationId: "" }));
    }
    debouncedSearch(val);
  };

  const handleSelectStation = (s) => {
    setSelectedStation(s);
    setForm((p) => ({ ...p, stationId: s._id }));
    setSearchQuery(s.name);
    setSearchResults([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleBexxaReportData = useCallback(async (data) => {
    if (data.cleanlinessRating) setForm((p) => ({ ...p, cleanlinessRating: data.cleanlinessRating }));
    if (data.busyLevel)         setForm((p) => ({ ...p, busyLevel: data.busyLevel }));
    if (data.parkingStatus)     setForm((p) => ({ ...p, parkingStatus: data.parkingStatus }));
    if (data.evStatus)          setForm((p) => ({ ...p, evStatus: data.evStatus }));
    if (data.comment)           setForm((p) => ({ ...p, comment: data.comment }));
    if (data.stationName) {
      setSearchQuery(data.stationName);
      setSearching(true);
      try {
        const res = await stationApi.search(data.stationName);
        const list = Array.isArray(res) ? res : [];
        if (list.length === 1)    handleSelectStation(list[0]);
        else if (list.length > 1) setSearchResults(list);
        else setError(`No station found matching "${data.stationName}". Please search manually.`);
      } catch {
        setError("Could not search for station. Please try manually.");
      } finally {
        setSearching(false);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.stationId) { setError("Please select a station first."); return; }
    setLoading(true);
    try {
      await reportApi.createReport({
        stationId:         form.stationId,
        cleanlinessRating: Number(form.cleanlinessRating),
        busyLevel:         form.busyLevel,
        parkingStatus:     form.parkingStatus,
        evStatus:          form.evStatus,
        comment:           form.comment,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#f0f4f0" }}>
      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-extrabold" style={{ color: "#1a1a1a" }}>Create Report</h1>
        <p className="text-sm mt-1 mb-6" style={{ color: "#4b5563" }}>
          Share your experience at a service station
        </p>

        {/* Bexxa card */}
        <div className="rounded-xl p-5 mb-6" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#1a7a4a"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4b5563" }}>
              Bexxa Voice Assistant
            </span>
          </div>
          <BexxaVoiceAssistant mode="report" onReportData={handleBexxaReportData} />
        </div>

        {success && (
          <div className="rounded-xl px-4 py-3 text-sm mb-5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#059669" }}>
            ✓ Report submitted successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Station Search */}
          <div className="relative">
            <label className="qb-label">Station Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Type station name, brand, or motorway..."
              className="qb-input"
              autoComplete="off"
            />
            {searching && (
              <p className="text-xs mt-1" style={{ color: "#1a7a4a" }}>Searching...</p>
            )}

            {searchResults.length > 0 && (
              <ul
                className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
              >
                {searchResults.map((s) => (
                  <li
                    key={s._id}
                    onClick={() => handleSelectStation(s)}
                    className="px-4 py-3 cursor-pointer text-sm transition-colors"
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f7f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="font-semibold" style={{ color: "#1a1a1a" }}>{s.name}</span>
                    {s.operator && (
                      <span className="ml-2 text-xs" style={{ color: "#4b5563" }}>· {s.operator}</span>
                    )}
                    {s.address && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#9ca3af" }}>{s.address}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected station preview */}
          {selectedStation && (
            <div
              className="rounded-xl px-4 py-3 flex items-start justify-between gap-3"
              style={{ background: "rgba(26,122,74,0.06)", border: "1px solid rgba(26,122,74,0.2)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{selectedStation.name}</p>
                {selectedStation.operator && (
                  <p className="text-xs mt-0.5" style={{ color: "#1a7a4a" }}>{selectedStation.operator}</p>
                )}
                {selectedStation.address && (
                  <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{selectedStation.address}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStation(null);
                  setForm((p) => ({ ...p, stationId: "" }));
                  setSearchQuery("");
                }}
                className="text-xs flex-shrink-0 mt-0.5 transition-colors hover:text-red-500"
                style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Cleanliness Rating */}
          <div>
            <label className="qb-label">Cleanliness Rating (1-5)</label>
            <div className="relative">
              <select name="cleanlinessRating" value={form.cleanlinessRating} onChange={handleChange} style={selStyle}>
                <option value={5}>⭐⭐⭐⭐⭐  Spotless</option>
                <option value={4}>⭐⭐⭐⭐  Clean</option>
                <option value={3}>⭐⭐⭐  Average</option>
                <option value={2}>⭐⭐  Dirty</option>
                <option value={1}>⭐  Very Dirty</option>
              </select>
              <ChevronDown />
            </div>
          </div>

          {/* How Busy */}
          <div>
            <label className="qb-label">How Busy?</label>
            <div className="relative">
              <select name="busyLevel" value={form.busyLevel} onChange={handleChange} style={selStyle}>
                <option value="Low">Quiet</option>
                <option value="Medium">Moderate</option>
                <option value="High">Very Busy</option>
              </select>
              <ChevronDown />
            </div>
          </div>

          {/* Parking Status */}
          <div>
            <label className="qb-label">Parking Status</label>
            <div className="relative">
              <select name="parkingStatus" value={form.parkingStatus} onChange={handleChange} style={selStyle}>
                <option value="Available">Available</option>
                <option value="Limited">Limited</option>
                <option value="Full">Full</option>
              </select>
              <ChevronDown />
            </div>
          </div>

          {/* EV Charger Status */}
          <div>
            <label className="qb-label">EV Charger Status</label>
            <div className="relative">
              <select name="evStatus" value={form.evStatus} onChange={handleChange} style={selStyle}>
                <option value="Working">Working</option>
                <option value="SomeBroken">Some Broken</option>
                <option value="OutOfOrder">Out of Order</option>
                <option value="NoEV">No EV Chargers</option>
              </select>
              <ChevronDown />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="qb-label">Comment (optional)</label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={5}
              maxLength={200}
              placeholder="Describe your experience..."
              className="qb-input resize-none"
            />
            <p className="text-xs text-right mt-1" style={{ color: "#9ca3af" }}>
              {form.comment.length}/200
            </p>
          </div>

          <button type="submit" disabled={loading || success} className="qb-btn-primary">
            {loading ? "Submitting..." : "Submit Report"}
          </button>

          <button type="button" onClick={() => navigate(-1)} className="qb-btn-secondary">
            Back
          </button>
        </form>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
