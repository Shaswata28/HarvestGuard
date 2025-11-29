/**
 * Action Item Generator Module
 * 
 * This module generates specific, actionable recommendations in Bangla
 * based on weather conditions, crop characteristics, and risk levels.
 * Actions are prioritized by urgency and limited to 2-5 items.
 */

import type { CropBatch } from '../db/schemas';
import type { WeatherData, RiskLevel } from './riskCalculator';

/**
 * Action item with priority
 */
interface ActionItem {
  text: string;
  priority: number; // Higher number = higher priority
}

/**
 * Generates action items for a crop based on weather conditions and risk level
 * 
 * @param crop - Crop batch information
 * @param weather - Weather data
 * @param riskLevel - Calculated risk level
 * @returns Array of 2-5 action items in Bangla, prioritized by urgency
 */
export function generateActionItems(
  crop: CropBatch,
  weather: WeatherData,
  riskLevel: RiskLevel
): string[] {
  const actions: ActionItem[] = [];

  if (crop.stage === 'harvested') {
    actions.push(...generateStorageActions(crop, weather, riskLevel));
  } else {
    actions.push(...generateGrowingActions(crop, weather, riskLevel));
  }

  // Sort by priority (descending)
  actions.sort((a, b) => b.priority - a.priority);

  // Extract text and ensure 2-5 items
  const actionTexts = actions.map(a => a.text);
  
  return ensureActionCountBounds(actionTexts);
}

/**
 * Generates storage-specific action items based on weather conditions
 * 
 * @param crop - Crop batch information
 * @param weather - Weather data
 * @param riskLevel - Calculated risk level
 * @returns Array of action items with priorities
 */
function generateStorageActions(
  crop: CropBatch,
  weather: WeatherData,
  riskLevel: RiskLevel
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Critical risk actions (highest priority)
  if (riskLevel === 'Critical') {
    actions.push({
      text: 'জরুরি: ফসল অবিলম্বে শুকিয়ে নিন',
      priority: 100
    });
  }

  // High humidity + high temperature = mold risk (very high priority)
  if (weather.humidity > 80 && weather.temperature > 30) {
    actions.push({
      text: 'ছাঁচ প্রতিরোধে ফসল নিয়মিত পরীক্ষা করুন',
      priority: 90
    });
  }

  // High humidity actions (high priority)
  if (weather.humidity > 80) {
    actions.push({
      text: 'গুদামে ফ্যান চালু করুন এবং বায়ুচলাচল বাড়ান',
      priority: 85
    });
  }

  // Rainfall + open storage (very high priority)
  if (weather.rainfall > 20 && crop.storageLocation === 'open_space') {
    actions.push({
      text: 'ফসল তাড়াতাড়ি ঢেকে রাখুন বা নিরাপদ স্থানে সরান',
      priority: 95
    });
    actions.push({
      text: 'পানি নিষ্কাশনের ব্যবস্থা করুন',
      priority: 80
    });
  }

  // High temperature actions (medium priority)
  if (weather.temperature > 35) {
    actions.push({
      text: 'গুদামের তাপমাত্রা কমাতে ছায়ার ব্যবস্থা করুন',
      priority: 70
    });
  }

  // Wind actions (medium priority)
  if (weather.windSpeed > 10) {
    actions.push({
      text: 'গুদামের দরজা-জানালা ভালোভাবে বন্ধ করুন',
      priority: 75
    });
  }

  // General monitoring actions (low priority)
  actions.push({
    text: 'ফসলের অবস্থা নিয়মিত পর্যবেক্ষণ করুন',
    priority: 30
  });
  
  actions.push({
    text: 'গুদামে আর্দ্রতা নিয়ন্ত্রণ করুন',
    priority: 40
  });

  return actions;
}

/**
 * Generates growing crop action items based on weather conditions
 * 
 * @param crop - Crop batch information
 * @param weather - Weather data
 * @param riskLevel - Calculated risk level
 * @returns Array of action items with priorities
 */
function generateGrowingActions(
  crop: CropBatch,
  weather: WeatherData,
  riskLevel: RiskLevel
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Critical risk actions (highest priority)
  if (riskLevel === 'Critical') {
    actions.push({
      text: 'জরুরি: ফসল রক্ষায় তাৎক্ষণিক ব্যবস্থা নিন',
      priority: 100
    });
  }

  // Heavy rainfall actions (high priority)
  if (weather.rainfall > 50) {
    actions.push({
      text: 'জমিতে পানি নিষ্কাশনের ব্যবস্থা করুন',
      priority: 90
    });
    actions.push({
      text: 'ফসল কাটা কয়েক দিন বিলম্বিত করুন',
      priority: 85
    });
  }

  // High temperature actions (high priority)
  if (weather.temperature > 35) {
    actions.push({
      text: 'নিয়মিত সেচ দিন এবং মাটির আর্দ্রতা বজায় রাখুন',
      priority: 88
    });
    actions.push({
      text: 'সম্ভব হলে ছায়ার ব্যবস্থা করুন',
      priority: 75
    });
  }

  // Strong wind actions (high priority)
  if (weather.windSpeed > 10) {
    actions.push({
      text: 'ফসল খুঁটি দিয়ে বেঁধে রাখুন',
      priority: 87
    });
    actions.push({
      text: 'ক্ষতিগ্রস্ত গাছ সরিয়ে ফেলুন',
      priority: 70
    });
  }

  // High humidity + temperature = fungal risk (medium-high priority)
  if (weather.humidity > 80 && weather.temperature > 30) {
    actions.push({
      text: 'ছত্রাকনাশক স্প্রে করার কথা বিবেচনা করুন',
      priority: 80
    });
  }

  // General monitoring actions (low priority)
  actions.push({
    text: 'ফসলের স্বাস্থ্য নিয়মিত পরীক্ষা করুন',
    priority: 30
  });
  
  actions.push({
    text: 'আবহাওয়ার পূর্বাভাস পর্যবেক্ষণ করুন',
    priority: 35
  });

  return actions;
}

/**
 * Ensures action count is between 2 and 5 items
 * 
 * @param actions - Array of action items
 * @returns Array with 2-5 items
 */
function ensureActionCountBounds(actions: string[]): string[] {
  // Remove duplicates while preserving order
  const uniqueActions = Array.from(new Set(actions));
  
  // Limit to 5 items
  const limitedActions = uniqueActions.slice(0, 5);
  
  // Ensure minimum 2 items
  if (limitedActions.length === 0) {
    return [
      'ফসলের অবস্থা নিয়মিত পর্যবেক্ষণ করুন',
      'আবহাওয়ার পূর্বাভাস পর্যবেক্ষণ করুন'
    ];
  } else if (limitedActions.length === 1) {
    return [
      ...limitedActions,
      'ফসলের অবস্থা নিয়মিত পর্যবেক্ষণ করুন'
    ];
  }
  
  return limitedActions;
}

/**
 * Validates if a string contains Bangla characters
 * Bangla Unicode range: U+0980 to U+09FF
 * 
 * @param text - Text to validate
 * @returns True if text contains Bangla characters
 */
export function containsBanglaText(text: string): boolean {
  const banglaRegex = /[\u0980-\u09FF]/;
  return banglaRegex.test(text);
}
