import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Verified Bus Stop Anchors for Radar Integrity.
 */

export interface Anchor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes?: string[];
}

let cachedAnchors: Anchor[] | null = null;

/**
 * Fetches verified anchors from Firestore.
 */
export const getVerifiedAnchors = async (): Promise<Anchor[]> => {
  if (cachedAnchors) return cachedAnchors;

  try {
    const q = query(collection(db, "bus_anchors"), where("verified", "==", true));
    const querySnapshot = await getDocs(q);
    
    const anchors: Anchor[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Support both GeoPoint or simple lat/lng array/fields
      const lat = data.location?.latitude || data.lat;
      const lng = data.location?.longitude || data.lng;
      
      if (lat !== undefined && lng !== undefined) {
        anchors.push({
          id: doc.id,
          name: data.name,
          lat,
          lng,
          routes: data.routes || []
        });
      }
    });

    cachedAnchors = anchors;
    return anchors;
  } catch (error) {
    console.error("Error fetching anchors:", error);
    return [];
  }
};

/**
 * Haversine formula to calculate distance between two points in meters.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Checks if a coordinate is within a safe distance (buffer) of ANY verified anchor.
 * Note: Caller should ensure anchors are loaded or pass them in.
 */
export const isNearAnyAnchor = (lat: number, lng: number, anchors: Anchor[], bufferMeters: number = 500): boolean => {
  return anchors.some(anchor => {
    const dist = calculateDistance(lat, lng, anchor.lat, anchor.lng);
    return dist <= bufferMeters;
  });
};
