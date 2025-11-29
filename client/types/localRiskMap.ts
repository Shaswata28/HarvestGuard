/**
 * Type definitions for Local Risk Map feature
 * Requirements: 1.1, 2.1, 2.3, 3.1
 */

/**
 * Geographic location with district and division information
 */
export interface Location {
  lat: number;
  lng: number;
  district: string;
  division: string;
}

/**
 * Weather conditions for risk assessment
 */
export interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // Percentage (0-100)
  rainfall: number; // Percentage probability (0-100)
  condition: 'sunny' | 'rainy' | 'cloudy' | 'humid';
}

/**
 * Crop information for risk assessment
 */
export interface CropInfo {
  cropType: string; // e.g., "ধান" (rice), "পাট" (jute), "আলু" (potato)
  storageType: 'field' | 'warehouse' | 'home';
  cropStage: 'planted' | 'growing' | 'harvest-ready' | 'harvested';
}

/**
 * Risk level type
 */
export type RiskLevel = 'Low' | 'Medium' | 'High';

/**
 * Farmer data from database (actual data)
 */
export interface FarmerData {
  id: string;
  location: Location;
  riskLevel: RiskLevel;
  weather: WeatherConditions; // Actual weather from database
  crop: CropInfo; // Actual crop info from database
  advisory: string; // Pre-generated Bangla advisory from database
}

/**
 * Neighbor data (mock data for demonstration)
 */
export interface NeighborData {
  id: string; // UUID for React key
  location: Location;
  riskLevel: RiskLevel;
  mockWeather: WeatherConditions; // Simulated weather
  mockCrop: CropInfo; // Simulated crop info
}

/**
 * Risk marker configuration for map display
 */
export interface RiskMarkerConfig {
  Low: {
    color: string; // '#22c55e' (green)
    icon: string;
  };
  Medium: {
    color: string; // '#f59e0b' (orange)
    icon: string;
  };
  High: {
    color: string; // '#ef4444' (red)
    icon: string;
  };
}

/**
 * Props for LocalRiskMap component
 */
export interface LocalRiskMapProps {
  farmerId: string; // Used to fetch farmer data from database
  language: 'bn'; // Bangla only for this feature
}

/**
 * State for LocalRiskMap component
 */
export interface MapState {
  center: [number, number]; // [latitude, longitude]
  zoom: number;
  farmerData: FarmerData | null; // Actual data from database
  neighborData: NeighborData[]; // Mock data for neighbors
  isLoading: boolean;
  error: string | null;
}
