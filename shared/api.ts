/**
 * Shared API Types for Agricultural Management Application
 * 
 * This file contains all request/response interfaces for the MongoDB-integrated API.
 * These types ensure type consistency between client and server code.
 * 
 * Collections covered:
 * - Farmers: User registration, authentication, and profile management
 * - Crop Batches: Crop tracking from planting to harvest
 * - Health Scans: Disease detection and treatment tracking
 * - Loss Events: Crop loss recording and analytics
 * - Interventions: Treatment actions and success tracking
 * - Advisories: Notifications and recommendations
 * - Sessions: Authentication session management
 * - Weather Snapshots: Optional weather data caching
 * - Dashboard: Aggregated metrics for farmers and admins
 * 
 * Common types:
 * - Error responses with structured error information
 * - Pagination parameters and responses
 * - Query parameters for filtering and sorting
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Farmer API types
 */

export interface RegisterFarmerRequest {
  phone: string;
  password: string;
  name: string;
  division: string;
  district: string;
  upazila: string;
  language?: 'bn' | 'en';
  roles?: ('farmer' | 'admin')[];
}

export interface LoginFarmerRequest {
  phone: string;
  password: string;
}

export interface UpdateFarmerRequest {
  name?: string;
  division?: string;
  district?: string;
  upazila?: string;
  language?: 'bn' | 'en';
}

export interface FarmerResponse {
  _id: string;
  phone: string;
  name: string;
  division: string;
  district: string;
  upazila: string;
  language: 'bn' | 'en';
  roles: ('farmer' | 'admin')[];
  registeredAt: string;
  totalCrops?: number;
  totalWeight?: number;
  badges?: string[];
}

export interface LoginFarmerResponse {
  farmer: FarmerResponse;
  message: string;
}

/**
 * Crop Batch API types
 */

export interface CreateCropBatchRequest {
  farmerId: string;
  cropType: string;
  stage: 'growing' | 'harvested';
  // Growing stage fields
  estimatedWeightKg?: number;
  expectedHarvestDate?: string; // ISO date string
  // Harvested stage fields
  finalWeightKg?: number;
  actualHarvestDate?: string; // ISO date string
  storageLocation?: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
  storageDivision?: string;
  storageDistrict?: string;
  notes?: string;
  batchNumber?: string;
}

export interface UpdateCropBatchRequest {
  cropType?: string;
  estimatedWeightKg?: number;
  expectedHarvestDate?: string; // ISO date string
  finalWeightKg?: number;
  actualHarvestDate?: string; // ISO date string
  storageLocation?: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
  storageDivision?: string;
  storageDistrict?: string;
  lossPercentage?: number;
  notes?: string;
  batchNumber?: string;
}

export interface TransitionStageRequest {
  finalWeightKg: number;
  actualHarvestDate: string; // ISO date string
  storageLocation: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
  storageDivision: string;
  storageDistrict: string;
}

export interface CropBatchResponse {
  _id: string;
  farmerId: string;
  cropType: string;
  stage: 'growing' | 'harvested';
  estimatedWeightKg?: number;
  expectedHarvestDate?: string;
  finalWeightKg?: number;
  actualHarvestDate?: string;
  storageLocation?: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
  storageDivision?: string;
  storageDistrict?: string;
  enteredDate: string;
  lossPercentage?: number;
  notes?: string;
  batchNumber?: string;
}

export interface CropBatchListResponse {
  batches: CropBatchResponse[];
  total: number;
}

/**
 * Health Scan API types
 */

export interface CreateHealthScanRequest {
  farmerId: string;
  batchId?: string;
  diseaseLabel: string;
  confidence: number;
  remedyText?: string;
  imageUrl?: string;
  immediateFeedback?: 'correct' | 'incorrect' | 'unsure';
}

export interface UpdateHealthScanStatusRequest {
  status: 'pending' | 'resolved' | 'healthy';
}

export interface UpdateHealthScanOutcomeRequest {
  outcome: 'recovered' | 'same' | 'worse';
  immediateFeedback?: 'correct' | 'incorrect' | 'unsure';
}

export interface HealthScanResponse {
  _id: string;
  farmerId: string;
  batchId?: string;
  capturedAt: string;
  diseaseLabel: string;
  confidence: number;
  remedyText?: string;
  imageUrl?: string;
  immediateFeedback?: 'correct' | 'incorrect' | 'unsure';
  outcome?: 'recovered' | 'same' | 'worse';
  status: 'pending' | 'resolved' | 'healthy';
  riskLevel?: 'high' | 'medium' | 'low';
  groundingSources?: GroundingSource[];
  scanType?: 'disease' | 'pest';
}

export interface HealthScanListResponse {
  scans: HealthScanResponse[];
  total: number;
}

/**
 * Loss Event API types
 */

export interface CreateLossEventRequest {
  farmerId: string;
  batchId: string;
  eventType: string;
  lossPercentage: number;
  lossWeightKg: number;
  location: string;
}

export interface LossEventResponse {
  _id: string;
  farmerId: string;
  batchId: string;
  eventType: string;
  lossPercentage: number;
  lossWeightKg: number;
  reportedAt: string;
  location: string;
}

export interface LossEventListResponse {
  lossEvents: LossEventResponse[];
  total: number;
}

/**
 * Intervention API types
 */

export interface CreateInterventionRequest {
  farmerId: string;
  batchId: string;
  interventionType: string;
  success: boolean;
  notes?: string;
}

export interface InterventionResponse {
  _id: string;
  farmerId: string;
  batchId: string;
  interventionType: string;
  success: boolean;
  notes?: string;
  performedAt: string;
}

export interface InterventionListResponse {
  interventions: InterventionResponse[];
  total: number;
}

/**
 * Advisory API types
 */

export interface CreateAdvisoryRequest {
  farmerId?: string; // Optional - if not provided, it's a broadcast advisory
  source: 'weather' | 'scanner' | 'manual';
  message: string;
  actions?: string[];
}

export interface AdvisoryResponse {
  _id: string;
  farmerId?: string; // Undefined for broadcast advisories
  source: 'weather' | 'scanner' | 'manual';
  payload: {
    message: string;
    actions?: string[];
  };
  status: 'delivered' | 'read';
  createdAt: string;
}

export interface AdvisoryListResponse {
  advisories: AdvisoryResponse[];
  total: number;
}

/**
 * Dashboard API types
 */

export interface FarmerDashboardResponse {
  farmerId: string;
  totalCrops: number;
  totalWeightKg: number;
  growingCrops: number;
  harvestedCrops: number;
  totalLossWeightKg: number;
  totalLossPercentage: number;
  interventionSuccessRate: number;
  badges: string[];
}

export interface AdminDashboardResponse {
  totalFarmers: number;
  totalCropBatches: number;
  totalGrowingBatches: number;
  totalHarvestedBatches: number;
  totalLossWeightKg: number;
  averageLossPercentage: number;
  interventionSuccessRate: number;
  topLossLocations: Array<{
    location: string;
    totalLossWeightKg: number;
    totalEvents: number;
  }>;
}

/**
 * Session API types
 */

export interface CreateSessionRequest {
  farmerId: string;
  authType: 'otp' | 'password';
  expiresAt: string; // ISO date string
  deviceMeta?: {
    userAgent?: string;
    ip?: string;
  };
}

export interface SessionResponse {
  _id: string;
  farmerId: string;
  authType: 'otp' | 'password';
  expiresAt: string;
  deviceMeta?: {
    userAgent?: string;
    ip?: string;
  };
  createdAt: string;
}

export interface ValidateSessionRequest {
  sessionId: string;
  farmerId: string;
}

export interface ValidateSessionResponse {
  valid: boolean;
  session?: SessionResponse;
  message?: string;
}

/**
 * Weather Snapshot API types
 */

export interface CreateWeatherSnapshotRequest {
  division: string;
  district: string;
  upazila: string;
  payload: Record<string, any>; // Flexible structure for weather API response
}

export interface WeatherSnapshotResponse {
  _id: string;
  division: string;
  district: string;
  upazila: string;
  payload: Record<string, any>;
  capturedAt: string;
}

export interface WeatherSnapshotListResponse {
  snapshots: WeatherSnapshotResponse[];
  total: number;
}

export interface WeatherSnapshotQueryParams {
  division?: string;
  district?: string;
  upazila?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  limit?: number;
}

/**
 * Weather API types for OpenWeatherMap integration
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface WeatherData {
  location: Coordinates;
  temperature: number;        // Celsius
  feelsLike: number;         // Celsius
  humidity: number;          // Percentage
  pressure: number;          // hPa
  windSpeed: number;         // m/s
  windDirection: number;     // degrees
  rainfall: number;          // mm (last hour)
  weatherCondition: string;  // "Clear", "Clouds", "Rain", etc.
  weatherDescription: string; // "light rain", "clear sky", etc.
  weatherIcon: string;       // OpenWeather icon code
  visibility: number;        // meters
  cloudiness: number;        // percentage
  sunrise: string;           // ISO date string
  sunset: string;            // ISO date string
  fetchedAt: string;         // ISO date string
  source: string;            // "openweathermap" or "cache"
  cacheStatus?: 'hit' | 'miss' | 'expired';
}

export interface DailyForecast {
  date: string;              // ISO date string
  tempMin: number;           // Celsius
  tempMax: number;           // Celsius
  humidity: number;          // Percentage
  rainfall: number;          // mm
  weatherCondition: string;
  weatherDescription: string;
  weatherIcon: string;
  precipitationProbability: number; // 0-1
}

export interface HourlyForecast {
  time: string;              // ISO date string
  temperature: number;       // Celsius
  humidity: number;          // Percentage
  rainfall: number;          // mm
  weatherCondition: string;
  windSpeed: number;         // m/s
}

export interface ForecastData {
  location: Coordinates;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  fetchedAt: string;         // ISO date string
  source: string;            // "openweathermap" or "cache"
}

export interface Advisory {
  type: 'heat' | 'rainfall' | 'humidity' | 'wind' | 'general';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  actions: string[];
  conditions: {
    temperature?: number;
    rainfall?: number;
    humidity?: number;
    windSpeed?: number;
  };
}

export interface WeatherResponse {
  success: boolean;
  data: WeatherData;
  advisories?: Advisory[];
  message?: string;
}

export interface ForecastResponse {
  success: boolean;
  data: ForecastData;
  message?: string;
}

export interface WeatherErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
  fallbackData?: WeatherData;
}

export interface WeatherUsageStats {
  dailyCallCount: number;
  dailyLimit: number;
  percentUsed: number;
  remainingCalls: number;
  warningThreshold: number;
  lastResetDate: string;
}

export interface WeatherUsageResponse {
  success: boolean;
  data: WeatherUsageStats;
  message?: string;
}

/**
 * Common API types
 */

export interface ErrorResponse {
  error: {
    type: 'ValidationError' | 'NotFoundError' | 'ConflictError' | 'DatabaseError' | 'AuthenticationError' | 'AuthorizationError';
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Query parameter types for filtering
 */

export interface FarmerQueryParams extends PaginationParams {
  division?: string;
  district?: string;
  upazila?: string;
  role?: 'farmer' | 'admin';
}

export interface CropBatchQueryParams extends PaginationParams {
  farmerId?: string;
  stage?: 'growing' | 'harvested';
  cropType?: string;
  storageDivision?: string;
  storageDistrict?: string;
}

export interface HealthScanQueryParams extends PaginationParams {
  farmerId?: string;
  batchId?: string;
  status?: 'pending' | 'resolved' | 'healthy';
  diseaseLabel?: string;
}

export interface LossEventQueryParams extends PaginationParams {
  farmerId?: string;
  batchId?: string;
  eventType?: string;
  location?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface InterventionQueryParams extends PaginationParams {
  farmerId?: string;
  batchId?: string;
  interventionType?: string;
  success?: boolean;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface AdvisoryQueryParams extends PaginationParams {
  farmerId?: string;
  source?: 'weather' | 'scanner' | 'manual';
  status?: 'delivered' | 'read';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Scanner API types
 */

export interface AnalyzeScanRequest {
  farmerId: string;
  batchId?: string;
  image: File; // Sent as multipart/form-data
}

export interface PestIdentification {
  pestName: string;
  scientificName: string;
  riskLevel: 'high' | 'medium' | 'low';
  confidence: number;
  affectedArea: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface AnalyzeScanResponse {
  scan: HealthScanResponse;
  analysis: {
    scanType: 'disease' | 'pest';
    diseases: Array<{
      name: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high';
      affectedArea: string;
    }>;
    pests?: PestIdentification[];
    riskLevel?: 'high' | 'medium' | 'low';
    overallHealth: 'healthy' | 'minor_issues' | 'major_issues';
    recommendations: string[];
    preventiveMeasures: string[];
    groundingSources?: GroundingSource[];
  };
  message: string;
}

export interface ScannerErrorResponse {
  error: {
    type: 'ValidationError' | 'GeminiAPIError' | 'ImageProcessingError' | 'NetworkError';
    message: string;
    details?: {
      geminiError?: string;
      retryAfter?: number;
    };
    timestamp: string;
  };
}
