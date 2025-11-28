/**
 * Client-side location data utilities
 * Extracts location lists from the Bangladesh locations data
 */

import { LOCATION_COORDINATES } from '../../server/data/bangladesh-locations';
import { formatLocationName } from '../data/location-translations';

export interface LocationLists {
  divisions: string[];
  districts: { [division: string]: string[] };
  upazilas: { [district: string]: string[] };
}

export interface LocationListsBangla {
  divisions: string[];
  districts: { [divisionBangla: string]: string[] };
  upazilas: { [districtBangla: string]: string[] };
  // Mapping from Bangla to English for backend API calls
  divisionMap: { [bangla: string]: string };
  districtMap: { [bangla: string]: string };
  upazilaMap: { [bangla: string]: string };
}

/**
 * Extract all divisions, districts, and upazilas from the location data
 * Returns Bangla names with English in parentheses
 */
export function getLocationListsBangla(): LocationListsBangla {
  const divisions: string[] = [];
  const districts: { [divisionBangla: string]: string[] } = {};
  const upazilas: { [districtBangla: string]: string[] } = {};
  const divisionMap: { [bangla: string]: string } = {};
  const districtMap: { [bangla: string]: string } = {};
  const upazilaMap: { [bangla: string]: string } = {};

  // Extract divisions
  for (const division in LOCATION_COORDINATES) {
    const divisionDisplay = formatLocationName(division, 'division');
    divisions.push(divisionDisplay);
    divisionMap[divisionDisplay] = division;
    districts[divisionDisplay] = [];

    // Extract districts for this division
    for (const district in LOCATION_COORDINATES[division]) {
      const districtDisplay = formatLocationName(district, 'district');
      districts[divisionDisplay].push(districtDisplay);
      districtMap[districtDisplay] = district;

      // Extract upazilas for this district
      const districtData = LOCATION_COORDINATES[division][district];
      if (districtData.upazilas) {
        upazilas[districtDisplay] = [];
        for (const upazila in districtData.upazilas) {
          const upazilaDisplay = formatLocationName(upazila, 'upazila');
          upazilas[districtDisplay].push(upazilaDisplay);
          upazilaMap[upazilaDisplay] = upazila;
        }
      } else {
        upazilas[districtDisplay] = [];
      }
    }
  }

  return { divisions, districts, upazilas, divisionMap, districtMap, upazilaMap };
}

/**
 * Extract all divisions, districts, and upazilas (English only)
 */
export function getLocationLists(): LocationLists {
  const divisions: string[] = [];
  const districts: { [division: string]: string[] } = {};
  const upazilas: { [district: string]: string[] } = {};

  // Extract divisions
  for (const division in LOCATION_COORDINATES) {
    divisions.push(division);
    districts[division] = [];

    // Extract districts for this division
    for (const district in LOCATION_COORDINATES[division]) {
      districts[division].push(district);

      // Extract upazilas for this district
      const districtData = LOCATION_COORDINATES[division][district];
      if (districtData.upazilas) {
        upazilas[district] = Object.keys(districtData.upazilas);
      } else {
        upazilas[district] = [];
      }
    }
  }

  return { divisions, districts, upazilas };
}

// Pre-compute the location lists for performance
export const LOCATION_LISTS = getLocationLists();
export const LOCATION_LISTS_BANGLA = getLocationListsBangla();
