import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import reportApi from "../api/reportApi";
import stationApi from "../api/stationApi";
import BexxaVoiceAssistant from "../components/BexxaVoiceAssistant";

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

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
      if (bexxaData.cleanlinessRating) setForm(p => ({ ...p, cleanlinessRating: bexxaData.cleanlinessRating }));
      if (bexxaData.busyLevel)         setForm(p => ({ ...p, busyLevel: bexxaData.busyLevel }));
      if (bexxaData.parkingStatus)     setForm(p => ({ ...p, parkingStatus: bexxaData.parkingStatus }));
      if (bexxaData.evStatus)          setForm(p => ({ ...p, evStatus: bexxaData.evStatus }));
      if (bexxaData.comment)           setForm(p => ({ ...p, comment: bexxaData.comment }));
      if (bexxaData.stationName) {
        setSearchQuery(bexxaData.stationName);
        stationApi.search(bexxaData.stationName).then(res => {
          const list = Array.isArray(res) ? res : [];
          if (list.length >= 1) handleSelectStation(list[0]);
          else setSearchResults(list);
        }).catch(() => {});
      }
    }

    if (prefilledId) {
      stationApi.details(prefilledId).then(s => {
        if (s?._id) {
          setSelectedStation(s);
          setForm(p => ({ ...p, stationId: s._id }));
          setSearchQuery(s.name || "");
        }
      }).catch(() => {});
    }
  }, []); // eslint-disable-line

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await stationApi.search(q);
      setSearchResults(Array.isArray(res) ? res : []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 400);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (selectedStation) {
      setSelectedStation(null);
      setForm(p => ({ ...p, stationId: "" }));
    }
    debouncedSearch(val);
  };

  const handleSelectStation = (s) => {
    setSelectedStation(s);
    setForm(p => ({ ...p, stationId: s._id }));
    setSearchQuery(s.name);
    setSearchResults([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleBexxaReportData = useCallback(async (data) => {
    if (data.cleanlinessRating) setForm(p => ({ ...p, cleanlinessRating: data.cleanlinessRating }));
    if (data.busyLevel)         setForm(p => ({ ...p, busyLevel: data.busyLevel }));
    if (data.parkingStatus)     setForm(p => ({ ...p, parkingStatus: data.parkingStatus }));
    if (data.evStatus)          setForm(p => ({ ...p, evStatus: data.evStatus }));
    if (data.comment)           setForm(p => ({ ...p, comment: data.comment }));
    if (data.stationName) {
      setSearchQuery(data.stationName);
      setSearching(true);
      try {
        const res = await stationApi.search(data.stationName);
        const list = Array.isArray(res) ? res : [];
        if (list.length === 1)    handleSelectStation(list[0]);
        else if (list.length > 1) setSearchResults(list);
        else setError(`No station found matching "${data.stationName}". Please search manually.`);
      } catch { setError("Could not search for station. Please try manually."); }
      finally { setSearching(false); }
    }
  }, []); // eslint-disable-line

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
      // Reset form
      setForm({ stationId:"", cleanlinessRating:5, busyLevel:"Low", parkingStatus:"Available", evStatus:"NoEV", comment:"" });
      setSelectedStation(null);
      setSearchQuery("");
      // Redirect after 2.5s
      setTimeout(() => navigate(`/stations/${form.stationId}`), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:"#f0f4f0", minHeight:"100vh" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color:"#1a1a1a" }}>Create Report</h1>
        <p className="text-sm mb-5" style={{ color:"#6b7280" }}>
          Select a station, rate your experience, and submit your report quickly.
        </p>

        {/* Compact Bexxa card */}
        <div className="rounded-xl p-4 mb-5" style={{ background:"#fff", border:"1px solid #e5e7eb" }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#1a7a4a"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color:"#1a7a4a" }}>Voice Reporting with Bexxa</span>
          </div>
          <BexxaVoiceAssistant mode="report" onReportData={handleBexxaReportData} />
        </div>

        {/* Success message */}
        {success && (
          <div className="rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2" style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", color:"#059669" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Report submitted successfully! Redirecting to station page...
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-5" style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", color:"#dc2626" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Station Search */}
          <div className="relative">
            <label className="qb-label">Station</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, brand, or motorway..."
              className="qb-input"
              autoComplete="off"
            />
            {searching && <p className="text-xs mt-1" style={{ color:"#1a7a4a" }}>Searching...</p>}

            {searchResults.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden shadow-lg" style={{ background:"#fff", border:"1px solid #e5e7eb" }}>
                {searchResults.map(s => (
                  <li key={s._id} onClick={() => handleSelectStation(s)}
                    className="px-4 py-3 cursor-pointer text-sm transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <span className="font-semibold" style={{ color:"#1a1a1a" }}>{s.name}</span>
                    {s.operator && <span className="ml-2 text-xs" style={{ color:"#4b5563" }}>· {s.operator}</span>}
                    {s.address && <p className="text-xs mt-0.5 truncate" style={{ color:"#9ca3af" }}>{s.address}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected station card */}
          {selectedStation && (
            <div className="rounded-xl p-4 flex items-start justify-between gap-3" style={{ background:"rgba(26,122,74,0.06)", border:"1px solid rgba(26,122,74,0.2)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold mb-0.5" style={{ color:"#111" }}>{selectedStation.name}</p>
                {selectedStation.operator && <p className="text-xs mb-0.5" style={{ color:"#1a7a4a", fontWeight:500 }}>{selectedStation.operator}</p>}
                {selectedStation.motorway && <p className="text-xs mb-0.5" style={{ color:"#374151" }}>{selectedStation.motorway}</p>}
                {selectedStation.address && <p className="text-xs" style={{ color:"#6b7280" }}>{selectedStation.address}</p>}
              </div>
              <button type="button" onClick={() => { setSelectedStation(null); setForm(p => ({ ...p, stationId:"" })); setSearchQuery(""); }}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-red-100"
                style={{ color:"#9ca3af", background:"none", border:"none", cursor:"pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* Cleanliness */}
          <div>
            <label className="qb-label">Cleanliness</label>
            <select name="cleanlinessRating" value={form.cleanlinessRating} onChange={handleChange} className="qb-input" style={{ appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center" }}>
              <option value={5}>⭐⭐⭐⭐⭐  Spotless</option>
              <option value={4}>⭐⭐⭐⭐  Clean</option>
              <option value={3}>⭐⭐⭐  Average</option>
              <option value={2}>⭐⭐  Dirty</option>
              <option value={1}>⭐  Very Dirty</option>
            </select>
          </div>

          {/* Busy level — chip style */}
          <div>
            <label className="qb-label">Busy Level</label>
            <div className="flex gap-2">
              {[
                { value:"Low", label:"Quiet", icon:"😌" },
                { value:"Medium", label:"Moderate", icon:"🙂" },
                { value:"High", label:"Very Busy", icon:"😰" },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, busyLevel:opt.value }))}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: form.busyLevel === opt.value ? "#eff6ff" : "#f5f7f5",
                    border: form.busyLevel === opt.value ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    color: form.busyLevel === opt.value ? "#1e40af" : "#374151",
                  }}>
                  <span style={{ fontSize:18, display:"block", marginBottom:2 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parking — chip style */}
          <div>
            <label className="qb-label">Parking</label>
            <div className="flex gap-2">
              {[
                { value:"Available", label:"Available", icon:"🅿️" },
                { value:"Limited", label:"Limited", icon:"⚠️" },
                { value:"Full", label:"Full", icon:"🚫" },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, parkingStatus:opt.value }))}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: form.parkingStatus === opt.value ? "#eff6ff" : "#f5f7f5",
                    border: form.parkingStatus === opt.value ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    color: form.parkingStatus === opt.value ? "#1e40af" : "#374151",
                  }}>
                  <span style={{ fontSize:18, display:"block", marginBottom:2 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* EV Charging — chip style */}
          <div>
            <label className="qb-label">EV Charging</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value:"Working", label:"Working", icon:"🔋" },
                { value:"SomeBroken", label:"Some Broken", icon:"⚡" },
                { value:"OutOfOrder", label:"Out of Order", icon:"❌" },
                { value:"NoEV", label:"No Chargers", icon:"➖" },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, evStatus:opt.value }))}
                  className="py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: form.evStatus === opt.value ? "#eff6ff" : "#f5f7f5",
                    border: form.evStatus === opt.value ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    color: form.evStatus === opt.value ? "#1e40af" : "#374151",
                  }}>
                  <span style={{ fontSize:18, display:"block", marginBottom:2 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="qb-label">Comment (optional)</label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              rows={4}
              maxLength={200}
              placeholder="Example: Toilets were clean, parking was easy, and the station felt quiet."
              className="qb-input resize-none"
            />
            <p className="text-xs text-right mt-1" style={{ color:"#9ca3af" }}>{form.comment.length}/200</p>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || success} className="qb-btn-primary">
            {loading ? "Submitting..." : success ? "✓ Submitted" : "Submit Report"}
          </button>

          <button type="button" onClick={() => navigate(-1)} className="qb-btn-secondary">
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
}
