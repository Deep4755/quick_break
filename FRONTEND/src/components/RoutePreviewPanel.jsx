import React, { useState, useEffect } from 'react';
import mapApi from '../api/mapApi';

const RoutePreviewPanel = ({ 
  userLocation, 
  station, 
  onClose, 
  onNavigateExternal 
}) => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLocation || !station?.location?.coordinates) return;

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        const [toLng, toLat] = station.location.coordinates;
        const routeData = await mapApi.getRoute(
          userLocation.lat,
          userLocation.lng,
          toLat,
          toLng
        );

        setRoute(routeData);
      } catch (err) {
        console.error('Route fetch error:', err);
        setError('Failed to calculate route');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [userLocation, station]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters) => {
    const km = meters / 1000;
    if (km < 1) {
      return `${Math.round(meters)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const handleExternalNavigation = () => {
    if (!station?.location?.coordinates || !userLocation) return;

    const [lng, lat] = station.location.coordinates;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}&travelmode=driving`;
    
    window.open(googleMapsUrl, '_blank', 'noopener');
    
    if (onNavigateExternal) {
      onNavigateExternal(station);
    }
  };

  if (!station) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Route Preview</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {/* Station Info */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-1">{station.name}</h4>
            {station.operator && (
              <p className="text-sm text-gray-600 mb-1">{station.operator}</p>
            )}
            {station.motorway && (
              <p className="text-sm text-gray-600 mb-2">{station.motorway}</p>
            )}
            {station.address && (
              <p className="text-sm text-gray-500">{station.address}</p>
            )}
          </div>

          {/* Route Information */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Calculating route...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {route && (
            <div className="space-y-4">
              {/* Route Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-blue-900">Route Summary</h5>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Distance</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {formatDistance(route.distanceMeters)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Duration</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {formatDuration(route.durationSeconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Route Steps (if available) */}
              {route.legs?.[0]?.steps && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Directions</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {route.legs[0].steps.slice(0, 5).map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {step.maneuver?.instruction || 'Continue straight'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistance(step.distance)} • {formatDuration(step.duration)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {route.legs[0].steps.length > 5 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        +{route.legs[0].steps.length - 5} more steps
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleExternalNavigation}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Navigate in Maps
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePreviewPanel;