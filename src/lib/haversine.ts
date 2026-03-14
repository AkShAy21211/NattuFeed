/**
 * Haversine Formula Utility
 * 
 * Used to calculate the great-circle distance between two points on a sphere 
 * given their longitudes and latitudes. This is used for NattuFeed's ~2km 
 * hyperlocal radius filtering.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two points on a sphere (Earth)
 * given their longitudes and latitudes using the Haversine formula.
 * 
 * Formula:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2( √a, √(1−a) )
 * d = R ⋅ c
 * 
 * @param lat1 Latitude of point 1 in degrees
 * @param lng1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lng2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function getDistanceInKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) *
      Math.cos(rLat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Checks if a post is within a specified radius of the user.
 * 
 * @param postLat Latitude of the post
 * @param postLng Longitude of the post
 * @param userLat Latitude of the user
 * @param userLng Longitude of the user
 * @param radiusKm Radius in kilometers (default: 2km)
 * @returns boolean
 */
export function isWithinRadius(
  postLat: number,
  postLng: number,
  userLat: number | null,
  userLng: number | null,
  radiusKm: number = 2
): boolean {
  // If user location is not yet available, we show همه posts (global mode)
  // or return true to prevent blocking the feed while loading
  if (userLat === null || userLng === null) return true;
  
  const distance = getDistanceInKm(postLat, postLng, userLat, userLng);
  return distance <= radiusKm;
}

/**
 * Converts degrees to radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * USAGE EXAMPLE:
 * 
 * import { isWithinRadius } from '@/lib/haversine';
 * 
 * const userLocation = { lat: 10.0123, lng: 76.3210 };
 * const postLocation = { lat: 10.0150, lng: 76.3240 };
 * 
 * const visible = isWithinRadius(
 *   postLocation.lat, 
 *   postLocation.lng, 
 *   userLocation.lat, 
 *   userLocation.lng, 
 *   2
 * );
 * 
 * console.log(visible); // true or false
 */
