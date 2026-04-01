import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import stationApi from "../api/stationApi";
import savedStationApi from "../api/savedStationApi";
import { useAuth } from "../context/AuthContext";
import GuestRestrictionModal from "../components/GuestRestrictionModal";
import TomTomMap from "../components/TomTomMap";
import RoutePreviewPanel from "../components/RoutePreviewPanel";
import LocationSearchBar from "../components/LocationSearchBar";
import useCurrentLocation from "../hooks/useCurrentLocation";

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function openMaps(station, userCoords) {
  const coords = station.location?.coordinates;
  if (!coords) return;
  const [lng, lat] = coords;
  if (userCoords) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${lat},${lng}&travelmode=driving`,
      "_blank", "noopener"
    );
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener");
  }
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2"
      style={{
        background: type === "success" ? "#16a34a" : "#dc2626",
        color: "#fff",
        minWidth: 220,
      }}
    >
      {type === "success"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
      }
      {message}
    </div>
  );
}

function BookmarkIcon({ filled, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function StationCard({ station, userCoords, isSaved, onToggleSave, onViewDetails, onShowRoute, selected, cardRef }) {
  const distance = userCoords && station.location?.coordinates
    ? calcDistanceKm(userCoords.lat, userCoords.lng, station.location.coordinates[1], station.location.coordinates[0])
    : station.distanceKm || null;

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-xl border p-5 hover:shadow-md transition-all duration-200"
      style={{ borderColor: selected ? "#1a7a4a" : "#e5e7eb", boxShadow: selected ? "0 0 0 2px rgba(26,122,74,0.25)" : undefined }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{station.name}</h3>
          {station.operator && (
            <p className="text-gray-600 text-sm mb-1">{station.operator}</p>
          )}
          {station.motorway && (
            <p className="text-blue-600 text-sm font-medium">{station.motorway}</p>
          )}
        </div>
        <button
          onClick={() => onToggleSave(station)}
          className={`p-2 rounded-full transition-colors ${
            isSaved ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          }`}
        >
          <BookmarkIcon filled={isSaved} />
        </button>
      </div>

      {distance && (
        <p className="text-blue-600 text-sm font-medium mb-3">{distance.toFixed(1)} km away</p>
      )}

      {station.facilities?.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {station.facilities.slice(0, 4).map((facility, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                {facility}
              </span>
            ))}
            {station.facilities.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{station.facilities.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(station)}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onShowRoute(station)}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Navigate
        </button>
      </div>
    </div>
  );
}

export default function Nearby() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  // Location state
  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
    permission,
    getCurrentLocation,
    retry: retryLocation,
    isLocationAvailable,
    isPermissionDenied
  } = useCurrentLocation();

  // Map and search state
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 }); // Default to London
  const [searchedLocation, setSearchedLocation] = useState(null);

  // Station data state
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(25);

  // UI state
  const [viewMode, setViewMode] = useState("grid");
  const [savedStations, setSavedStations] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [guestModal, setGuestModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(null);
  const cardRefs = useRef({});

  // Determine effective location (user location or searched location)
  const effectiveLocation = searchedLocation || userLocation;

  // Update map center when location changes
  useEffect(() => {
    if (effectiveLocation) {
      setMapCenter({ lat: effectiveLocation.lat, lng: effectiveLocation.lng });
    }
  }, [effectiveLocation]);

  // Fetch nearby stations
  const fetchNearbyStations = useCallback(async (coords, radiusKm) => {
    if (!coords) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`[Nearby] Fetching stations — coords:`, coords, `radius: ${radiusKm}km`);
      const response = await stationApi.nearby(coords.lng, coords.lat, radiusKm);
      const list = Array.isArray(response) ? response : [];
      console.log(`[Nearby] Received ${list.length} station(s)`);

      // Backend already attaches distanceKm — recalculate only if missing
      const stationsWithDistance = list.map(station => {
        if (station.distanceKm != null) return station;
        if (station.location?.coordinates) {
          const [lng, lat] = station.location.coordinates;
          return { ...station, distanceKm: calcDistanceKm(coords.lat, coords.lng, lat, lng) };
        }
        return station;
      }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

      setStations(stationsWithDistance);
      // Empty array is valid — UI handles the "no stations" state, not an error
    } catch (err) {
      console.error("[Nearby] Failed to fetch stations:", err.message);
      console.error("[Nearby] Details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      if (err.response?.status === 400) {
        setError("Invalid location. Please try a different area.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (!err.response) {
        // No response = connection refused / network down
        setError("Cannot reach the server. Make sure the backend is running.");
      } else {
        setError("Failed to load nearby stations. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch saved stations status
  const fetchSavedStatus = useCallback(async (stationList) => {
    if (!user || isGuest || !stationList.length) return;

    try {
      const stationIds = stationList.map(s => s._id).filter(Boolean);
      if (stationIds.length === 0) return;

      const savedMap = await savedStationApi.checkBulk(stationIds);
      setSavedStations(new Set(
        Object.entries(savedMap)
          .filter(([_, isSaved]) => isSaved)
          .map(([id, _]) => id)
      ));
    } catch (err) {
      console.error("Failed to fetch saved status:", err);
    }
  }, [user, isGuest]);

  // Load stations when location or radius changes
  useEffect(() => {
    if (effectiveLocation) {
      fetchNearbyStations(effectiveLocation, radius);
    }
  }, [effectiveLocation, radius, fetchNearbyStations]);

  // Load saved status when stations change
  useEffect(() => {
    fetchSavedStatus(stations);
  }, [stations, fetchSavedStatus]);

  // Auto-get location on mount
  useEffect(() => {
    if (!userLocation && !locationLoading && !locationError) {
      getCurrentLocation();
    }
  }, [userLocation, locationLoading, locationError, getCurrentLocation]);

  // Handle location search
  const handleLocationSearch = (location) => {
    setSearchedLocation(location);
    setMapCenter({ lat: location.lat, lng: location.lng });
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    setSearchedLocation(null);
    if (userLocation) {
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
    } else {
      getCurrentLocation();
    }
  };

  // Handle station actions
  const handleToggleSave = async (station) => {
    if (isGuest) {
      setGuestModal(true);
      return;
    }

    const stationId = station._id;
    const wasSaved = savedStations.has(stationId);

    // Optimistic update
    const newSavedStations = new Set(savedStations);
    if (wasSaved) {
      newSavedStations.delete(stationId);
    } else {
      newSavedStations.add(stationId);
    }
    setSavedStations(newSavedStations);

    try {
      if (wasSaved) {
        await savedStationApi.remove(stationId);
        setToast({ message: "Station removed from saved", type: "success" });
      } else {
        const coords = station.location?.coordinates;
        await savedStationApi.save({
          stationId,
          name: station.name,
          brand: station.operator || "",
          motorway: station.motorway || "",
          address: station.address || "",
          distanceKm: station.distanceKm || null,
          amenities: station.facilities || [],
          coordinates: coords ? { lat: coords[1], lng: coords[0] } : { lat: null, lng: null },
        });
        setToast({ message: "Station saved successfully", type: "success" });
      }
    } catch (err) {
      // Revert optimistic update
      setSavedStations(savedStations);
      console.error("Save/unsave error:", err);
      setToast({ 
        message: wasSaved ? "Failed to remove station" : "Failed to save station", 
        type: "error" 
      });
    }
  };

  const handleViewDetails = (station) => {
    navigate(`/stations/${station._id}`);
  };

  const handleShowRoute = (station) => {
    navigate("/navigate", { state: { station, userLocation: effectiveLocation } });
  };

  // Handle map station interactions
  const handleStationClick = (station, action) => {
    if (action === 'details') {
      handleViewDetails(station);
    } else if (action === 'route') {
      handleShowRoute(station);
    }
  };

  return (
    <div className="min-h-screen" style={{ background:"#f0f4f0" }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color:"#1a1a1a" }}>Nearby Stations</h1>
          <p className="text-sm" style={{ color:"#4b5563" }}>Find motorway service stations near your current location</p>
        </div>

        {/* Location Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Row 1: search + location button */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <LocationSearchBar
                onLocationSelect={handleLocationSearch}
                placeholder="Search location (e.g., Iver, Slough)"
              />
            </div>
            <button
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors flex-shrink-0"
              style={{ background:"#1a73e8" }}
            >
              {locationLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              <span className="hidden sm:inline">Use Current Location</span>
              <span className="sm:hidden">Locate</span>
            </button>
          </div>

          {/* Row 2: radius + view toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Radius:</label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Location Status */}
          {isPermissionDenied && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Location access denied</p>
                  <p className="text-yellow-700 text-xs">Use the search bar above to find stations near a specific location</p>
                </div>
              </div>
            </div>
          )}

          {locationError && !isPermissionDenied && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-800 text-sm">{locationError.message}</p>
                </div>
                <button
                  onClick={retryLocation}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {effectiveLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-green-800 text-sm">
                  {searchedLocation 
                    ? `Showing stations near ${searchedLocation.name}`
                    : `Using your current location (${effectiveLocation.lat.toFixed(4)}, ${effectiveLocation.lng.toFixed(4)})`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Map View</h2>
          <TomTomMap
            center={mapCenter}
            stations={stations}
            userLocation={effectiveLocation}
            selectedStationId={selectedStationId}
            onStationClick={handleStationClick}
            onNavigate={(station) => navigate("/navigate", { state: { station, userLocation: effectiveLocation } })}
            onMarkerClick={(station) => {
              setSelectedStationId(station._id);
              const el = cardRefs.current[station._id];
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            height="280px"
          />
        </div>

        {/* Stations Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Nearby Stations {stations.length > 0 && `(${stations.length})`}
            </h2>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading stations...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">{error}</p>
              <button
                onClick={() => effectiveLocation && fetchNearbyStations(effectiveLocation, radius)}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && stations.length === 0 && effectiveLocation && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No stations found</p>
              <p className="text-gray-500 text-sm">Try increasing the search radius or searching a different location</p>
            </div>
          )}

          {!loading && !error && !effectiveLocation && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Location needed</p>
              <p className="text-gray-500 text-sm">Allow location access or search for a location to find nearby stations</p>
            </div>
          )}

          {!loading && !error && stations.length > 0 && (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }>
              {stations.map((station) => (
                <StationCard
                  key={station._id}
                  station={station}
                  userCoords={effectiveLocation}
                  isSaved={savedStations.has(station._id)}
                  onToggleSave={handleToggleSave}
                  onViewDetails={handleViewDetails}
                  onShowRoute={handleShowRoute}
                  selected={selectedStationId === station._id}
                  cardRef={el => { cardRefs.current[station._id] = el; }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Route Preview Modal */}
      {showRoutePreview && selectedStation && (
        <RoutePreviewPanel
          userLocation={effectiveLocation}
          station={selectedStation}
          onClose={() => {
            setShowRoutePreview(false);
            setSelectedStation(null);
          }}
          onNavigateExternal={(station) => {
            openMaps(station, effectiveLocation);
          }}
        />
      )}

      {/* Guest Restriction Modal */}
      {guestModal && (
        <GuestRestrictionModal onClose={() => setGuestModal(false)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
