import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QuickBreakLogo from "./QuickBreakLogo";

const SOCIAL_ICONS = [
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
];

const linkCls = "text-sm text-[#6b7280] hover:text-[#16a34a] transition-colors";

export default function Footer() {
  const { isLoggedIn, isGuest } = useAuth();

  if (!isLoggedIn && !isGuest) return null;

  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

          {/* Brand block */}
          <div>
            <Link to="/" className="inline-flex mb-3">
              <QuickBreakLogo size="sm" />
            </Link>
            <p className="text-sm leading-relaxed text-[#6b7280] mb-4">
              Helping drivers find, review, and navigate motorway service stations across the UK.
            </p>
            <div className="flex gap-2">
              {SOCIAL_ICONS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-[#6b7280] hover:text-[#16a34a] hover:border-[#16a34a] transition-colors"
                  style={{ background: "#fff" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d={s.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-sm font-semibold text-[#111827] mb-4">Navigation</p>
            <ul className="space-y-2.5">
              <li><Link to="/" className={linkCls}>Home</Link></li>
              <li><Link to="/nearby" className={linkCls}>Nearby Stations</Link></li>
              <li><Link to={isLoggedIn ? "/reports/create" : "/login"} className={linkCls}>Create Report</Link></li>
              <li><Link to="/login" className={linkCls}>Login / Register</Link></li>
              <li><Link to="/saved" className={linkCls}>Saved Stations</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <p className="text-sm font-semibold text-[#111827] mb-4">Features</p>
            <ul className="space-y-2.5">
              <li><Link to="/bexxa-assistant" className={linkCls}>Bexxa AI Assistant</Link></li>
              <li><Link to="/station-reviews" className={linkCls}>Station Reviews</Link></li>
              <li><Link to="/guest-access" className={linkCls}>Guest Access</Link></li>
              <li><Link to="/saved" className={linkCls}>Saved Stations</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-sm font-semibold text-[#111827] mb-4">Support</p>
            <ul className="space-y-2.5">
              <li><Link to="/help-center" className={linkCls}>Help Center</Link></li>
              <li><Link to="/contact" className={linkCls}>Contact</Link></li>
              <li><Link to="/privacy-policy" className={linkCls}>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className={linkCls}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#9ca3af]">© {year} QuickBreak. All rights reserved.</p>
          <p className="text-xs text-[#9ca3af]">Built for UK motorway travellers 🇬🇧</p>
        </div>
      </div>
    </footer>
  );
}
