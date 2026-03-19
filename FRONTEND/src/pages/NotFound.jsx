import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center px-4 py-20" style={{ background: "#f0f4f0" }}>
      <div className="text-center">
        <p className="text-7xl font-extrabold mb-4" style={{ color: "#e5e7eb" }}>404</p>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#1a1a1a" }}>Page not found</h1>
        <p className="text-sm mb-8" style={{ color: "#4b5563" }}>We couldn't find the page you're looking for.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate("/")} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}>
            Go Home
          </button>
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#4b5563" }}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
