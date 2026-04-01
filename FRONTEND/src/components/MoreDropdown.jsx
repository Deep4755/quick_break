import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const GROUPS = [
  {
    label: "FEATURES",
    items: [
      { label: "Bexxa Assistant", to: "/bexxa-assistant", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
      { label: "Station Reviews",    to: "/station-reviews", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: "Guest Access",       to: "/guest-access",    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { label: "Help Center",      to: "/help-center",      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg> },
      { label: "Contact",          to: "/contact",          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/></svg> },
      { label: "Privacy Policy",   to: "/privacy-policy",   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
      { label: "Terms of Service", to: "/terms-of-service", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },
];

export default function MoreDropdown() {
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const navigate          = useNavigate();
  const location          = useLocation();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isAnyActive = GROUPS.flatMap(g => g.items).some(i => location.pathname === i.to);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-sm font-medium pb-0.5 transition-colors duration-150 border-b-2 ${
          isAnyActive || open
            ? "text-[#16a34a] border-[#16a34a]"
            : "text-[#6b7280] hover:text-[#111827] border-transparent"
        }`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        More
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          className="transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-xl shadow-xl overflow-hidden z-50"
          style={{ background: "#fff", border: "1px solid #e5e7eb", minWidth: 220 }}
          role="menu"
        >
          {GROUPS.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div style={{ borderTop: "1px solid #f3f4f6" }}/>}
              <p className="px-4 pt-3 pb-1 text-xs font-bold tracking-widest" style={{ color: "#9ca3af" }}>
                {group.label}
              </p>
              {group.items.map(item => {
                const isActive = location.pathname === item.to;
                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                    style={{
                      color: isActive ? "#16a34a" : "#374151",
                      background: isActive ? "#f0fdf4" : "transparent",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ color: isActive ? "#16a34a" : "#9ca3af" }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ borderTop: "1px solid #f3f4f6", height: 8 }}/>
        </div>
      )}
    </div>
  );
}
