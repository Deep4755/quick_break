import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1a7a4a"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  );
}

const LINKS = {
  Explore: [
    { label: "Home",            to: "/" },
    { label: "Nearby Stations", to: "/nearby" },
    { label: "Create Report",   to: "/reports/create", authRequired: true },
  ],
  Account: [
    { label: "Login",    to: "/login" },
    { label: "Register", to: "/register" },
  ],
  Legal: [
    { label: "Privacy Policy",  to: "#" },
    { label: "Terms of Service",to: "#" },
    { label: "Cookie Policy",   to: "#" },
  ],
};

export default function Footer() {
  const { isLoggedIn, isGuest } = useAuth();
  const navigate = useNavigate();

  // Only show when user is authenticated or guest (same as Navbar)
  if (!isLoggedIn && !isGuest) return null;

  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#ffffff", borderTop: "1px solid #e5e7eb" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Top row: brand + links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PinIcon />
              <span className="text-base font-bold">
                <span style={{ color: "#1a7a4a" }}>Quick</span>
                <span style={{ color: "#1a1a1a" }}>Break</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
              Your trusted companion for finding and reviewing motorway service stations across the UK.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-4">
              {[
                {
                  label: "Twitter",
                  path: "M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9 9 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03C7.69 5.37 4.07 3.58 1.64.9a4.52 4.52 0 0 0-.61 2.27c0 1.57.8 2.95 2.01 3.76a4.5 4.5 0 0 1-2.05-.57v.06c0 2.19 1.56 4.02 3.63 4.43a4.54 4.54 0 0 1-2.04.08 4.53 4.53 0 0 0 4.22 3.14A9.07 9.07 0 0 1 0 15.54 12.8 12.8 0 0 0 6.92 17.5c8.3 0 12.84-6.88 12.84-12.84 0-.2 0-.39-.01-.58A9.17 9.17 0 0 0 23 3z",
                },
                {
                  label: "GitHub",
                  path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
                },
                {
                  label: "LinkedIn",
                  path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "#f5f7f5", border: "1px solid #e5e7eb", color: "#4b5563" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e8f5ee"; e.currentTarget.style.color = "#1a7a4a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f5f7f5"; e.currentTarget.style.color = "#4b5563"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d={s.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Explore links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9ca3af" }}>Explore</p>
            <ul className="space-y-2.5">
              {LINKS.Explore.map((l) => (
                <li key={l.label}>
                  <NavLink
                    to={l.authRequired && !isLoggedIn ? "/login" : l.to}
                    className="text-sm transition-colors hover:underline"
                    style={({ isActive }) => ({
                      color: isActive ? "#1a7a4a" : "#4b5563",
                      fontWeight: isActive ? 600 : 400,
                    })}
                    end={l.to === "/"}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9ca3af" }}>Account</p>
            <ul className="space-y-2.5">
              {isLoggedIn ? (
                <li>
                  <button
                    onClick={() => { /* logout handled in Navbar */ navigate("/login"); }}
                    className="text-sm transition-colors hover:underline text-left"
                    style={{ color: "#4b5563", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    My Account
                  </button>
                </li>
              ) : (
                LINKS.Account.map((l) => (
                  <li key={l.label}>
                    <NavLink
                      to={l.to}
                      className="text-sm transition-colors hover:underline"
                      style={({ isActive }) => ({
                        color: isActive ? "#1a7a4a" : "#4b5563",
                        fontWeight: isActive ? 600 : 400,
                      })}
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9ca3af" }}>Legal</p>
            <ul className="space-y-2.5">
              {LINKS.Legal.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.to}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "#4b5563" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#1a7a4a"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#4b5563"}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            © {year} QuickBreak. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Built for UK motorway travellers 🇬🇧
          </p>
        </div>
      </div>
    </footer>
  );
}
