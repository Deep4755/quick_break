import React from "react";
import { useNavigate } from "react-router-dom";

export default function StationDetails({ station }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <h3 className="text-lg font-semibold text-white">Facilities</h3>
      <div className="mt-2">
        {(station?.facilities || []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(station?.facilities || []).map((f) => (
              <span
                key={f}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/nearby?facilities=${encodeURIComponent(f)}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/nearby?facilities=${encodeURIComponent(f)}`)}
                className="text-xs text-white/80 rounded-full bg-white/10 border border-white/10 px-2 py-1 cursor-pointer"
              >
                {f}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No facilities information available.</p>
        )}
      </div>
    </div>
  );
}
