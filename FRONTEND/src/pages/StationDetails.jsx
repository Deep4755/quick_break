import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import stationApi from "../api/stationApi";
import { useAuth } from "../context/AuthContext";
import TomTomMap from "../components/TomTomMap";

function Loading() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "#e5e7eb", borderTopColor: "#1a7a4a" }} />
    </div>
  );
}

export default function StationDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isLoggedIn } = useAuth();

  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // Get user location for map
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently ignore — map still works without it
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  const handleNavigate = () => {
    navigate("/navigate", { state: { station, userLocation } });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    stationApi.details(id)
      .then((data) => setStation(data))
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setError("Station not found. It may have been removed.");
        } else {
          setError(err?.response?.data?.message || "Failed to load station details.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ background: "#f0f4f0" }}>
        <Loading />
      </div>
    );
  }

  return (
    <div style={{ background: "#f0f4f0" }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {error ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
            <p className="text-4xl mb-3">📍</p>
            <p className="text-lg font-semibold mb-1" style={{ color: "#1a1a1a" }}>
              {error.includes("not found") ? "Station not found" : "Something went wrong"}
            </p>
            <p className="text-sm mb-5" style={{ color: "#4b5563" }}>{error}</p>
            <button onClick={() => navigate("/nearby")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}>
              Back to Nearby
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 mb-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>{station?.name}</h1>
                  {station?.operator && (
                    <p className="text-sm mt-1 font-medium" style={{ color: "#1a7a4a" }}>{station.operator}</p>
                  )}
                  {station?.address && (
                    <p className="text-sm mt-2" style={{ color: "#4b5563" }}>{station.address}</p>
                  )}
                </div>
                {station?.motorway && (
                  <span className="text-sm px-3 py-1 rounded-full flex-shrink-0" style={{ background: "rgba(26,122,74,0.1)", color: "#1a7a4a", border: "1px solid rgba(26,122,74,0.2)" }}>
                    {station.motorway}
                  </span>
                )}
              </div>
              {(station?.avgCleanliness > 0 || station?.lastStatus?.parkingStatus) && (
                <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
                  {station.avgCleanliness > 0 && (
                    <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#f5f7f5", color: "#4b5563" }}>
                      Avg Cleanliness: <span className="font-semibold" style={{ color: "#1a1a1a" }}>{station.avgCleanliness}/5</span>
                    </div>
                  )}
                  {station.lastStatus?.parkingStatus && (
                    <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#f5f7f5", color: "#4b5563" }}>
                      Parking: <span className="font-semibold" style={{ color: "#1a1a1a" }}>{station.lastStatus.parkingStatus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map */}
            {station?.location?.coordinates && (() => {
              const [lng, lat] = station.location.coordinates;
              return (
                <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid #e5e7eb" }}>
                  <TomTomMap
                    center={{ lat, lng }}
                    zoom={14}
                    stations={[station]}
                    userLocation={userLocation}
                    height="300px"
                  />
                </div>
              );
            })()}

            {(station?.facilities || []).length > 0 && (              <div className="rounded-2xl p-5 mb-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a1a1a" }}>Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {station.facilities.map((f) => (
                    <span key={f} className="text-xs px-3 py-1 rounded-full capitalize" style={{ background: "rgba(26,122,74,0.08)", color: "#1a7a4a", border: "1px solid rgba(26,122,74,0.15)" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#4b5563" }}>
                ← Back
              </button>
              {isLoggedIn && (
                <button
                  onClick={() => navigate("/reports/create", { state: { stationId: id } })}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #1a7a4a, #22a05e)" }}
                >
                  Create Report
                </button>
              )}
              <button onClick={handleNavigate} className="ml-auto px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#4b5563" }}>
                Navigate →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
