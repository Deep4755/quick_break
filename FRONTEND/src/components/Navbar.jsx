import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QuickBreakLogo from "./QuickBreakLogo";
import MoreDropdown from "./MoreDropdown";

export default function Navbar() {
  const { isLoggedIn, isGuest, logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Always show navbar on guest-access page so users can navigate
  const isGuestAccessPage = location.pathname === "/guest-access";
  if (!isLoggedIn && !isGuest && !isGuestAccessPage) return null;

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 pb-0.5 ${
      isActive
        ? "text-[#16a34a] border-b-2 border-[#16a34a]"
        : "text-[#6b7280] hover:text-[#111827] border-b-2 border-transparent"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <NavLink to="/" className="flex items-center">
          <QuickBreakLogo />
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/" className={linkCls} end>Home</NavLink>
          <NavLink to="/nearby" className={linkCls}>Nearby</NavLink>
          <NavLink to={isLoggedIn ? "/reports/create" : "/login"} className={linkCls}>
            Create Report
          </NavLink>
          <NavLink to="/saved" className={linkCls}>Saved Stations</NavLink>
          <MoreDropdown />
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn && user?.name && (
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#16a34a" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: "#374151" }}>{user.name}</span>
            </div>
          )}
          {isGuest && (
            <span className="text-xs px-2 py-1 rounded-full border border-gray-200 text-[#6b7280]">
              Guest
            </span>
          )}
          {!isLoggedIn && !isGuest ? (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
              style={{ background: "#16a34a" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="white" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
              style={{ background: "#16a34a" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="white" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {isGuest ? "Login" : "Logout"}
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#6b7280] hover:text-[#111827]"
          onClick={() => setMobileOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            {mobileOpen
              ? <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              : <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          {[
            { to: "/", label: "Home", end: true },
            { to: "/nearby", label: "Nearby" },
            { to: isLoggedIn ? "/reports/create" : "/login", label: "Create Report" },
            { to: "/saved", label: "Saved Stations" },
            { to: "/bexxa-assistant", label: "Bexxa Assistant" },
            { to: "/help-center", label: "Help Center" },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center px-6 py-4 text-sm font-medium border-b border-gray-100 ${isActive ? "text-[#16a34a] bg-green-50" : "text-[#374151]"}`
              }
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => { handleLogout(); setMobileOpen(false); }}
            className="flex items-center w-full px-6 py-4 text-sm font-medium text-[#6b7280]"
          >
            {isGuest ? "Login" : "Logout"}
          </button>
        </div>
      )}
    </header>
  );
}
