// This page is not used in routing — StationDetails.jsx handles /stations/:id
// Kept as placeholder to avoid import errors
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Station() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#f0f4f0", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-sm" style={{ color: "#4b5563" }}>
          Redirecting...
        </p>
        <button
          onClick={() => navigate("/nearby")}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
        >
          Browse Stations
        </button>
      </div>
    </div>
  );
}
