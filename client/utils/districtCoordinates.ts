/**
 * District Coordinate Lookup Utility
 * Provides coordinate lookup for Bangladesh districts with fallback logic
 * Requirements: 1.2, 2.3, 3.2
 */

import { LOCATION_COORDINATES, DEFAULT_LOCATION, BANGLADESH_BOUNDS, type Coordinates } from '@shared/bangladesh-locations';

/**
 * Division-level center coordinates for fallback
 * Calculated as approximate centers of each division
 */
const DIVISION_CENTERS: Record<string, Coordinates> = {
  'Dhaka': { lat: 23.8103, lon: 90.4125 },
  'Chittagong': { lat: 22.3569, lon: 91.7832 },
  'Rajshahi': { lat: 24.3745, lon: 88.6042 },
  'Khulna': { lat: 22.8456, lon: 89.5403 },
  'Barisal': { lat: 22.7010, lon: 90.3535 },
  'Sylhet': { lat: 24.8949, lon: 91.8687 },
  'Rangpur': { lat: 25.7439, lon: 89.2752 },
  'Mymensingh': { lat: 24.7471, lon: 90.4203 },
};

/**
 * Get center coordinates for a Bangladesh district
 * 
 * @param district - District name (e.g., "Dhaka", "Chittagong")
 * @param division - Division name (e.g., "Dhaka", "Chittagong")
 * @returns Coordinates [latitude, longitude] for the district center
 * 
 * Fallback logic:
 * 1. Try to find district coordinates in the specified division
 * 2. If not found, try division-level coordinates
 * 3. If division not found, use default Bangladesh center (Dhaka)
 * 
 * Requirements: 1.2
 */
export function getDistrictCenter(district: string, division: string): [number, number] {
  // Try to find district coordinates in the specified division
  const divisionData = LOCATION_COORDINATES[division];
  
  if (divisionData && divisionData[district]) {
    const coords = divisionData[district].coordinates;
    return [coords.lat, coords.lon];
  }
  
  // Fallback to division-level coordinates
  const divisionCenter = DIVISION_CENTERS[division];
  if (divisionCenter) {
    return [divisionCenter.lat, divisionCenter.lon];
  }
  
  // Final fallback to default Bangladesh center (Dhaka)
  return [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon];
}

/**
 * Validate if coordinates are within Bangladesh geographic boundaries
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns true if coordinates are within Bangladesh bounds, false otherwise
 * 
 * Requirements: 3.2
 */
export function isWithinBangladeshBounds(lat: number, lng: number): boolean {
  return (
    lat >= BANGLADESH_BOUNDS.lat.min &&
    lat <= BANGLADESH_BOUNDS.lat.max &&
    lng >= BANGLADESH_BOUNDS.lon.min &&
    lng <= BANGLADESH_BOUNDS.lon.max
  );
}

/**
 * Generate random coordinates within a specified radius of a center point
 * Ensures coordinates stay within district boundaries and Bangladesh geographic bounds
 * 
 * @param centerLat - Center latitude coordinate
 * @param centerLng - Center longitude coordinate
 * @param radiusKm - Radius in kilometers (default: 15km)
 * @returns Coordinates [latitude, longitude] within the specified radius
 * 
 * Algorithm:
 * 1. Generate random angle (0-360 degrees)
 * 2. Generate random distance (0-radiusKm)
 * 3. Convert to lat/lng offset using approximate conversion
 * 4. Validate coordinates are within Bangladesh bounds
 * 5. Retry if coordinates are invalid (max 10 attempts)
 * 
 * Approximate conversion factors for Bangladesh:
 * - 1 degree latitude ≈ 111 km
 * - 1 degree longitude ≈ 96 km (at ~24°N latitude)
 * 
 * Requirements: 2.3, 3.2
 */
export function generateRandomCoordinateInDistrict(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 15
): [number, number] {
  const MAX_ATTEMPTS = 10;
  
  // Conversion factors for Bangladesh region
  const KM_PER_DEGREE_LAT = 111; // Approximately constant
  const KM_PER_DEGREE_LNG = 96;  // At ~24°N latitude (Bangladesh average)
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Generate random angle (0 to 2π radians)
    const angle = Math.random() * 2 * Math.PI;
    
    // Generate random distance (0 to radiusKm)
    // Use square root to ensure uniform distribution in circular area
    const distance = Math.sqrt(Math.random()) * radiusKm;
    
    // Calculate offset in kilometers
    const offsetX = distance * Math.cos(angle);
    const offsetY = distance * Math.sin(angle);
    
    // Convert to degrees
    const latOffset = offsetY / KM_PER_DEGREE_LAT;
    const lngOffset = offsetX / KM_PER_DEGREE_LNG;
    
    // Calculate new coordinates
    const newLat = centerLat + latOffset;
    const newLng = centerLng + lngOffset;
    
    // Validate coordinates are within Bangladesh bounds
    if (isWithinBangladeshBounds(newLat, newLng)) {
      return [newLat, newLng];
    }
  }
  
  // If all attempts fail, return center coordinates as fallback
  // This ensures the function always returns valid coordinates
  return [centerLat, centerLng];
}
