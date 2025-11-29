/**
 * Risk Calculator Utility
 * Calculates risk level based on weather conditions and crop information
 * Requirements: 3.3, 3.4, 3.5
 */

import type { WeatherConditions, CropInfo, RiskLevel } from '../types/localRiskMap';

/**
 * Calculates the risk level for crop spoilage based on weather and crop factors
 * 
 * Risk Level Logic:
 * - High Risk: Critical conditions that require immediate action
 * - Medium Risk: Concerning conditions that need monitoring
 * - Low Risk: Normal conditions with minimal threat
 * 
 * @param weather - Current weather conditions
 * @param crop - Crop information including type, storage, and stage
 * @returns Risk level: 'Low', 'Medium', or 'High'
 * 
 * Requirements:
 * - 3.3: Risk level must be one of three valid values
 * - 3.4: Must consider weather factors (temperature, humidity, rainfall)
 * - 3.5: Must consider crop factors (storage type, crop stage)
 */
export function calculateRiskLevel(
  weather: WeatherConditions,
  crop: CropInfo
): RiskLevel {
  try {
    // Validate inputs
    if (!weather || !crop) {
      return 'Medium'; // Fallback for invalid inputs
    }

    // High Risk Conditions
    // 1. High rainfall with harvest-ready or harvested crops
    if (weather.rainfall > 70 && (crop.cropStage === 'harvest-ready' || crop.cropStage === 'harvested')) {
      return 'High';
    }

    // 2. Extreme temperature with field storage
    if (weather.temperature > 38 && crop.storageType === 'field') {
      return 'High';
    }

    // 3. High humidity with harvested crops in home storage
    if (weather.humidity > 85 && crop.cropStage === 'harvested' && crop.storageType === 'home') {
      return 'High';
    }

    // Medium Risk Conditions
    // 1. Moderate rainfall with harvest-ready crops
    if (weather.rainfall >= 40 && weather.rainfall <= 70 && crop.cropStage === 'harvest-ready') {
      return 'Medium';
    }

    // 2. High temperature with field storage
    if (weather.temperature >= 35 && weather.temperature <= 38 && crop.storageType === 'field') {
      return 'Medium';
    }

    // 3. High humidity with harvested crops
    if (weather.humidity >= 75 && weather.humidity <= 85 && crop.cropStage === 'harvested') {
      return 'Medium';
    }

    // 4. Moderate rainfall with harvested crops
    if (weather.rainfall >= 40 && crop.cropStage === 'harvested') {
      return 'Medium';
    }

    // 5. High humidity with harvest-ready crops
    if (weather.humidity > 80 && crop.cropStage === 'harvest-ready') {
      return 'Medium';
    }

    // Low Risk - All other conditions
    // Crops in 'planted' or 'growing' stages with normal weather
    return 'Low';

  } catch (error) {
    // Fallback to Medium risk on any error
    console.warn('Risk calculation error, defaulting to Medium:', error);
    return 'Medium';
  }
}
