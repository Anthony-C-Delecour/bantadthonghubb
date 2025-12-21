import { useState, useEffect, useCallback, useRef } from "react";

interface GeolocationState {
  position: { lat: number; lng: number } | null;
  error: string | null;
  isTracking: boolean;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  onPositionChange?: (position: { lat: number; lng: number }) => void;
}

// Bantadthong area bounds
const BANTADTHONG_CENTER = { lat: 13.7420, lng: 100.5272 };

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    maximumAge = 5000,
    timeout = 10000,
    onPositionChange,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isTracking: false,
    accuracy: null,
    heading: null,
    speed: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  
  // Keep callback ref updated
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy, heading, speed } = pos.coords;
    
    // Check if within Bangkok area
    const isInBangkok = latitude > 13.5 && latitude < 14.0 && longitude > 100.3 && longitude < 100.8;
    
    const position = isInBangkok 
      ? { lat: latitude, lng: longitude }
      : BANTADTHONG_CENTER;

    setState((prev) => ({
      ...prev,
      position,
      accuracy,
      heading: heading || null,
      speed: speed || null,
      error: isInBangkok ? null : "Location outside Bangkok area, using Bantadthong center",
    }));

    if (onPositionChangeRef.current) {
      onPositionChangeRef.current(position);
    }
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "Unknown error";
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      position: prev.position || BANTADTHONG_CENTER,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        position: BANTADTHONG_CENTER,
      }));
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      maximumAge,
      timeout,
    });

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        maximumAge,
        timeout,
      }
    );

    setState((prev) => ({ ...prev, isTracking: true }));
  }, [handleSuccess, handleError, enableHighAccuracy, maximumAge, timeout]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation not supported",
        position: BANTADTHONG_CENTER,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      maximumAge: 0, // Force fresh position
      timeout,
    });
  }, [handleSuccess, handleError, enableHighAccuracy, timeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    requestPosition,
    defaultPosition: BANTADTHONG_CENTER,
  };
}
