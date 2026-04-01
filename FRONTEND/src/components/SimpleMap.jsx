import React from 'react';

const SimpleMap = ({ 
  center = { lat: 51.5074, lng: -0.1278 }, 
  stations = [],
  userLocation = null,
  className = "w-full h-96"
}) => {
  return (
    <div className={className + ' bg-gray-100 flex items-center justify-center border border-gray-200 rounded-lg'}>
      <div className="text-center p-6">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Interactive Map</p>
        <p className="text-sm text-gray-500 mb-4">
          {userLocation 
            ? `Centered on your location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
            : `Centered on ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`
          }
        </p>
        <p className="text-sm text-gray-500">
          {stations.length} station{stations.length !== 1 ? 's' : ''} would be shown on the map
        </p>
        <div className="mt-4 text-xs text-gray-400">
          TomTom Map will load here when ready
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;