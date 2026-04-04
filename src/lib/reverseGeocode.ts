/**
 * Reverse Geocoding Utility for Kerala
 * 
 * Uses free OpenStreetMap Nominatim API to convert GPS coordinates
 * into a district + local body, then fuzzy-matches against keralaData.ts.
 */

import { KERALA_DISTRICTS, KERALA_LSG_DATA, District } from '@/constants/keralaData';

export interface DetectedLocation {
  district: District | null;
  localBody: string | null;
  displayName: string | null; // Human-readable "Azhikode, Kannur"
  raw?: any;
}

/**
 * Calls Nominatim reverse geocoding API and matches the result 
 * to Kerala administrative data.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<DetectedLocation> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=14`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'NattuFeed/1.0' },
      }
    );

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
    
    const data = await res.json();
    const addr = data.address || {};
    
    // Extract possible locality names from Nominatim response
    const locality = addr.village || addr.town || addr.city || addr.suburb || addr.hamlet || '';
    const county = addr.county || ''; // Usually "Kannur" district
    const stateDistrict = addr.state_district || ''; // e.g. "Kannur"
    const state = addr.state || '';

    // 1. Match district
    const districtMatch = matchDistrict(stateDistrict || county);
    
    // 2. Match local body (if district is known)
    let localBodyMatch: string | null = null;
    if (districtMatch) {
      localBodyMatch = matchLocalBody(districtMatch, locality, addr);
    }

    const displayParts = [localBodyMatch || locality, districtMatch].filter(Boolean);

    return {
      district: districtMatch,
      localBody: localBodyMatch,
      displayName: displayParts.join(', ') || locality || null,
      raw: addr,
    };
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    return { district: null, localBody: null, displayName: null };
  }
}

/**
 * Fuzzy-match the Nominatim district string to KERALA_DISTRICTS.
 */
function matchDistrict(nominatimDistrict: string): District | null {
  if (!nominatimDistrict) return null;
  
  const cleaned = nominatimDistrict.toLowerCase().replace(/\s*district\s*/i, '').trim();
  
  for (const d of KERALA_DISTRICTS) {
    if (d.toLowerCase() === cleaned) return d;
    // Partial match (e.g. "Kannur" matches "Kannur")
    if (d.toLowerCase().includes(cleaned) || cleaned.includes(d.toLowerCase())) return d;
  }
  return null;
}

/**
 * Fuzzy-match a locality name against the LSG data for a given district.
 * Tries multiple address fields for best match.
 */
function matchLocalBody(district: District, locality: string, addr: any): string | null {
  const bodies = KERALA_LSG_DATA[district] || [];
  if (bodies.length === 0) return null;

  // Collect all possible name hints from Nominatim response
  const hints = [
    locality,
    addr.village,
    addr.town,
    addr.city,
    addr.suburb,
    addr.hamlet,
    addr.neighbourhood,
  ].filter(Boolean).map(s => s.toLowerCase());

  // Score each body by how well it matches the hints
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const body of bodies) {
    const bodyLower = body.toLowerCase();
    // Strip common suffixes for matching
    const bodyCore = bodyLower
      .replace(/\s*(panchayat|municipality|municipal corporation|block)\s*/gi, '')
      .trim();

    for (const hint of hints) {
      const hintClean = hint.toLowerCase().trim();
      
      // Exact match on core name
      if (bodyCore === hintClean) return body; // Perfect match → return immediately
      
      // Contains match
      if (bodyCore.includes(hintClean) || hintClean.includes(bodyCore)) {
        const score = bodyCore.length; // Longer matches are better
        if (score > bestScore) {
          bestScore = score;
          bestMatch = body;
        }
      }
    }
  }

  return bestMatch;
}
