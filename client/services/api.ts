import type {
  FarmerDashboardResponse,
  CropBatchResponse,
  CropBatchQueryParams,
  CreateCropBatchRequest,
  UpdateCropBatchRequest,
  HealthScanResponse,
  HealthScanQueryParams,
  CreateHealthScanRequest,
  UpdateHealthScanOutcomeRequest,
  WeatherResponse,
  ForecastResponse,
  AdvisoryResponse,
  AdvisoryQueryParams,
  ErrorResponse,
} from '@shared/api';

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public type: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API response and throw ApiError on failure
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const errorData: ErrorResponse = await response.json();
      throw new ApiError(
        response.status,
        errorData.error.type,
        errorData.error.message,
        errorData.error.details
      );
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(
        response.status,
        'UnknownError',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
  }
  return response.json();
}

/**
 * API Service Layer
 * Provides type-safe methods for all backend API calls
 */
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const buildApiUrl = (path: string) => `${apiBaseUrl}${path}`;

export const apiService = {
  // Dashboard
  async fetchDashboardData(farmerId: string): Promise<FarmerDashboardResponse> {
    const response = await fetch(buildApiUrl(`/api/dashboard/farmer/${farmerId}`));
    return handleApiResponse<FarmerDashboardResponse>(response);
  },

  // Crop Batches
  async fetchCropBatches(farmerId: string, params?: CropBatchQueryParams): Promise<CropBatchResponse[]> {
    const queryParams = new URLSearchParams({ farmerId });
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.cropType) queryParams.append('cropType', params.cropType);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(buildApiUrl(`/api/crop-batches?${queryParams}`));
    const data = await handleApiResponse<{ batches: CropBatchResponse[] }>(response);
    return data.batches;
  },

  async createCropBatch(data: CreateCropBatchRequest): Promise<CropBatchResponse> {
    const response = await fetch(buildApiUrl('/api/crop-batches'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<CropBatchResponse>(response);
  },

  async updateCropBatch(id: string, data: UpdateCropBatchRequest): Promise<CropBatchResponse> {
    const response = await fetch(buildApiUrl(`/api/crop-batches/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<CropBatchResponse>(response);
  },

  async deleteCropBatch(id: string): Promise<void> {
    const response = await fetch(`/api/crop-batches/${id}`, {
      method: 'DELETE',
    });
    await handleApiResponse<void>(response);
  },

  async transitionCropStage(id: string, data: {
    finalWeightKg: number;
    actualHarvestDate: string;
    storageLocation: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
    storageDivision?: string;
    storageDistrict?: string;
  }): Promise<CropBatchResponse> {
    const response = await fetch(buildApiUrl(`/api/crop-batches/${id}/stage`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<CropBatchResponse>(response);
  },

  // Health Scans
  async fetchHealthScans(farmerId: string, limit?: number): Promise<HealthScanResponse[]> {
    const queryParams = new URLSearchParams({ farmerId });
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await fetch(buildApiUrl(`/api/health-scans?${queryParams}`));
    const data = await handleApiResponse<{ scans: HealthScanResponse[] }>(response);
    return data.scans;
  },

  async createHealthScan(data: CreateHealthScanRequest): Promise<HealthScanResponse> {
    const response = await fetch(buildApiUrl('/api/health-scans'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<HealthScanResponse>(response);
  },

  async updateHealthScanOutcome(
    id: string,
    data: UpdateHealthScanOutcomeRequest
  ): Promise<HealthScanResponse> {
    const response = await fetch(buildApiUrl(`/api/health-scans/${id}/outcome`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<HealthScanResponse>(response);
  },

  // Weather
  async fetchWeather(farmerId: string): Promise<WeatherResponse> {
    const response = await fetch(buildApiUrl(`/api/weather/current?farmerId=${farmerId}`));
    return handleApiResponse<WeatherResponse>(response);
  },

  async fetchForecast(farmerId: string): Promise<ForecastResponse> {
    const response = await fetch(buildApiUrl(`/api/weather/forecast?farmerId=${farmerId}`));
    return handleApiResponse<ForecastResponse>(response);
  },

  // Advisories
  async fetchAdvisories(farmerId: string, params?: AdvisoryQueryParams): Promise<AdvisoryResponse[]> {
    const queryParams = new URLSearchParams({ farmerId });
    if (params?.status) queryParams.append('status', params.status);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(buildApiUrl(`/api/advisories?${queryParams}`));
    const data = await handleApiResponse<{ advisories: AdvisoryResponse[] }>(response);
    return data.advisories;
  },

  async markAdvisoryRead(id: string, farmerId: string): Promise<void> {
    const response = await fetch(buildApiUrl(`/api/advisories/${id}/read`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmerId }),
    });
    await handleApiResponse<void>(response);
  },

  // Local Risk Map
  async fetchFarmerDataForRiskMap(farmerId: string): Promise<import('../types/localRiskMap').FarmerData> {
    const response = await fetch(buildApiUrl(`/api/farmers/${farmerId}/risk-map-data`));
    return handleApiResponse<import('../types/localRiskMap').FarmerData>(response);
  },
};
