import React, { useEffect } from "react";

/**
 * Simple toast notification.
 * Props: message (string), type ('success'|'error'), onClose (fn)
 */
export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
      style={{
        transform: "translateX(-50%)",
        background: isSuccess ? "#16a34a" : "#dc2626",
        color: "#fff",
        minWidth: 220,
        animation: "fadeInUp 0.2s ease",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        {isSuccess
          ? <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        }
      </svg>
      {message}
    </div>
  );
}
