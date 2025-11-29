/**
 * Risk Calculation Module
 * 
 * This module provides risk assessment functionality for the Smart Alert System.
 * It calculates risk levels based on weather conditions, crop characteristics,
 * and storage conditions.
 */

import type { CropBatch, WeatherSnapshot } from '../db/schemas';

/**
 * Risk level enumeration
 */
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * Risk thresholds for weather parameters
 */
export const RISK_THRESHOLDS = {
  humidity: {
    low: 60,
    medium: 70,
    high: 80,
    critical: 90
  },
  temperature: {
    low: 30,
    medium: 35,
    high: 38,
    critical: 42
  },
  rainfall: {
    low: 20,
    medium: 50,
    high: 100,
    critical: 150
  },
  windSpeed: {
    low: 5,
    medium: 10,
    high: 15,
    critical: 20
  }
} as const;

/**
 * Storage vulnerability multipliers
 * Higher values indicate greater vulnerability to weather conditions
 */
export const STORAGE_VULNERABILITY = {
  'open_space': 1.5,  // 50% more vulnerable
  'jute_bag': 1.2,    // 20% more vulnerable
  'tin_shed': 1.1,    // 10% more vulnerable
  'silo': 1.0         // baseline
} as const;

/**
 * Weather data interface for risk calculation
 */
export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
}

/**
 * Calculates a risk score (0-100) based on weather conditions and crop characteristics
 * 
 * @param weather - Current weather data
 * @param crop - Crop batch information
 * @returns Risk score from 0 to 100
 */
export function calculateRiskScore(
  weather: WeatherData,
  crop: CropBatch
): number {
  let score = 0;
  
  // Humidity contribution (0-35 points)
  if (weather.humidity > RISK_THRESHOLDS.humidity.critical) {
    score += 35;
  } else if (weather.humidity > RISK_THRESHOLDS.humidity.high) {
    score += 25;
  } else if (weather.humidity > RISK_THRESHOLDS.humidity.medium) {
    score += 15;
  } else if (weather.humidity > RISK_THRESHOLDS.humidity.low) {
    score += 8;
  }
  
  // Temperature contribution (0-30 points)
  if (weather.temperature > RISK_THRESHOLDS.temperature.critical) {
    score += 30;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.high) {
    score += 20;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.medium) {
    score += 12;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.low) {
    score += 7;
  }
  
  // Rainfall contribution (0-25 points)
  if (weather.rainfall > RISK_THRESHOLDS.rainfall.critical) {
    score += 25;
  } else if (weather.rainfall > RISK_THRESHOLDS.rainfall.high) {
    score += 18;
  } else if (weather.rainfall > RISK_THRESHOLDS.rainfall.medium) {
    score += 10;
  } else if (weather.rainfall > RISK_THRESHOLDS.rainfall.low) {
    score += 5;
  }
  
  // Wind contribution (0-10 points)
  if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.critical) {
    score += 10;
  } else if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.high) {
    score += 7;
  } else if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.medium) {
    score += 4;
  }
  
  // Apply storage vulnerability multiplier for harvested crops
  if (crop.stage === 'harvested' && crop.storageLocation) {
    score *= STORAGE_VULNERABILITY[crop.storageLocation];
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Converts a risk score to a risk level category
 * 
 * @param score - Risk score from 0 to 100
 * @returns Risk level (Low, Medium, High, or Critical)
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Risk factor interface for tracking individual risk contributors
 */
export interface RiskFactor {
  type: 'humidity' | 'temperature' | 'rainfall' | 'wind' | 'storage' | 'harvest_timing';
  severity: number; // 0-100
  description: string;
}

/**
 * Risk assessment interface containing level, factors, and score
 */
export interface RiskAssessment {
  level: RiskLevel;
  factors: RiskFactor[];
  score: number; // 0-100
  primaryThreat: string;
}

/**
 * Calculates storage risk for harvested crops based on humidity, temperature, and storage type
 * 
 * @param crop - Crop batch information (must be harvested stage)
 * @param weather - Current weather data
 * @returns Risk assessment with factors and rationale
 */
export function calculateStorageRisk(
  crop: CropBatch,
  weather: WeatherData
): RiskAssessment {
  const factors: RiskFactor[] = [];
  
  // Humidity risk factor
  let humiditySeverity = 0;
  if (weather.humidity > RISK_THRESHOLDS.humidity.critical) {
    humiditySeverity = 100;
  } else if (weather.humidity > RISK_THRESHOLDS.humidity.high) {
    humiditySeverity = 75;
  } else if (weather.humidity > RISK_THRESHOLDS.humidity.medium) {
    humiditySeverity = 50;
  } else if (weather.humidity > RISK_THRESHOLDS.humidity.low) {
    humiditySeverity = 25;
  }
  
  if (humiditySeverity > 0) {
    factors.push({
      type: 'humidity',
      severity: humiditySeverity,
      description: `High humidity (${weather.humidity}%) increases mold and spoilage risk`
    });
  }
  
  // Temperature risk factor
  let temperatureSeverity = 0;
  if (weather.temperature > RISK_THRESHOLDS.temperature.critical) {
    temperatureSeverity = 100;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.high) {
    temperatureSeverity = 75;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.medium) {
    temperatureSeverity = 50;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.low) {
    temperatureSeverity = 25;
  }
  
  if (temperatureSeverity > 0) {
    factors.push({
      type: 'temperature',
      severity: temperatureSeverity,
      description: `High temperature (${weather.temperature}°C) accelerates deterioration`
    });
  }
  
  // Storage vulnerability factor
  if (crop.storageLocation) {
    const vulnerabilityMultiplier = STORAGE_VULNERABILITY[crop.storageLocation];
    if (vulnerabilityMultiplier > 1.0) {
      const storageSeverity = (vulnerabilityMultiplier - 1.0) * 100;
      factors.push({
        type: 'storage',
        severity: storageSeverity,
        description: `Storage type '${crop.storageLocation}' is vulnerable to weather conditions`
      });
    }
  }
  
  // Calculate overall score
  const score = calculateRiskScore(weather, crop);
  const level = scoreToRiskLevel(score);
  
  // Determine primary threat
  let primaryThreat = 'No significant risk';
  if (factors.length > 0) {
    const maxFactor = factors.reduce((max, f) => f.severity > max.severity ? f : max);
    primaryThreat = maxFactor.description;
  }
  
  // Log decision rationale
  console.log('[Risk Calculator] Storage Risk Assessment:', {
    cropId: crop._id?.toString(),
    cropType: crop.cropType,
    storageLocation: crop.storageLocation,
    score,
    level,
    factors: factors.map(f => ({ type: f.type, severity: f.severity })),
    primaryThreat
  });
  
  return {
    level,
    factors,
    score,
    primaryThreat
  };
}

/**
 * Calculates growing crop risk based on weather patterns
 * 
 * @param crop - Crop batch information (must be growing stage)
 * @param weather - Current weather data
 * @returns Risk assessment with factors and rationale
 */
export function calculateGrowingRisk(
  crop: CropBatch,
  weather: WeatherData
): RiskAssessment {
  const factors: RiskFactor[] = [];
  
  // Rainfall risk factor
  let rainfallSeverity = 0;
  if (weather.rainfall > RISK_THRESHOLDS.rainfall.critical) {
    rainfallSeverity = 100;
  } else if (weather.rainfall > RISK_THRESHOLDS.rainfall.high) {
    rainfallSeverity = 75;
  } else if (weather.rainfall > RISK_THRESHOLDS.rainfall.medium) {
    rainfallSeverity = 50;
  } else if (weather.rainfall > RISK_THRESHOLDS.rainfall.low) {
    rainfallSeverity = 25;
  }
  
  if (rainfallSeverity > 0) {
    factors.push({
      type: 'rainfall',
      severity: rainfallSeverity,
      description: `Heavy rainfall (${weather.rainfall}mm) may cause waterlogging and crop damage`
    });
  }
  
  // Temperature risk factor
  let temperatureSeverity = 0;
  if (weather.temperature > RISK_THRESHOLDS.temperature.critical) {
    temperatureSeverity = 100;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.high) {
    temperatureSeverity = 75;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.medium) {
    temperatureSeverity = 50;
  } else if (weather.temperature > RISK_THRESHOLDS.temperature.low) {
    temperatureSeverity = 25;
  }
  
  if (temperatureSeverity > 0) {
    factors.push({
      type: 'temperature',
      severity: temperatureSeverity,
      description: `High temperature (${weather.temperature}°C) may stress crops`
    });
  }
  
  // Wind risk factor
  let windSeverity = 0;
  if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.critical) {
    windSeverity = 100;
  } else if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.high) {
    windSeverity = 75;
  } else if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.medium) {
    windSeverity = 50;
  }
  
  if (windSeverity > 0) {
    factors.push({
      type: 'wind',
      severity: windSeverity,
      description: `Strong winds (${weather.windSpeed} m/s) may damage crops`
    });
  }
  
  // Harvest timing risk factor
  if (crop.expectedHarvestDate) {
    const daysUntilHarvest = Math.ceil(
      (crop.expectedHarvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilHarvest <= 7 && daysUntilHarvest >= 0) {
      // Imminent harvest increases risk from weather events
      const harvestSeverity = 50;
      factors.push({
        type: 'harvest_timing',
        severity: harvestSeverity,
        description: `Harvest in ${daysUntilHarvest} days - weather events pose higher risk`
      });
    }
  }
  
  // Calculate overall score
  const score = calculateRiskScore(weather, crop);
  const level = scoreToRiskLevel(score);
  
  // Determine primary threat
  let primaryThreat = 'No significant risk';
  if (factors.length > 0) {
    const maxFactor = factors.reduce((max, f) => f.severity > max.severity ? f : max);
    primaryThreat = maxFactor.description;
  }
  
  // Log decision rationale
  console.log('[Risk Calculator] Growing Crop Risk Assessment:', {
    cropId: crop._id?.toString(),
    cropType: crop.cropType,
    expectedHarvestDate: crop.expectedHarvestDate?.toISOString(),
    score,
    level,
    factors: factors.map(f => ({ type: f.type, severity: f.severity })),
    primaryThreat
  });
  
  return {
    level,
    factors,
    score,
    primaryThreat
  };
}

/**
 * Determines overall risk level from multiple risk assessments
 * Uses the maximum risk level among all assessments
 * 
 * @param assessments - Array of risk assessments
 * @returns The highest risk level found
 */
export function determineOverallRisk(assessments: RiskAssessment[]): RiskLevel {
  if (assessments.length === 0) {
    return 'Low';
  }
  
  const riskLevelOrder: Record<RiskLevel, number> = {
    'Low': 0,
    'Medium': 1,
    'High': 2,
    'Critical': 3
  };
  
  const maxAssessment = assessments.reduce((max, current) => {
    return riskLevelOrder[current.level] > riskLevelOrder[max.level] ? current : max;
  });
  
  // Log decision rationale
  console.log('[Risk Calculator] Overall Risk Determination:', {
    assessmentCount: assessments.length,
    levels: assessments.map(a => a.level),
    overallLevel: maxAssessment.level,
    primaryThreat: maxAssessment.primaryThreat
  });
  
  return maxAssessment.level;
}
