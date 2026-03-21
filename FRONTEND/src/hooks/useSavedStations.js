import { useState, useEffect, useCallback } from "react";
import savedStationApi from "../api/savedStationApi";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook for managing saved stations state.
 * Provides savedIds set, toggle function, and loading state.
 */
export function useSavedStations() {
  const { isLoggedIn } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load all saved station IDs on mount (only if logged in)
  useEffect(() => {
    if (!isLoggedIn) { setSavedIds(new Set()); return; }
    setLoading(true);
    savedStationApi.getAll()
      .then((list) => setSavedIds(new Set(list.map((s) => s.stationId))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const isSaved = useCallback((stationId) => savedIds.has(String(stationId)), [savedIds]);

  /**
   * Toggle save/unsave for a station.
   * @param {object} station - full station object from DB
   * @returns {{ action: 'saved'|'removed', message: string }}
   */
  const toggleSave = useCallback(async (station) => {
    const id = String(station._id || station.stationId);
    if (savedIds.has(id)) {
      // Optimistic remove
      setSavedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      try {
        await savedStationApi.remove(id);
        return { action: "removed", message: "Station removed from saved stations" };
      } catch {
        // Rollback
        setSavedIds((prev) => new Set([...prev, id]));
        return { action: "error", message: "Failed to remove station" };
      }
    } else {
      // Optimistic add
      setSavedIds((prev) => new Set([...prev, id]));
      try {
        const coords = station.location?.coordinates;
        await savedStationApi.save({
          stationId: id,
          name: station.name,
          brand: station.operator || "",
          motorway: station.motorway || "",
          address: station.address || "",
          distanceKm: station.distanceKm ?? null,
          amenities: station.facilities || [],
          note: "",
          coordinates: coords ? { lat: coords[1], lng: coords[0] } : { lat: null, lng: null },
          image: station.photoUrl || "",
        });
        return { action: "saved", message: "Station saved successfully" };
      } catch (err) {
        if (err?.response?.status === 409) {
          return { action: "saved", message: "Already saved" };
        }
        // Rollback
        setSavedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        return { action: "error", message: "Failed to save station" };
      }
    }
  }, [savedIds]);

  return { savedIds, isSaved, toggleSave, loading };
}
