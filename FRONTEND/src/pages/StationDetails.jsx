import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import stationApi from "../api/stationApi";
import Loading from "../components/Loading";

export default function StationDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getUserCoords = (timeoutMs = 3000) =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null);
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: timeoutMs }
      );
    });

  const handleNavigate = async () => {
    const coords = station?.location?.coordinates;
    if (!coords) return;
    const stationLat = Number(coords[1]);
    const stationLng = Number(coords[0]);

    try {
      const user = await getUserCoords(3000);
      if (user) {
        const origin = `${user.latitude},${user.longitude}`;
        const dest = `${stationLat},${stationLng}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const url = `https://www.google.com/maps/search/?api=1&query=${stationLat},${stationLng}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      const url = `https://www.google.com/maps/search/?api=1&query=${stationLat},${stationLng}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    stationApi
      .details(id)
      .then((data) => setStation(data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load station"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-8">
        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-white">{station?.name || "—"}</h2>
            {station?.address && <p className="text-gray-300 mt-2">{station.address}</p>}
            {station?.operator && <div className="mt-1 text-sm text-gray-300">Operator: {station.operator}</div>}
            {station?.location?.coordinates && (
              <div className="mt-1 text-xs text-gray-400">{`Lat: ${Number(station.location.coordinates[1]).toFixed(5)}, Lng: ${Number(station.location.coordinates[0]).toFixed(5)}`}</div>
            )}

            <div className="mt-6 space-y-4">
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
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/nearby?facilities=${encodeURIComponent(f)}`)}
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

              <div className="flex gap-3 items-center">
                <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-white/10">Back</button>
                <button onClick={() => navigate('/reports/create', { state: { stationId: id } })} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90">Create Report</button>
                <button onClick={handleNavigate} className="ml-auto px-4 py-2 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-white/10">Navigate</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}