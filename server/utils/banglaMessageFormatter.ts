/**
 * Bangla Message Formatter Module
 * 
 * This module provides message formatting functionality for the Smart Alert System.
 * It generates contextual advisory messages in Bangla with specific crop, weather,
 * and location details.
 */

import type { CropBatch } from '../db/schemas';
import type { WeatherData, RiskLevel } from './riskCalculator';
import { generateActionItems, containsBanglaText as validateBanglaText } from './actionItemGenerator';

/**
 * Advisory message structure
 */
export interface AdvisoryMessage {
  message: string;
  actions: string[];
  riskLevel: RiskLevel;
}

/**
 * Validates if a string contains Bangla characters
 * Bangla Unicode range: U+0980 to U+09FF
 * 
 * @param text - Text to validate
 * @returns True if text contains Bangla characters
 */
export function containsBanglaText(text: string): boolean {
  return validateBanglaText(text);
}

/**
 * Formats a storage advisory message in Bangla
 * 
 * @param crop - Crop batch information
 * @param weather - Weather data
 * @param riskLevel - Calculated risk level
 * @returns Formatted advisory message with actions
 */
export function formatStorageAdvisory(
  crop: CropBatch,
  weather: WeatherData,
  riskLevel: RiskLevel
): AdvisoryMessage {
  const storageTypeMap: Record<string, string> = {
    'silo': 'সাইলো',
    'jute_bag': 'পাটের বস্তা',
    'open_space': 'খোলা জায়গা',
    'tin_shed': 'টিনের ঘর'
  };

  const storageType = crop.storageLocation 
    ? storageTypeMap[crop.storageLocation] || crop.storageLocation
    : 'গুদাম';

  const division = crop.storageDivision || '';
  const district = crop.storageDistrict || '';
  const location = division && district ? `${district}, ${division}` : division || district || 'আপনার এলাকা';

  // Build main message
  const message = `আপনার ${crop.cropType} ফসল ${storageType} গুদামে (${location}) ঝুঁকিতে রয়েছে। ` +
    `তাপমাত্রা ${weather.temperature}°C, আর্দ্রতা ${weather.humidity}%, ` +
    `বৃষ্টিপাত ${weather.rainfall}mm। অবিলম্বে সতর্কতামূলক ব্যবস্থা নিন।`;

  // Generate actions based on weather conditions
  const actions = generateActionItems(crop, weather, riskLevel);

  return {
    message,
    actions,
    riskLevel
  };
}

/**
 * Formats a growing crop advisory message in Bangla
 * 
 * @param crop - Crop batch information
 * @param weather - Weather data
 * @param riskLevel - Calculated risk level
 * @returns Formatted advisory message with actions
 */
export function formatGrowingAdvisory(
  crop: CropBatch,
  weather: WeatherData,
  riskLevel: RiskLevel
): AdvisoryMessage {
  let message = `আপনার ${crop.cropType} ফসল আবহাওয়ার কারণে ঝুঁকিতে রয়েছে। `;
  
  // Add harvest date reference if within 7 days
  if (crop.expectedHarvestDate) {
    const daysUntilHarvest = Math.ceil(
      (crop.expectedHarvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilHarvest >= 0 && daysUntilHarvest <= 7) {
      message += `আপনার ফসল ${daysUntilHarvest} দিনের মধ্যে কাটার সময়। `;
    }
  }

  message += `তাপমাত্রা ${weather.temperature}°C, আর্দ্রতা ${weather.humidity}%, ` +
    `বৃষ্টিপাত ${weather.rainfall}mm, বাতাসের গতি ${weather.windSpeed} m/s। ` +
    `সুরক্ষামূলক ব্যবস্থা নিন।`;

  // Generate actions based on weather conditions
  const actions = generateActionItems(crop, weather, riskLevel);

  return {
    message,
    actions,
    riskLevel
  };
}


