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

const panelFeatures = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#1a7a4a" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Secure & Private",
    desc: "Your data is encrypted and protected",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#22a05e" strokeWidth="2"/>
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke="#22a05e" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Earn Rewards",
    desc: "Get points for every review you share",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#1a7a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="16 7 22 7 22 13" stroke="#1a7a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Personalised Experience",
    desc: "Save favourites and track your journeys",
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, isLoggedIn, continueAsGuest } = useAuth();

  const [form, setForm]           = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => { if (isLoggedIn) navigate("/"); }, [isLoggedIn, navigate]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreedTerms) { setError("Please agree to the Terms of Service to continue."); return; }
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  const handleGuest = () => { continueAsGuest(); navigate("/"); };

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
            <div className="flex items-center gap-2 mb-6">
              <PinIcon />
              <span className="text-lg font-bold">
                <span style={{ color: "#1a7a4a" }}>Quick</span>
                <span style={{ color: "#1a1a1a" }}>Break</span>
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1a1a1a" }}>Join our community</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#4b5563" }}>
              Create your account and start sharing your motorway service station experiences
            </p>
            <div className="space-y-5">
              {panelFeatures.map((f) => (
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
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Create account</h1>
          <p className="text-sm mt-1" style={{ color: "#4b5563" }}>Join QuickBreak in less than a minute</p>

          {error && (
            <div
              className="mt-4 rounded-lg px-3 py-2.5 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="qb-label">Name</label>
              <input name="name" value={form.name} onChange={onChange} placeholder="Enter your full name" className="qb-input" required />
            </div>
            <div>
              <label className="qb-label">Email</label>
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="your.email@example.com" className="qb-input" required />
            </div>
            <div>
              <label className="qb-label">Password</label>
              <input name="password" type="password" value={form.password} onChange={onChange} placeholder="••••••••" className="qb-input" required minLength={6} />
            </div>
            <div>
              <label className="qb-label">Confirm Password</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Repeat password" className="qb-input" required minLength={6} />
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded flex-shrink-0 cursor-pointer"
                style={{ accentColor: "#1a7a4a" }}
              />
              <span className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
                I agree to the{" "}
                <button
                  type="button"
                  className="hover:underline"
                  style={{ color: "#1a7a4a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Terms of Service
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  className="hover:underline"
                  style={{ color: "#1a7a4a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Privacy Policy
                </button>
              </span>
            </label>

            <button type="submit" disabled={loading} className="qb-btn-primary mt-1">
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "#e5e7eb" }} />
            <span className="text-xs" style={{ color: "#9ca3af" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#e5e7eb" }} />
          </div>

          <button onClick={handleGuest} className="qb-btn-secondary">Continue as Guest</button>
          <p className="text-xs text-center mt-2" style={{ color: "#9ca3af" }}>You can create an account later</p>

          <p className="text-sm text-center mt-5" style={{ color: "#4b5563" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#1a7a4a" }} className="font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
