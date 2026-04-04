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
 * Fetches verified anchors from Firestore and merges them with seed data.
 */
export const getVerifiedAnchors = async (): Promise<Anchor[]> => {
  if (cachedAnchors) return cachedAnchors;

  try {
    const q = query(collection(db, "bus_anchors"), where("verified", "==", true));
    const querySnapshot = await getDocs(q);
    
    let anchors: Anchor[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
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

    // Merge with Seed Data for Kannur Demo
    try {
      const seedData = (await import("./anchors_seed.json")).default as Anchor[];
      // Only add seed data if not already present in Firestore (by ID)
      const existingIds = new Set(anchors.map(a => a.id));
      const uniqueSeedData = seedData.filter(s => !existingIds.has(s.id));
      anchors = [...anchors, ...uniqueSeedData];
    } catch (e) {
      console.warn("No seed data found or error loading it.");
    }

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
/**
 * Fetches a single anchor by ID.
 */
export const getAnchorById = async (id: string): Promise<Anchor | null> => {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, "bus_anchors", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const lat = data.location?.latitude || data.lat;
      const lng = data.location?.longitude || data.lng;
      return {
        id: docSnap.id,
        name: data.name,
        lat,
        lng,
        routes: data.routes || []
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching anchor by ID:", error);
    return null;
  }
};

/**
 * Seeds the local JSON anchors to Firestore.
 * This is a utility function to be called once or via a hidden admin trigger.
 */
export const seedAnchorsToFirestore = async (): Promise<{ success: boolean; count: number }> => {
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const seedData = (await import("./anchors_seed.json")).default as any[];
    
    let count = 0;
    for (const anchor of seedData) {
      const docRef = doc(db, "bus_anchors", anchor.id);
      await setDoc(docRef, {
        ...anchor,
        verified: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      count++;
    }
    
    return { success: true, count };
  } catch (error) {
    console.error("Error seeding anchors:", error);
    return { success: false, count: 0 };
  }
};
