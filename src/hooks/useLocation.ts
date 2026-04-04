"use client";

import { useState, useEffect } from "react";
import { isUserInKerala } from "@/utils/geofence";

interface LocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  isWithinKerala: boolean | null;
  refreshLocation: () => void;
}

export const useLocation = (): LocationState => {
  const [location, setLocation] = useState<Omit<LocationState, 'refreshLocation' | 'isWithinKerala'>>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const getLocation = () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Your browser does not support location access.",
        loading: false,
      }));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const newState = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
        error: null,
        loading: false,
      };
      setLocation(newState);
      // Persist for next session/fallback
      try {
        localStorage.setItem('nattufeed_last_lat', latitude.toString());
        localStorage.setItem('nattufeed_last_lng', longitude.toString());
      } catch (e) {
        console.error("Failed to cache location:", e);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      // If high accuracy failed/timed out, try one more time with lower accuracy
      if (options.enableHighAccuracy) {
        console.warn("High accuracy location failed, retrying with low accuracy...");
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (lowResError) => {
            let errorMessage = "Location access failed. Please enable GPS.";
            // If we have cached location, don't treat it as a hard error
            const cachedLat = localStorage.getItem('nattufeed_last_lat');
            if (cachedLat) {
              setLocation(prev => ({ ...prev, loading: false, error: null }));
              return;
            }

            if (lowResError.code === lowResError.PERMISSION_DENIED) {
              errorMessage = "Location access is required to show your local feed.";
            }
            setLocation((prev) => ({
              ...prev,
              error: errorMessage,
              loading: false,
            }));
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
      }
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
  };

  useEffect(() => {
    // Try to load from cache first for immediate (non-perfect) UI
    try {
      const cachedLat = localStorage.getItem('nattufeed_last_lat');
      const cachedLng = localStorage.getItem('nattufeed_last_lng');
      if (cachedLat && cachedLng) {
        setLocation(prev => ({
          ...prev,
          lat: parseFloat(cachedLat),
          lng: parseFloat(cachedLng),
          accuracy: 5000, // Assume low accuracy for cache
          loading: false,
        }));
      }
    } catch (e) { }

    getLocation();
  }, []);

  // 🛡️ High-Fidelity Kerala Geofence Check
  const isWithinKerala = isUserInKerala(location.lat, location.lng);

  return { ...location, isWithinKerala, refreshLocation: getLocation };
};
