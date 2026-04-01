import { useState, useEffect, useCallback } from 'react';

const useCurrentLocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watch = false
  } = options;

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

  const geolocationOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge
  };

  // Check if geolocation is supported
  const isSupported = 'geolocation' in navigator;

  // Success callback
  const onSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy } = position.coords;
    setLocation({
      lat: latitude,
      lng: longitude,
      accuracy,
      timestamp: position.timestamp
    });
    setError(null);
    setLoading(false);
    setPermission('granted');
  }, []);

  // Error callback
  const onError = useCallback((err) => {
    let errorMessage = 'Location access failed';
    let permissionStatus = 'denied';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        permissionStatus = 'denied';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        permissionStatus = 'granted'; // Permission was given but location unavailable
        break;
      case err.TIMEOUT:
        errorMessage = 'Location request timed out';
        permissionStatus = 'granted'; // Permission was given but timed out
        break;
      default:
        errorMessage = 'An unknown location error occurred';
        break;
    }

    setError({
      code: err.code,
      message: errorMessage
    });
    setLoading(false);
    setPermission(permissionStatus);
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      geolocationOptions
    );
  }, [onSuccess, onError, geolocationOptions, isSupported]);

  // Watch position (continuous updates)
  const [watchId, setWatchId] = useState(null);

  const startWatching = useCallback(() => {
    if (!isSupported || watchId) return;

    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      geolocationOptions
    );

    setWatchId(id);
  }, [onSuccess, onError, geolocationOptions, isSupported, watchId]);

  const stopWatching = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLoading(false);
    }
  }, [watchId]);

  // Auto-start watching if watch option is enabled
  useEffect(() => {
    if (watch) {
      startWatching();
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch, startWatching, watchId]);

  // Check permission status if available
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setPermission(result.state);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermission(result.state);
          });
        })
        .catch(() => {
          // Permissions API not supported, keep default 'prompt'
        });
    }
  }, []);

  // Retry function
  const retry = useCallback(() => {
    if (watch) {
      startWatching();
    } else {
      getCurrentLocation();
    }
  }, [watch, startWatching, getCurrentLocation]);

  return {
    location,
    error,
    loading,
    permission,
    isSupported,
    getCurrentLocation,
    startWatching,
    stopWatching,
    retry,
    // Helper methods
    isLocationAvailable: !!location,
    isPermissionGranted: permission === 'granted',
    isPermissionDenied: permission === 'denied'
  };
};

export default useCurrentLocation;