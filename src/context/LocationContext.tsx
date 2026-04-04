"use client";

import React, { createContext, useContext } from "react";
import { useLocation } from "@/hooks/useLocation";


interface LocationContextValue {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  isWithinKerala: boolean | null;
  refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The entire app shares ONE call to useLocation — one permission prompt, one GPS request.
  const location = useLocation();

  return (
    <LocationContext.Provider value={location}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = (): LocationContextValue => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within LocationProvider");
  return ctx;
};
