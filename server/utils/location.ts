/**
 * Location utility functions for Bangladesh geographic data
 */

import {
  LOCATION_COORDINATES,
  BANGLADESH_BOUNDS,
  DEFAULT_LOCATION,
  Coordinates,
  LocationData
} from '../data/bangladesh-locations';

/**
 * Validates if coordinates are within Bangladesh geographic bounds
 */
export function isValidBangladeshCoordinates(lat: number, lon: number): boolean {
  return (
    lat >= BANGLADESH_BOUNDS.lat.min &&
    lat <= BANGLADESH_BOUNDS.lat.max &&
    lon >= BANGLADESH_BOUNDS.lon.min &&
    lon <= BANGLADESH_BOUNDS.lon.max
  );
}

/**
 * Gets coordinates for a specific location in Bangladesh
 * Supports division, district, and optional upazila lookup
 * Falls back to district coordinates if upazila not found
 * Falls back to default location (Dhaka) if location not found
 */
export function getCoordinatesForLocation(
  division: string,
  district: string,
  upazila?: string
): Coordinates {
  // Normalize input strings (trim and handle case variations)
  const normalizedDivision = division?.trim();
  const normalizedDistrict = district?.trim();
  const normalizedUpazila = upazila?.trim();

  // Check if division exists
  const divisionData = LOCATION_COORDINATES[normalizedDivision];
  if (!divisionData) {
    console.warn(
      `Division "${normalizedDivision}" not found, using default location (Dhaka)`
    );
    return DEFAULT_LOCATION;
  }

  // Check if district exists
  const districtData = divisionData[normalizedDistrict];
  if (!districtData) {
    console.warn(
      `District "${normalizedDistrict}" not found in division "${normalizedDivision}", using default location (Dhaka)`
    );
    return DEFAULT_LOCATION;
  }

  // If upazila is provided and exists, use upazila coordinates
  if (normalizedUpazila && districtData.upazilas) {
    const upazilaCoords = districtData.upazilas[normalizedUpazila];
    if (upazilaCoords) {
      return upazilaCoords;
    }
    console.info(
      `Upazila "${normalizedUpazila}" not found, falling back to district coordinates`
    );
  }

  // Return district coordinates
  return districtData.coordinates;
}

/**
 * Rounds coordinates to specified decimal places for cache key generation
 * Default: 2 decimal places (≈1km precision)
 */
export function roundCoordinates(
  lat: number,
  lon: number,
  decimals: number = 2
): Coordinates {
  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(lat * factor) / factor,
    lon: Math.round(lon * factor) / factor
  };
}

/**
 * Validates and sanitizes coordinates
 * Returns valid coordinates or default location if invalid
 */
export function validateAndSanitizeCoordinates(
  lat: number,
  lon: number
): Coordinates {
  // Check if coordinates are valid numbers
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    console.warn('Invalid coordinate format, using default location (Dhaka)');
    return DEFAULT_LOCATION;
  }

  // Check if coordinates are within Bangladesh bounds
  if (!isValidBangladeshCoordinates(lat, lon)) {
    console.warn(
      `Coordinates (${lat}, ${lon}) are outside Bangladesh bounds, using default location (Dhaka)`
    );
    return DEFAULT_LOCATION;
  }

  return { lat, lon };
}

/**
 * Gets all available divisions
 */
export function getAvailableDivisions(): string[] {
  return Object.keys(LOCATION_COORDINATES);
}

/**
 * Gets all districts for a given division
 */
export function getDistrictsForDivision(division: string): string[] {
  const divisionData = LOCATION_COORDINATES[division];
  if (!divisionData) {
    return [];
  }
  return Object.keys(divisionData);
}

/**
 * Gets all upazilas for a given division and district
 */
export function getUpazilasForDistrict(
  division: string,
  district: string
): string[] {
  const divisionData = LOCATION_COORDINATES[division];
  if (!divisionData) {
    return [];
  }

  const districtData = divisionData[district];
  if (!districtData || !districtData.upazilas) {
    return [];
  }

  return Object.keys(districtData.upazilas);
}

/**
 * Generates a cache key from coordinates
 */
export function generateLocationCacheKey(lat: number, lon: number): string {
  const rounded = roundCoordinates(lat, lon);
  return `${rounded.lat},${rounded.lon}`;
}
