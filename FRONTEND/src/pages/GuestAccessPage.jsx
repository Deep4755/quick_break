import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── icons ─────────────────────────────────────────────────────────────────────
function IconEye() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="#16a34a" strokeWidth="2"/>
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="10" r="3" stroke="#16a34a" strokeWidth="2"/>
    </svg>
  );
}
function IconNavigate() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <polygon points="3 11 22 2 13 21 11 13 3 11" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconCheck({ white }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke={white ? "#fff" : "#16a34a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const QUICK_START = [
  { title: "Browse Instantly",  desc: "No sign-up required. Start exploring stations right away.",  Icon: IconEye },
  { title: "Find Stations",     desc: "Search by location, amenities, or motorway junction.",        Icon: IconPin },
  { title: "Navigate There",    desc: "Get directions and hit the road in just one tap.",             Icon: IconNavigate },
];

const GUEST_ALLOWED     = ["Browse nearby stations", "View station details", "Use navigation", "View reviews"];
const GUEST_RESTRICTED  = ["Save stations", "Post reviews", "Create reports", "Sync preferences"];
const FULL_FEATURES     = ["Browse nearby stations", "View station details", "Use navigation", "View reviews", "Save stations", "Post reviews", "Create reports", "Sync preferences"];
const EXTRA_BENEFITS    = ["Personalised station recommendations", "Access saved stations on any device", "Contribute to the QuickBreak community"];

export default function GuestAccessPage() {
  const navigate = useNavigate();
  const { continueAsGuest, isGuest, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleContinueAsGuest = async () => {
    setLoading(true);
    try {
      await continueAsGuest();
      navigate("/nearby");
    } finally {
      setLoading(false);
    }
  };

  // If already in a session, show a different CTA
  const alreadyActive = isLoggedIn || isGuest;

  return (
    <div className="min-h-screen" style={{ background: "#f9fafb" }}>

      {/* ── Hero ── */}
      <section className="py-16 px-4 text-center" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f9fafb 100%)" }}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-5"
          style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#16a34a" strokeWidth="2.5"/>
            <circle cx="12" cy="12" r="3" stroke="#16a34a" strokeWidth="2.5"/>
          </svg>
          No Account Required
        </span>

        <h1 className="text-4xl font-extrabold mb-3" style={{ color: "#111827" }}>Guest Access</h1>
        <p className="text-base max-w-md mx-auto mb-8" style={{ color: "#6b7280" }}>
          Explore QuickBreak without creating an account. Browse stations, view details, and plan your journey instantly.
        </p>

        {alreadyActive ? (
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate("/nearby")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}>
              <IconEye />
              {isGuest ? "Continue Browsing" : "Browse Stations"}
            </button>
            {!isLoggedIn && (
              <button onClick={() => navigate("/register")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}>
                <IconUser />
                Create Account
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={handleContinueAsGuest} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
              </svg>
              {loading ? "Starting…" : "Continue as Guest"}
            </button>
            <button onClick={() => navigate("/register")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}>
              <IconUser />
              Create Account
            </button>
          </div>
        )}
      </section>

      {/* ── Comparison ── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>Guest Access vs Full Account</h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>See what you can do with and without an account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Guest card */}
          <div className="rounded-2xl p-6 flex flex-col" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#6b7280" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" stroke="#6b7280" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "#111827" }}>Guest Access</h3>
                <p className="text-xs" style={{ color: "#9ca3af" }}>No account needed</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {GUEST_ALLOWED.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#f0fdf4" }}>
                    <IconCheck />
                  </div>
                  <span className="text-sm" style={{ color: "#374151" }}>{f}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold mb-2" style={{ color: "#9ca3af" }}>What you cannot do:</p>
            <div className="flex flex-col gap-2 mb-6">
              {GUEST_RESTRICTED.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#f9fafb" }}>
                    <IconX />
                  </div>
                  <span className="text-sm" style={{ color: "#9ca3af" }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={handleContinueAsGuest} disabled={loading || alreadyActive}
              className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151" }}>
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {alreadyActive ? (isGuest ? "Currently Browsing as Guest" : "You're Logged In") : "Browse as Guest"}
              </span>
            </button>
          </div>

          {/* Full account card */}
          <div className="rounded-2xl p-6 flex flex-col relative overflow-hidden"
            style={{ background: "linear-gradient(145deg, #16a34a 0%, #15803d 100%)" }}>
            {/* Recommended badge */}
            <span className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              Recommended
            </span>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <IconStar />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Full Account</h3>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>All features unlocked</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {FULL_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.2)" }}>
                    <IconCheck white />
                  </div>
                  <span className="text-sm text-white">{f}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(255,255,255,0.12)" }}>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.9)" }}>
                <IconStar /> Plus exclusive benefits:
              </p>
              {EXTRA_BENEFITS.map(b => (
                <p key={b} className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.8)" }}>• {b}</p>
              ))}
            </div>

            <button onClick={() => navigate("/register")}
              className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#fff", color: "#16a34a" }}>
              <span className="flex items-center justify-center gap-2">
                <IconUser />
                Create Free Account
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Quick Start ── */}
      <section className="max-w-4xl mx-auto px-4 pb-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>Quick &amp; Easy to Get Started</h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>No lengthy forms or complicated setup. Start using QuickBreak in seconds.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {QUICK_START.map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-2xl p-6 text-center" style={{ background: "#fff", border: "1px solid #e5e7eb" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "#f0fdf4" }}>
                <Icon />
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: "#111827" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="max-w-4xl mx-auto px-4 pb-14">
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Ready for More?</h2>
          <p className="text-sm mb-7 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.85)" }}>
            Create a free account to unlock saved stations, post reviews, and get personalised recommendations.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate("/register")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#fff", color: "#16a34a" }}>
              <IconUser />
              Create Free Account
            </button>
            <button onClick={handleContinueAsGuest} disabled={loading || alreadyActive}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
              </svg>
              {alreadyActive ? "Continue Browsing" : "Continue Browsing"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
