/**
 * Bangla Advisory Generator for Local Risk Map
 * Generates simple Bangla advisory messages combining weather conditions
 * with crop information to provide actionable guidance for farmers.
 * 
 * Requirements: 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import type { WeatherConditions, CropInfo, RiskLevel } from '../types/localRiskMap';

/**
 * Converts Western numerals (0-9) to Bangla numerals (০-৯)
 * 
 * @param num - Number to convert
 * @returns String with Bangla numerals
 * 
 * Requirement 6.4: Bangla numerals in advisories
 */
export function toBanglaNumerals(num: number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(Math.round(num))
    .split('')
    .map(digit => banglaDigits[parseInt(digit)] || digit)
    .join('');
}

/**
 * Determines the most urgent weather threat based on conditions
 * 
 * Priority order (highest to lowest):
 * 1. High rainfall (>70%) - immediate harvest loss risk
 * 2. High temperature (>35°C) - crop stress and spoilage
 * 3. High humidity (>80%) - disease and pest risk
 * 
 * @param weather - Weather conditions
 * @returns Most urgent threat type
 * 
 * Requirement 6.6: Threat prioritization in advisories
 */
function determinePrimaryThreat(weather: WeatherConditions): 'rain' | 'heat' | 'humidity' | null {
  // High rainfall is most urgent
  if (weather.rainfall > 70) {
    return 'rain';
  }
  
  // High temperature is second priority
  if (weather.temperature > 35) {
    return 'heat';
  }
  
  // High humidity is third priority
  if (weather.humidity > 80) {
    return 'humidity';
  }
  
  // Check for moderate threats
  if (weather.rainfall > 40) {
    return 'rain';
  }
  
  if (weather.temperature > 32) {
    return 'heat';
  }
  
  if (weather.humidity > 70) {
    return 'humidity';
  }
  
  return null;
}

/**
 * Generates rain-specific advisory
 * 
 * @param weather - Weather conditions
 * @param crop - Crop information
 * @returns Bangla advisory message
 * 
 * Requirement 6.1: High rain → harvest/cover recommendations
 */
function generateRainAdvisory(weather: WeatherConditions, crop: CropInfo): string {
  const rainValue = toBanglaNumerals(weather.rainfall);
  
  // Critical: Harvest-ready crops with high rain
  if (crop.cropStage === 'harvest-ready' && weather.rainfall > 70) {
    return `আগামী ৩ দিন বৃষ্টি ${rainValue}% → আজই ${crop.cropType} কাটুন অথবা ঢেকে রাখুন`;
  }
  
  // Harvested crops need protection
  if (crop.cropStage === 'harvested' && weather.rainfall > 60) {
    return `বৃষ্টির সম্ভাবনা ${rainValue}% → ${crop.cropType} ঢেকে রাখুন, ভিজতে দেবেন না`;
  }
  
  // Harvest-ready with moderate rain
  if (crop.cropStage === 'harvest-ready') {
    return `বৃষ্টির সম্ভাবনা ${rainValue}% → ${crop.cropType} তাড়াতাড়ি কাটার পরিকল্পনা করুন`;
  }
  
  // Growing crops need drainage
  return `বৃষ্টির সম্ভাবনা ${rainValue}% → ${crop.cropType} ক্ষেতে জল জমতে দেবেন না`;
}

/**
 * Generates heat-specific advisory
 * 
 * @param weather - Weather conditions
 * @param crop - Crop information
 * @returns Bangla advisory message
 * 
 * Requirement 6.2: High temperature → irrigation recommendations
 */
function generateHeatAdvisory(weather: WeatherConditions, crop: CropInfo): string {
  const tempValue = toBanglaNumerals(weather.temperature);
  
  // Extreme heat with field storage
  if (weather.temperature > 38 && crop.storageType === 'field') {
    return `তাপমাত্রা ${tempValue}°C → দুপুরে ${crop.cropType} কাটবেন না, সকাল/সন্ধ্যায় কাটুন`;
  }
  
  // High heat with harvest-ready crops
  if (weather.temperature > 35 && crop.cropStage === 'harvest-ready') {
    return `তাপমাত্রা ${tempValue}°C → ${crop.cropType} কাটার সময় সকাল বা সন্ধ্যা বেছে নিন`;
  }
  
  // High heat with growing crops
  if (weather.temperature > 35) {
    return `তাপমাত্রা ${tempValue}°C → সকালে বা সন্ধ্যায় ${crop.cropType} ক্ষেতে সেচ দিন`;
  }
  
  // Moderate heat
  return `তাপমাত্রা ${tempValue}°C → ${crop.cropType} ক্ষেতে নিয়মিত সেচ দিন`;
}

/**
 * Generates humidity-specific advisory
 * 
 * @param weather - Weather conditions
 * @param crop - Crop information
 * @returns Bangla advisory message
 * 
 * Requirement 6.3: High humidity → pest monitoring recommendations
 */
function generateHumidityAdvisory(weather: WeatherConditions, crop: CropInfo): string {
  const humidityValue = toBanglaNumerals(weather.humidity);
  
  // High humidity with harvested crops
  if (weather.humidity > 85 && crop.cropStage === 'harvested') {
    return `আর্দ্রতা ${humidityValue}% → ${crop.cropType} দ্রুত শুকান, ছত্রাক রোগ হতে পারে`;
  }
  
  // High humidity with harvest-ready crops
  if (weather.humidity > 80 && crop.cropStage === 'harvest-ready') {
    return `আর্দ্রতা ${humidityValue}% → ${crop.cropType} কাটার পর ভালো করে শুকাতে হবে`;
  }
  
  // High humidity with growing crops
  if (weather.humidity > 80) {
    return `আর্দ্রতা ${humidityValue}% → ${crop.cropType} ক্ষেতে পোকামাকড়ের জন্য পরীক্ষা করুন`;
  }
  
  // Moderate humidity
  return `আর্দ্রতা ${humidityValue}% → ${crop.cropType} ক্ষেতে রোগ দেখা দিলে ব্যবস্থা নিন`;
}

/**
 * Generates a simple Bangla advisory message combining weather forecast
 * with crop-specific guidance
 * 
 * Message Format: [Weather Condition + Value] → [Specific Action]
 * Example: "আগামী ৩ দিন বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"
 * 
 * @param weather - Weather conditions
 * @param crop - Crop information
 * @param riskLevel - Calculated risk level
 * @returns Bangla advisory message
 * 
 * Requirements:
 * - 5.2: Simple Bangla advisory message
 * - 5.4: Actionable advice in simple Bangla
 * - 6.1: Rain → harvest/cover
 * - 6.2: Heat → irrigate
 * - 6.3: Humidity → monitor pests
 * - 6.4: Bangla numerals
 * - 6.5: Arrow symbol (→) connector
 * - 6.6: Threat prioritization
 */
export function generateBanglaAdvisory(
  weather: WeatherConditions,
  crop: CropInfo,
  riskLevel: RiskLevel
): string {
  // Determine the most urgent threat
  const primaryThreat = determinePrimaryThreat(weather);
  
  // Generate advisory based on primary threat
  switch (primaryThreat) {
    case 'rain':
      return generateRainAdvisory(weather, crop);
    
    case 'heat':
      return generateHeatAdvisory(weather, crop);
    
    case 'humidity':
      return generateHumidityAdvisory(weather, crop);
    
    default:
      // No significant threat - general advice
      if (riskLevel === 'Low') {
        return `আবহাওয়া স্বাভাবিক → ${crop.cropType} ক্ষেতের নিয়মিত পরিচর্যা করুন`;
      }
      return `আবহাওয়া পরীক্ষা করুন → ${crop.cropType} ক্ষেতে সতর্ক থাকুন`;
  }
}
