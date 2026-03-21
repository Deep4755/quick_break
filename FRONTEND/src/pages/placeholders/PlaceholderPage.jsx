import React from "react";
import { useNavigate } from "react-router-dom";

// Generic placeholder page — pass title, subtitle, icon emoji
export default function PlaceholderPage({ title, subtitle, emoji = "🚧" }) {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#f0f4f0", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-5">{emoji}</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>{title}</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b7280" }}>
          {subtitle}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
