import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1a7a4a" />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
  );
}

const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#1a7a4a" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Trusted Reviews",
    desc: "Access verified reviews from real travellers",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#22a05e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    ),
    title: "AI-Powered Assistant",
    desc: "Get instant help from Bexxa, your AI companion",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#1a7a4a" strokeWidth="2"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#1a7a4a" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Community Driven",
    desc: "Join thousands of active users sharing experiences",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, isLoggedIn, continueAsGuest } = useAuth();

  const [form, setForm]             = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => { if (isLoggedIn) navigate("/"); }, [isLoggedIn, navigate]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#f0f4f0" }}>
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden flex shadow-lg"
        style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
      >
        {/* Left branding panel */}
        <div
          className="hidden md:flex flex-col justify-between w-[42%] p-10"
          style={{ background: "linear-gradient(160deg, #e8f5ee 0%, #f0f4f0 100%)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-8">
              <PinIcon />
              <span className="text-lg font-bold">
                <span style={{ color: "#1a7a4a" }}>Quick</span>
                <span style={{ color: "#1a1a1a" }}>Break</span>
              </span>
            </div>

            <p className="text-sm leading-relaxed mb-8" style={{ color: "#4b5563" }}>
              Your trusted companion for finding and reviewing motorway service stations across the UK
            </p>

            <div className="space-y-5">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(26,122,74,0.1)" }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{f.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs mt-8" style={{ color: "#4b5563" }}>
            Trusted by over <span style={{ color: "#1a7a4a" }}>45,000+</span> travellers across the UK
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex-1 p-8 md:p-10">
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "#4b5563" }}>Sign in to access your account</p>

          {error && (
            <div
              className="mt-4 rounded-lg px-3 py-2.5 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="qb-label">Email</label>
              <input
                name="email" type="email" value={form.email} onChange={onChange}
                placeholder="your.email@example.com" className="qb-input" required
              />
            </div>
            <div>
              <label className="qb-label">Password</label>
              <input
                name="password" type="password" value={form.password} onChange={onChange}
                placeholder="••••••••" className="qb-input" required minLength={6}
              />
            </div>

            {/* Remember me + Forgot password row */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#1a7a4a" }}
                />
                <span className="text-sm" style={{ color: "#4b5563" }}>Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm transition-colors hover:underline"
                style={{ color: "#1a7a4a", background: "none", border: "none", cursor: "pointer" }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="qb-btn-primary mt-2">
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "#e5e7eb" }} />
            <span className="text-xs" style={{ color: "#9ca3af" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#e5e7eb" }} />
          </div>

          <button onClick={handleGuest} className="qb-btn-secondary">
            Continue as Guest
          </button>
          <p className="text-xs text-center mt-2" style={{ color: "#9ca3af" }}>
            Browse stations and explore features without creating an account
          </p>

          <p className="text-sm text-center mt-5" style={{ color: "#4b5563" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#1a7a4a" }} className="font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
