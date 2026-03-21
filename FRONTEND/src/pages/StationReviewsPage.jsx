import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import reviewApi from "../api/reviewApi";
import { useAuth } from "../context/AuthContext";

// ── constants ─────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "most_recent",   label: "Most Recent" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "lowest_rated",  label: "Lowest Rated" },
  { value: "most_helpful",  label: "Most Helpful" },
];

const FILTER_OPTIONS = [
  { value: "",  label: "All Reviews" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
];

const ALL_TAGS = ["Clean Toilets","Good Food","EV Friendly","Family Friendly","Friendly Staff","24/7 Open","Showers","Fuel","Parking"];

const BRAND_COLORS = {
  "Moto":          { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Welcome Break": { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  "Extra":         { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  "Roadchef":      { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
};
const brandStyle = (brand) => BRAND_COLORS[brand] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };

// ── helpers ───────────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= rating ? "#f59e0b" : "none"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}
    </div>
  );
}

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i} type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          aria-label={`${i} star${i !== 1 ? "s" : ""}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={(hover || value) >= i ? "#f59e0b" : "none"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function Avatar({ name, size = 36 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#16a34a","#2563eb","#7c3aed","#db2777","#ea580c","#0891b2"];
  const color  = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2"
      style={{ background: type === "success" ? "#16a34a" : "#dc2626", color: "#fff", minWidth: 240 }}>
      {type === "success"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
      }
      {message}
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────
function ReviewCard({ review, onHelpful, helpfulVoted }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [voted, setVoted]               = useState(helpfulVoted);
  const [loading, setLoading]           = useState(false);
  const bs = brandStyle(review.brand);

  const reviewerName = review.user?.name || review.guestName || "Anonymous";
  const dateStr = new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const handleHelpful = async () => {
    if (voted || loading) return;
    setLoading(true);
    try {
      const res = await onHelpful(review._id);
      if (!res.alreadyVoted) { setHelpfulCount(res.helpfulCount); setVoted(true); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl p-5 flex flex-col gap-3 transition-all"
      style={{ background: "#fff", border: "1px solid #e5e7eb" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#c8d5c8"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
    >
      {/* Station + brand */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold leading-snug" style={{ color: "#111827" }}>{review.stationName}</h3>
          {review.roadLabel && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{review.roadLabel}</p>}
        </div>
        {review.brand && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
            {review.brand}
          </span>
        )}
      </div>

      {/* Stars + title */}
      <div>
        <Stars rating={review.rating} />
        <p className="text-sm font-semibold mt-1" style={{ color: "#111827" }}>{review.title}</p>
      </div>

      {/* Review text */}
      <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>{review.reviewText}</p>

      {/* Tags */}
      {review.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
        <div className="flex items-center gap-2">
          <Avatar name={reviewerName} size={30} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "#374151" }}>{reviewerName}</p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>{dateStr}</p>
          </div>
        </div>
        <button
          onClick={handleHelpful}
          disabled={voted || loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          style={{
            background: voted ? "#f0fdf4" : "#f9fafb",
            border: `1px solid ${voted ? "#bbf7d0" : "#e5e7eb"}`,
            color: voted ? "#16a34a" : "#6b7280",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={voted ? "#16a34a" : "none"}>
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" stroke={voted ? "#16a34a" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke={voted ? "#16a34a" : "#6b7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Helpful {helpfulCount > 0 && `(${helpfulCount})`}
        </button>
      </div>
    </div>
  );
}

// ── ReviewForm modal ──────────────────────────────────────────────────────────
function ReviewForm({ onClose, onSubmitted, isLoggedIn }) {
  const [step, setStep]         = useState(1); // 1=station, 2=review
  const [stationQuery, setStationQuery] = useState("");
  const [stationResults, setStationResults] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [rating, setRating]     = useState(0);
  const [title, setTitle]       = useState("");
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");
  const searchTimer = useRef(null);

  const searchStations = (q) => {
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setStationResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await reviewApi.searchStations(q);
        setStationResults(res);
      } catch { setStationResults([]); }
    }, 300);
  };

  const toggleTag = (tag) => setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating)        { setError("Please select a star rating"); return; }
    if (!title.trim())  { setError("Please enter a review title"); return; }
    if (!reviewText.trim()) { setError("Please write your review"); return; }
    if (!isLoggedIn && !guestName.trim()) { setError("Please enter your name"); return; }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        stationId:   selectedStation?._id || "manual",
        stationName: selectedStation?.name || stationQuery,
        brand:       selectedStation?.operator || "",
        roadLabel:   selectedStation?.motorway ? `${selectedStation.motorway} Motorway` : "",
        address:     selectedStation?.address  || "",
        rating, title, reviewText,
        tags:        selectedTags,
        guestName:   isLoggedIn ? "" : guestName,
      };
      const created = await reviewApi.createReview(payload);
      onSubmitted(created);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#fff", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Write a Review</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Station search */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Station</label>
            {selectedStation ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{selectedStation.name}</p>
                  {selectedStation.operator && <p className="text-xs" style={{ color: "#16a34a" }}>{selectedStation.operator}</p>}
                </div>
                <button type="button" onClick={() => { setSelectedStation(null); setStationQuery(""); }}
                  className="text-xs" style={{ color: "#9ca3af" }}>Change</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text" value={stationQuery}
                  onChange={e => { setStationQuery(e.target.value); searchStations(e.target.value); }}
                  placeholder="Search for a station..."
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }}
                />
                {stationResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-10 overflow-hidden"
                    style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                    {stationResults.map(s => (
                      <button key={s._id} type="button"
                        onClick={() => { setSelectedStation(s); setStationQuery(s.name); setStationResults([]); }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: "#374151" }}>
                        <span className="font-medium">{s.name}</span>
                        {s.operator && <span className="text-xs ml-2" style={{ color: "#16a34a" }}>{s.operator}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {stationQuery && stationResults.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>No stations found — your review will still be saved with this name.</p>
                )}
              </div>
            )}
          </div>

          {/* Guest name */}
          {!isLoggedIn && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Your Name</label>
              <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }}
              />
            </div>
          )}

          {/* Star rating */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Rating</label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Review Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Summarise your experience..."
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }}
            />
          </div>

          {/* Review text */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Your Review</label>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
              placeholder="Tell other travellers about your experience..."
              rows={4}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#111827" }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Tags (optional)</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    background: selectedTags.includes(tag) ? "#16a34a" : "#f3f4f6",
                    color:      selectedTags.includes(tag) ? "#fff"     : "#374151",
                    border:     `1px solid ${selectedTags.includes(tag) ? "#16a34a" : "#e5e7eb"}`,
                  }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}>
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StationReviewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // stats
  const [stats, setStats] = useState(null);

  // reviews list
  const [reviews, setReviews]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // filters
  const [search, setSearch]   = useState("");
  const [rating, setRating]   = useState("");
  const [sort, setSort]       = useState("most_recent");

  // helpful votes tracked locally
  const [helpfulVoted, setHelpfulVoted] = useState({});

  // modal
  const [showForm, setShowForm] = useState(false);

  // toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // debounced search
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // load stats once
  useEffect(() => {
    reviewApi.getStats().then(setStats).catch(() => {});
  }, []);

  // load reviews when filters change — reset to page 1
  useEffect(() => {
    setPage(1);
    setReviews([]);
    setInitialLoading(true);
    reviewApi.getReviews({ search: debouncedSearch, rating, sort, page: 1, limit: 8 })
      .then(data => {
        setReviews(data.reviews);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [debouncedSearch, rating, sort]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await reviewApi.getReviews({ search: debouncedSearch, rating, sort, page: nextPage, limit: 8 });
      setReviews(prev => [...prev, ...data.reviews]);
      setPage(nextPage);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  };

  const handleHelpful = async (reviewId) => {
    const res = await reviewApi.markHelpful(reviewId);
    if (!res.alreadyVoted) setHelpfulVoted(prev => ({ ...prev, [reviewId]: true }));
    return res;
  };

  const handleReviewSubmitted = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    setTotal(prev => prev + 1);
    showToast("Review submitted successfully!");
    // refresh stats
    reviewApi.getStats().then(setStats).catch(() => {});
  };

  const hasMore = reviews.length < total;

  return (
    <div className="min-h-screen" style={{ background: "#f9fafb" }}>
      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }} className="py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="white" stroke="white" strokeWidth="1.5"/>
            </svg>
            Community Reviews
          </span>
          <h1 className="text-3xl font-extrabold text-white mb-3">Station Reviews</h1>
          <p className="text-base mb-6" style={{ color: "rgba(255,255,255,0.85)" }}>
            Real experiences from real travellers. Find the best stops on your route.
          </p>
          {/* Hero search */}
          <div className="relative max-w-lg mx-auto">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search stations, brands, or keywords..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Stats row ── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Reviews", value: stats.totalReviews.toLocaleString(), icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { label: "Average Rating", value: `${stats.averageRating} / 5`, icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
              { label: "Top Brand", value: stats.mostReviewedBrand, icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
              { label: "Stations Reviewed", value: stats.topRatedStations?.length > 0 ? `${stats.topRatedStations.length}+ top picks` : "—", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#f0fdf4" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d={s.icon} stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#6b7280" }}>{s.label}</p>
                  <p className="text-sm font-bold" style={{ color: "#111827" }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Controls row ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating filter */}
            <select value={rating} onChange={e => setRating(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}>
              {FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Sort */}
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {total > 0 && (
              <span className="text-sm" style={{ color: "#6b7280" }}>
                {total} review{total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Write a Review
          </button>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left — reviews list */}
          <div className="flex-1 min-w-0">
            {initialLoading ? (
              <div className="flex flex-col gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                    <div className="h-4 rounded mb-3" style={{ background: "#f3f4f6", width: "60%" }}/>
                    <div className="h-3 rounded mb-2" style={{ background: "#f3f4f6", width: "40%" }}/>
                    <div className="h-3 rounded mb-2" style={{ background: "#f3f4f6", width: "90%" }}/>
                    <div className="h-3 rounded" style={{ background: "#f3f4f6", width: "75%" }}/>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl p-12 text-center" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>No reviews found</p>
                <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
                  {search || rating ? "Try adjusting your filters." : "Be the first to leave a review."}
                </p>
                <button onClick={() => setShowForm(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#16a34a" }}>
                  Write a Review
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {reviews.map(r => (
                    <ReviewCard
                      key={r._id}
                      review={r}
                      onHelpful={handleHelpful}
                      helpfulVoted={!!helpfulVoted[r._id]}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button onClick={loadMore} disabled={loadingMore}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}>
                      {loadingMore ? "Loading…" : `Load more (${total - reviews.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right — Top Rated Stations sidebar */}
          {stats?.topRatedStations?.length > 0 && (
            <div className="lg:w-72 flex-shrink-0">
              <div className="rounded-xl p-5 sticky top-24" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: "#111827" }}>Top Rated Stations</h3>
                <div className="flex flex-col gap-3">
                  {stats.topRatedStations.map((s, idx) => (
                    <div key={s.stationId} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: idx === 0 ? "#fef3c7" : "#f3f4f6", color: idx === 0 ? "#92400e" : "#6b7280" }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#111827" }}>{s.stationName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Stars rating={Math.round(s.avgRating)} size={10} />
                          <span className="text-xs" style={{ color: "#6b7280" }}>{s.avgRating} ({s.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-5 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                  <p className="text-xs mb-3" style={{ color: "#6b7280" }}>Know a great station? Share your experience.</p>
                  <button onClick={() => setShowForm(true)}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "#16a34a" }}>
                    Write a Review
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Review Form Modal ── */}
      {showForm && (
        <ReviewForm
          onClose={() => setShowForm(false)}
          onSubmitted={handleReviewSubmitted}
          isLoggedIn={!!user}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
