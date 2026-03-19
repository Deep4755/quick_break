import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="#1a7a4a"
      />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
  );
}

export default function Navbar() {
  const { isLoggedIn, isGuest, logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isLoggedIn && !isGuest) return null;

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive ? "text-[#1a1a1a]" : "text-[#4b5563] hover:text-[#1a1a1a]"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: "#ffffff", borderColor: "#e5e7eb" }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <PinIcon />
          <span className="text-base font-bold">
            <span style={{ color: "#1a7a4a" }}>Quick</span>
            <span style={{ color: "#1a1a1a" }}>Break</span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/" className={linkCls} end>Home</NavLink>
          <NavLink to="/nearby" className={linkCls}>Nearby</NavLink>
          <NavLink
            to={isLoggedIn ? "/reports/create" : "/login"}
            className={linkCls}
          >
            Create Report
          </NavLink>
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isGuest && (
            <span className="text-xs px-2 py-1 rounded-full border text-[#4b5563]" style={{ borderColor: "#e5e7eb" }}>
              Guest
            </span>
          )}
          {isLoggedIn && user?.name && (
            <span className="text-sm text-[#4b5563]">{user.name}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium px-4 py-1.5 rounded-lg border text-[#4b5563] hover:text-[#1a1a1a] transition-colors"
            style={{ borderColor: "#e5e7eb", background: "transparent" }}
          >
            {isGuest ? "Sign In" : "Logout"}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#4b5563] hover:text-[#1a1a1a]"
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
        <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ background: "#ffffff", borderColor: "#e5e7eb" }}>
          <NavLink to="/" className="block text-sm text-[#4b5563] hover:text-[#1a1a1a]" onClick={() => setMobileOpen(false)} end>Home</NavLink>
          <NavLink to="/nearby" className="block text-sm text-[#4b5563] hover:text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Nearby</NavLink>
          <NavLink
            to={isLoggedIn ? "/reports/create" : "/login"}
            className="block text-sm text-[#4b5563] hover:text-[#1a1a1a]"
            onClick={() => setMobileOpen(false)}
          >
            Create Report
          </NavLink>
          <button onClick={handleLogout} className="block text-sm text-[#4b5563] hover:text-[#1a1a1a]">
            {isGuest ? "Sign In" : "Logout"}
          </button>
        </div>
      )}
    </header>
  );
}
