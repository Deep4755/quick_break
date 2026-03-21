import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Show when a guest tries a locked feature.
 * Props: message (string), onClose (fn)
 */
export default function GuestRestrictionModal({ message, onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center"
        style={{ background: "#fff" }}
        onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "#fef3c7" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#f59e0b" strokeWidth="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h3 className="text-base font-bold mb-1" style={{ color: "#111827" }}>Account Required</h3>
        <p className="text-sm mb-5" style={{ color: "#6b7280" }}>
          {message || "This feature requires a free QuickBreak account."}
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onClose(); navigate("/register"); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}>
            Create Free Account
          </button>
          <button
            onClick={() => { onClose(); navigate("/login"); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151" }}>
            Login
          </button>
          <button onClick={onClose}
            className="text-xs mt-1 transition-colors"
            style={{ color: "#9ca3af" }}>
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
