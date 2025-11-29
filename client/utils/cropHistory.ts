/**
 * Crop History Tracking Utility
 * 
 * This module provides functionality to track which crop types a farmer has
 * previously used in their crop batches. This enables features like:
 * - Prioritizing frequently used crops in the selection UI
 * - Showing crop usage statistics
 * - Providing personalized crop recommendations
 * 
 * Requirements Coverage:
 * - Requirement 7.1: Tracks which crop types each farmer has used
 * - Requirement 7.3: Maintains full list of all available crops while highlighting used ones
 */

import { apiService } from '@/services/api';
import type { CropBatchResponse } from '@shared/api';

export interface CropHistoryEntry {
  cropType: string;
  count: number;
  lastUsed: string; // ISO date string
}

export interface CropHistory {
  uniqueCropTypes: string[];
  cropUsageStats: CropHistoryEntry[];
  totalBatches: number;
}

/**
 * Fetch and analyze crop history for a farmer
 * 
 * @param farmerId - The farmer's unique identifier
 * @returns CropHistory object containing unique crop types and usage statistics
 */
export async function fetchCropHistory(farmerId: string): Promise<CropHistory> {
  try {
    // Fetch all crop batches for the farmer
    const batches = await apiService.fetchCropBatches(farmerId);
    
    return analyzeCropHistory(batches);
  } catch (error) {
    console.error('Error fetching crop history:', error);
    // Return empty history on error
    return {
      uniqueCropTypes: [],
      cropUsageStats: [],
      totalBatches: 0,
    };
  }
}

/**
 * Analyze crop batches to extract history information
 * 
 * @param batches - Array of crop batch responses
 * @returns CropHistory object with analyzed data
 */
export function analyzeCropHistory(batches: CropBatchResponse[]): CropHistory {
  if (!batches || batches.length === 0) {
    return {
      uniqueCropTypes: [],
      cropUsageStats: [],
      totalBatches: 0,
    };
  }

  // Track crop usage with counts and last used dates
  const cropUsageMap = new Map<string, { count: number; lastUsed: string }>();

  batches.forEach((batch) => {
    const cropType = batch.cropType;
    const batchDate = batch.enteredDate;

    if (cropUsageMap.has(cropType)) {
      const existing = cropUsageMap.get(cropType)!;
      cropUsageMap.set(cropType, {
        count: existing.count + 1,
        // Keep the most recent date
        lastUsed: new Date(batchDate) > new Date(existing.lastUsed) 
          ? batchDate 
          : existing.lastUsed,
      });
    } else {
      cropUsageMap.set(cropType, {
        count: 1,
        lastUsed: batchDate,
      });
    }
  });

  // Convert map to array and sort by usage count (descending)
  const cropUsageStats: CropHistoryEntry[] = Array.from(cropUsageMap.entries())
    .map(([cropType, stats]) => ({
      cropType,
      count: stats.count,
      lastUsed: stats.lastUsed,
    }))
    .sort((a, b) => b.count - a.count);

  // Extract unique crop types (ordered by frequency)
  const uniqueCropTypes = cropUsageStats.map((entry) => entry.cropType);

  return {
    uniqueCropTypes,
    cropUsageStats,
    totalBatches: batches.length,
  };
}

/**
 * Get frequently used crop types (used more than once)
 * 
 * @param history - CropHistory object
 * @returns Array of crop type IDs that have been used multiple times
 */
export function getFrequentCropTypes(history: CropHistory): string[] {
  return history.cropUsageStats
    .filter((entry) => entry.count > 1)
    .map((entry) => entry.cropType);
}

/**
 * Check if a farmer has used a specific crop type before
 * 
 * @param history - CropHistory object
 * @param cropType - Crop type ID to check
 * @returns true if the farmer has used this crop type before
 */
export function hasUsedCropType(history: CropHistory, cropType: string): boolean {
  return history.uniqueCropTypes.includes(cropType);
}

/**
 * Sort crop types by prioritizing previously used crops
 * 
 * @param allCropTypes - Array of all available crop type IDs
 * @param history - CropHistory object
 * @returns Sorted array with previously used crops first, then others
 */
export function sortCropTypesByHistory(
  allCropTypes: string[],
  history: CropHistory
): string[] {
  const usedCrops = new Set(history.uniqueCropTypes);
  
  // Separate into used and unused
  const used = allCropTypes.filter((id) => usedCrops.has(id));
  const unused = allCropTypes.filter((id) => !usedCrops.has(id));
  
  // Sort used crops by frequency (using history order which is already sorted)
  const sortedUsed = history.uniqueCropTypes.filter((id) => 
    allCropTypes.includes(id)
  );
  
  // Combine: frequently used first, then other used, then unused
  return [...sortedUsed, ...used.filter(id => !sortedUsed.includes(id)), ...unused];
}
