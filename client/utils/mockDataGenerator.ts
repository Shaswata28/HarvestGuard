/**
 * Mock Data Generator Utility
 * Generates anonymized neighbor data for Local Risk Map demonstration
 * Requirements: 3.1, 3.2, 3.6, 5.7, 8.2, 8.3
 */

import type { NeighborData, WeatherConditions, CropInfo, Location } from '../types/localRiskMap';
import { generateRandomCoordinateInDistrict } from './districtCoordinates';
import { calculateRiskLevel } from './riskCalculator';

/**
 * Common Bangladesh crops in Bangla
 * Used for generating realistic mock crop data
 */
const BANGLADESH_CROPS = [
  'ধান',      // Rice
  'পাট',      // Jute
  'আলু',      // Potato
  'গম',       // Wheat
  'ভুট্টা',   // Corn
  'সরিষা',    // Mustard
  'ডাল',      // Lentils
  'পেঁয়াজ',  // Onion
];

/**
 * Storage types for crops
 */
const STORAGE_TYPES: Array<'field' | 'warehouse' | 'home'> = ['field', 'warehouse', 'home'];

/**
 * Crop stages
 */
const CROP_STAGES: Array<'planted' | 'growing' | 'harvest-ready' | 'harvested'> = [
  'planted',
  'growing',
  'harvest-ready',
  'harvested',
];

/**
 * Weather conditions for mock data
 */
const WEATHER_CONDITIONS: Array<'sunny' | 'rainy' | 'cloudy' | 'humid'> = [
  'sunny',
  'rainy',
  'cloudy',
  'humid',
];

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random element from an array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate realistic mock weather conditions
 * 
 * @returns WeatherConditions with realistic values for Bangladesh
 * 
 * Ranges:
 * - Temperature: 15-45°C (realistic for Bangladesh climate)
 * - Humidity: 0-100% (full range)
 * - Rainfall: 0-100% (probability percentage)
 * - Condition: Random weather condition
 * 
 * Requirements: 5.7
 */
function generateMockWeather(): WeatherConditions {
  return {
    temperature: randomInt(15, 45),
    humidity: randomInt(0, 100),
    rainfall: randomInt(0, 100),
    condition: randomElement(WEATHER_CONDITIONS),
  };
}

/**
 * Generate mock crop information
 * 
 * @returns CropInfo with common Bangladesh crops
 * 
 * Requirements: 3.6, 8.2, 8.3
 */
function generateMockCrop(): CropInfo {
  return {
    cropType: randomElement(BANGLADESH_CROPS),
    storageType: randomElement(STORAGE_TYPES),
    cropStage: randomElement(CROP_STAGES),
  };
}

/**
 * Generate a unique ID for a neighbor data point
 * Uses timestamp and random number to ensure uniqueness
 * 
 * @returns Unique string ID
 * 
 * Requirements: 3.6
 */
function generateUniqueId(): string {
  return `neighbor-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate mock neighbor data for Local Risk Map
 * 
 * Creates 10-15 anonymized neighbor data points with:
 * - Random coordinates within the farmer's district
 * - Realistic mock weather conditions
 * - Common Bangladesh crops
 * - Calculated risk levels
 * - No personal identifiers or farm names
 * 
 * @param farmerLocation - The farmer's location (used for district boundaries)
 * @param count - Number of neighbors to generate (default: random 10-15)
 * @returns Array of NeighborData objects
 * 
 * Requirements:
 * - 3.1: Generate 10-15 neighbor data points
 * - 3.2: Coordinates within farmer's district
 * - 3.6: No personal identifiers or farm names
 * - 5.7: Realistic mock weather values
 * - 8.2, 8.3: Anonymized data
 */
export function generateMockNeighborData(
  farmerLocation: Location,
  count?: number
): NeighborData[] {
  // Generate random count between 10-15 if not specified
  const neighborCount = count ?? randomInt(10, 15);
  
  const neighbors: NeighborData[] = [];
  
  // Get farmer's district center for coordinate generation
  const [centerLat, centerLng] = [farmerLocation.lat, farmerLocation.lng];
  
  for (let i = 0; i < neighborCount; i++) {
    // Generate random coordinates within district (15km radius)
    const [lat, lng] = generateRandomCoordinateInDistrict(centerLat, centerLng, 15);
    
    // Generate mock weather and crop data
    const mockWeather = generateMockWeather();
    const mockCrop = generateMockCrop();
    
    // Calculate risk level based on mock data
    const riskLevel = calculateRiskLevel(mockWeather, mockCrop);
    
    // Create neighbor data point (no personal identifiers)
    const neighbor: NeighborData = {
      id: generateUniqueId(),
      location: {
        lat,
        lng,
        district: farmerLocation.district,
        division: farmerLocation.division,
      },
      riskLevel,
      mockWeather,
      mockCrop,
    };
    
    neighbors.push(neighbor);
  }
  
  return neighbors;
}
