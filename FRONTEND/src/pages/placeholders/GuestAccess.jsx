import React from "react";
import { useNavigate } from "react-router-dom";

export default function GuestAccess() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#f0f4f0", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-5">👤</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>Guest Access</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b7280" }}>
          You can explore QuickBreak without creating an account. Browse nearby stations, view details, and use the map — no sign-up required.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate("/nearby")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #16a34a, #22a05e)" }}
          >
            Browse as Guest
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#374151" }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
