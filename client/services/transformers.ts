import type { CropBatchResponse, HealthScanResponse, FarmerDashboardResponse } from '@shared/api';
import type { CropBatch, ScanRecord } from '@/utils/offlineStorage';

/**
 * Transform API responses to match existing UI data structures
 * Ensures backward compatibility with existing components
 */

export function transformCropBatch(apiResponse: CropBatchResponse): CropBatch {
  return {
    id: apiResponse._id,
    cropType: apiResponse.cropType,
    batchNumber: apiResponse.batchNumber,
    enteredDate: apiResponse.enteredDate,
    stage: apiResponse.stage,
    estimatedWeight: apiResponse.estimatedWeightKg,
    expectedHarvestDate: apiResponse.expectedHarvestDate,
    finalWeight: apiResponse.finalWeightKg,
    actualHarvestDate: apiResponse.actualHarvestDate,
    storageLocation: apiResponse.storageLocation,
    storageDivision: apiResponse.storageDivision,
    storageDistrict: apiResponse.storageDistrict,
  };
}

export function transformHealthScan(apiResponse: HealthScanResponse): ScanRecord {
  return {
    id: apiResponse._id,
    date: apiResponse.capturedAt,
    disease: apiResponse.diseaseLabel,
    confidence: apiResponse.confidence,
    remedy: apiResponse.remedyText,
    immediateFeedback: apiResponse.immediateFeedback,
    outcome: apiResponse.outcome,
  };
}

export function transformDashboardMetrics(apiResponse: FarmerDashboardResponse) {
  return {
    totalCrops: apiResponse.totalCrops,
    totalWeight: apiResponse.totalWeightKg,
    growingCrops: apiResponse.growingCrops,
    harvestedCrops: apiResponse.harvestedCrops,
    badges: apiResponse.badges,
    lossWeight: apiResponse.totalLossWeightKg,
    lossPercentage: apiResponse.totalLossPercentage,
    interventionSuccessRate: apiResponse.interventionSuccessRate,
  };
}

export function transformCropBatchArray(apiResponses: CropBatchResponse[]): CropBatch[] {
  return apiResponses.map(transformCropBatch);
}

export function transformHealthScanArray(apiResponses: HealthScanResponse[]): ScanRecord[] {
  return apiResponses.map(transformHealthScan);
}
