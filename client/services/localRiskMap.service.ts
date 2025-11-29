/**
 * Local Risk Map Service
 * Handles fetching farmer data for the local risk map feature
 * Requirements: 2.3, 2.4, 2.5
 */

import { apiService, ApiError } from './api';
import type { FarmerData } from '../types/localRiskMap';

/**
 * Fetch farmer's location, weather, crop info, risk level, and advisory from database
 * 
 * @param farmerId - The ID of the farmer
 * @returns Promise resolving to FarmerData with actual data from database
 * @throws ApiError if the request fails
 * 
 * Requirements: 2.3, 2.4, 2.5
 */
export async function fetchFarmerDataForRiskMap(farmerId: string): Promise<FarmerData> {
  try {
    const data = await apiService.fetchFarmerDataForRiskMap(farmerId);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      // Re-throw API errors with context
      throw new ApiError(
        error.statusCode,
        error.type,
        `Failed to fetch farmer data for risk map: ${error.message}`,
        error.details
      );
    }
    
    // Handle network errors or other unexpected errors
    throw new Error(`Failed to fetch farmer data for risk map: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Error handler for risk map data fetching
 * Provides user-friendly error messages in Bangla
 * 
 * @param error - The error that occurred
 * @returns User-friendly error message in Bangla
 */
export function getRiskMapErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 404:
        return 'কৃষক তথ্য পাওয়া যায়নি। পরে আবার চেষ্টা করুন।';
      case 500:
        return 'সার্ভার সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।';
      default:
        return 'আপনার তথ্য লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।';
    }
  }
  
  // Network or other errors
  return 'আপনার তথ্য লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।';
}
