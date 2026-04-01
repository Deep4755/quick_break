import React from "react";
import { useNavigate } from "react-router-dom";

export default function StationCard({ station, onClick, selectedFacilities = [], onFacilityToggle }) {
  const navigate = useNavigate();

  const handleNavigate = (e) => {
    e.stopPropagation();
    navigate("/navigate", { state: { station, userLocation: null } });
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick && onClick(e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer text-left rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition p-5 shadow-xl w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{station.name}</h3>
          {station.operator && <div className="text-sm text-gray-300 mt-1">{station.operator}</div>}
        </div>
        {station.motorway && (
          <span className="text-xs text-white/60 rounded-full border border-white/10 px-2 py-1">{station.motorway}</span>
        )}
      </div>

      {station.address && (
        <p className="text-gray-300 mt-2 line-clamp-2">{station.address}</p>
      )}

      {(station.facilities || []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(station.facilities || []).slice(0, 5).map((f) => (
            <span
              key={f}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onFacilityToggle && onFacilityToggle(f);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onFacilityToggle && onFacilityToggle(f);
                }
              }}
              className={`text-xs rounded-full px-2 py-1 border ${selectedFacilities.includes(f) ? "bg-blue-500/60 text-white border-blue-400" : "text-white/80 bg-white/10 border-white/10"}`}
              aria-pressed={selectedFacilities.includes(f)}
            >
              {f}
            </span>
          ))}

          {(station.facilities || []).length > 5 && (
            <span className="text-xs text-white/50">+more</span>
          )}
        </div>
      )}

      <div className="mt-5 text-sm text-gray-300 flex items-center gap-3">
        <div>Click to open details →</div>
        <button
          type="button"
          onClick={handleNavigate}
          className="ml-auto px-3 py-1 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-white/10 text-sm"
          aria-label="Navigate to station"
        >
          Navigate
        </button>
      </div>

      {station.location?.coordinates && (
        <div className="mt-2 text-xs text-gray-400">{`Lat: ${Number(station.location.coordinates[1]).toFixed(5)}, Lng: ${Number(station.location.coordinates[0]).toFixed(5)}`}</div>
      )}
    </div>
  );
}
