import React from "react";

/**
 * Bookmark/save toggle button.
 * Props: saved (bool), onClick (fn), size (number, default 16)
 */
export default function SaveButton({ saved, onClick, size = 16, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
      title={saved ? "Remove from saved" : "Save station"}
      aria-label={saved ? "Remove from saved" : "Save station"}
      className={`flex items-center justify-center rounded-lg transition-colors ${className}`}
      style={{
        width: 30,
        height: 30,
        background: saved ? "rgba(22,163,74,0.1)" : "#f5f7f5",
        border: `1px solid ${saved ? "rgba(22,163,74,0.3)" : "#e5e7eb"}`,
        color: saved ? "#16a34a" : "#9ca3af",
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
        <path
          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
