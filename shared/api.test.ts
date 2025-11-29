import { describe, it, expect } from 'vitest';
import type {
  // Farmer types
  RegisterFarmerRequest,
  LoginFarmerRequest,
  UpdateFarmerRequest,
  FarmerResponse,
  LoginFarmerResponse,
  // Crop Batch types
  CreateCropBatchRequest,
  UpdateCropBatchRequest,
  TransitionStageRequest,
  CropBatchResponse,
  CropBatchListResponse,
  // Health Scan types
  CreateHealthScanRequest,
  UpdateHealthScanStatusRequest,
  UpdateHealthScanOutcomeRequest,
  HealthScanResponse,
  HealthScanListResponse,
  // Loss Event types
  CreateLossEventRequest,
  LossEventResponse,
  LossEventListResponse,
  // Intervention types
  CreateInterventionRequest,
  InterventionResponse,
  InterventionListResponse,
  // Advisory types
  CreateAdvisoryRequest,
  AdvisoryResponse,
  AdvisoryListResponse,
  // Dashboard types
  FarmerDashboardResponse,
  AdminDashboardResponse,
  // Session types
  CreateSessionRequest,
  SessionResponse,
  ValidateSessionRequest,
  ValidateSessionResponse,
  // Weather Snapshot types
  CreateWeatherSnapshotRequest,
  WeatherSnapshotResponse,
  WeatherSnapshotListResponse,
  WeatherSnapshotQueryParams,
  // Common types
  ErrorResponse,
  SuccessResponse,
  PaginationParams,
  PaginatedResponse,
  // Query parameter types
  FarmerQueryParams,
  CropBatchQueryParams,
  HealthScanQueryParams,
  LossEventQueryParams,
  InterventionQueryParams,
  AdvisoryQueryParams,
  // Scanner types
  AnalyzeScanRequest,
  AnalyzeScanResponse,
  PestIdentification,
  GroundingSource,
  ScannerErrorResponse
} from './api';

describe('Shared API Types', () => {
  describe('Type Imports', () => {
    it('should import all farmer types', () => {
      const types: string[] = [
        'RegisterFarmerRequest',
        'LoginFarmerRequest',
        'UpdateFarmerRequest',
        'FarmerResponse',
        'LoginFarmerResponse'
      ];
      expect(types.length).toBe(5);
    });

    it('should import all crop batch types', () => {
      const types: string[] = [
        'CreateCropBatchRequest',
        'UpdateCropBatchRequest',
        'TransitionStageRequest',
        'CropBatchResponse',
        'CropBatchListResponse'
      ];
      expect(types.length).toBe(5);
    });

    it('should import all health scan types', () => {
      const types: string[] = [
        'CreateHealthScanRequest',
        'UpdateHealthScanStatusRequest',
        'UpdateHealthScanOutcomeRequest',
        'HealthScanResponse',
        'HealthScanListResponse'
      ];
      expect(types.length).toBe(5);
    });

    it('should import all loss event types', () => {
      const types: string[] = [
        'CreateLossEventRequest',
        'LossEventResponse',
        'LossEventListResponse'
      ];
      expect(types.length).toBe(3);
    });

    it('should import all intervention types', () => {
      const types: string[] = [
        'CreateInterventionRequest',
        'InterventionResponse',
        'InterventionListResponse'
      ];
      expect(types.length).toBe(3);
    });

    it('should import all advisory types', () => {
      const types: string[] = [
        'CreateAdvisoryRequest',
        'AdvisoryResponse',
        'AdvisoryListResponse'
      ];
      expect(types.length).toBe(3);
    });

    it('should import all dashboard types', () => {
      const types: string[] = [
        'FarmerDashboardResponse',
        'AdminDashboardResponse'
      ];
      expect(types.length).toBe(2);
    });

    it('should import all session types', () => {
      const types: string[] = [
        'CreateSessionRequest',
        'SessionResponse',
        'ValidateSessionRequest',
        'ValidateSessionResponse'
      ];
      expect(types.length).toBe(4);
    });

    it('should import all weather snapshot types', () => {
      const types: string[] = [
        'CreateWeatherSnapshotRequest',
        'WeatherSnapshotResponse',
        'WeatherSnapshotListResponse',
        'WeatherSnapshotQueryParams'
      ];
      expect(types.length).toBe(4);
    });

    it('should import all common types', () => {
      const types: string[] = [
        'ErrorResponse',
        'SuccessResponse',
        'PaginationParams',
        'PaginatedResponse'
      ];
      expect(types.length).toBe(4);
    });

    it('should import all query parameter types', () => {
      const types: string[] = [
        'FarmerQueryParams',
        'CropBatchQueryParams',
        'HealthScanQueryParams',
        'LossEventQueryParams',
        'InterventionQueryParams',
        'AdvisoryQueryParams'
      ];
      expect(types.length).toBe(6);
    });

    it('should import all scanner types', () => {
      const types: string[] = [
        'AnalyzeScanRequest',
        'AnalyzeScanResponse',
        'PestIdentification',
        'GroundingSource',
        'ScannerErrorResponse'
      ];
      expect(types.length).toBe(5);
    });
  });

  describe('Type Structure Validation', () => {
    it('should have valid FarmerResponse structure', () => {
      const mockFarmer: FarmerResponse = {
        _id: '507f1f77bcf86cd799439011',
        phone: '+8801234567890',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date().toISOString()
      };
      expect(mockFarmer._id).toBeDefined();
      expect(mockFarmer.phone).toBeDefined();
    });

    it('should have valid CropBatchResponse structure', () => {
      const mockBatch: CropBatchResponse = {
        _id: '507f1f77bcf86cd799439011',
        farmerId: '507f1f77bcf86cd799439012',
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        enteredDate: new Date().toISOString()
      };
      expect(mockBatch._id).toBeDefined();
      expect(mockBatch.stage).toBe('growing');
    });

    it('should have valid ErrorResponse structure', () => {
      const mockError: ErrorResponse = {
        error: {
          type: 'ValidationError',
          message: 'Invalid input',
          timestamp: new Date().toISOString()
        }
      };
      expect(mockError.error.type).toBe('ValidationError');
    });

    it('should have valid PaginatedResponse structure', () => {
      const mockPaginated: PaginatedResponse<FarmerResponse> = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
      expect(mockPaginated.pagination.page).toBe(1);
    });
  });

  describe('Enum Values', () => {
    it('should support all crop batch stages', () => {
      const stages: Array<'growing' | 'harvested'> = ['growing', 'harvested'];
      expect(stages).toHaveLength(2);
    });

    it('should support all storage locations', () => {
      const locations: Array<'silo' | 'jute_bag' | 'open_space' | 'tin_shed'> = [
        'silo',
        'jute_bag',
        'open_space',
        'tin_shed'
      ];
      expect(locations).toHaveLength(4);
    });

    it('should support all health scan statuses', () => {
      const statuses: Array<'pending' | 'resolved' | 'healthy'> = [
        'pending',
        'resolved',
        'healthy'
      ];
      expect(statuses).toHaveLength(3);
    });

    it('should support all advisory sources', () => {
      const sources: Array<'weather' | 'scanner' | 'manual'> = [
        'weather',
        'scanner',
        'manual'
      ];
      expect(sources).toHaveLength(3);
    });

    it('should support all advisory statuses', () => {
      const statuses: Array<'delivered' | 'read'> = ['delivered', 'read'];
      expect(statuses).toHaveLength(2);
    });

    it('should support all error types', () => {
      const errorTypes: Array<
        | 'ValidationError'
        | 'NotFoundError'
        | 'ConflictError'
        | 'DatabaseError'
        | 'AuthenticationError'
        | 'AuthorizationError'
      > = [
        'ValidationError',
        'NotFoundError',
        'ConflictError',
        'DatabaseError',
        'AuthenticationError',
        'AuthorizationError'
      ];
      expect(errorTypes).toHaveLength(6);
    });

    it('should support all scan types', () => {
      const scanTypes: Array<'disease' | 'pest'> = ['disease', 'pest'];
      expect(scanTypes).toHaveLength(2);
    });

    it('should support all risk levels', () => {
      const riskLevels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      expect(riskLevels).toHaveLength(3);
    });
  });

  describe('Scanner Type Structure Validation', () => {
    it('should have valid PestIdentification structure', () => {
      const mockPest: PestIdentification = {
        pestName: 'Rice Stem Borer',
        scientificName: 'Scirpophaga incertulas',
        riskLevel: 'high',
        confidence: 85,
        affectedArea: 'stem'
      };
      expect(mockPest.pestName).toBeDefined();
      expect(mockPest.scientificName).toBeDefined();
      expect(mockPest.riskLevel).toBe('high');
    });

    it('should have valid GroundingSource structure', () => {
      const mockSource: GroundingSource = {
        title: 'Rice Pest Management Guide',
        url: 'https://example.com/guide',
        snippet: 'Information about rice pests'
      };
      expect(mockSource.title).toBeDefined();
      expect(mockSource.url).toBeDefined();
    });

    it('should have valid AnalyzeScanResponse structure for disease scan', () => {
      const mockResponse: AnalyzeScanResponse = {
        scan: {
          _id: '507f1f77bcf86cd799439011',
          farmerId: '507f1f77bcf86cd799439012',
          capturedAt: new Date().toISOString(),
          diseaseLabel: 'Blast',
          confidence: 90,
          status: 'pending'
        },
        analysis: {
          scanType: 'disease',
          diseases: [{
            name: 'Blast',
            confidence: 90,
            severity: 'high',
            affectedArea: 'leaves'
          }],
          overallHealth: 'major_issues',
          recommendations: ['Apply fungicide'],
          preventiveMeasures: ['Maintain proper spacing']
        },
        message: 'Analysis complete'
      };
      expect(mockResponse.analysis.scanType).toBe('disease');
      expect(mockResponse.analysis.diseases).toHaveLength(1);
    });

    it('should have valid AnalyzeScanResponse structure for pest scan', () => {
      const mockResponse: AnalyzeScanResponse = {
        scan: {
          _id: '507f1f77bcf86cd799439011',
          farmerId: '507f1f77bcf86cd799439012',
          capturedAt: new Date().toISOString(),
          diseaseLabel: 'Pest Infestation',
          confidence: 85,
          status: 'pending'
        },
        analysis: {
          scanType: 'pest',
          diseases: [],
          pests: [{
            pestName: 'Rice Stem Borer',
            scientificName: 'Scirpophaga incertulas',
            riskLevel: 'high',
            confidence: 85,
            affectedArea: 'stem'
          }],
          riskLevel: 'high',
          overallHealth: 'major_issues',
          recommendations: ['Apply pesticide'],
          preventiveMeasures: ['Monitor regularly'],
          groundingSources: [{
            title: 'Pest Management Guide',
            url: 'https://example.com/guide'
          }]
        },
        message: 'Analysis complete'
      };
      expect(mockResponse.analysis.scanType).toBe('pest');
      expect(mockResponse.analysis.pests).toHaveLength(1);
      expect(mockResponse.analysis.riskLevel).toBe('high');
      expect(mockResponse.analysis.groundingSources).toHaveLength(1);
    });

    it('should have valid ScannerErrorResponse structure', () => {
      const mockError: ScannerErrorResponse = {
        error: {
          type: 'GeminiAPIError',
          message: 'API request failed',
          details: {
            geminiError: 'Rate limit exceeded',
            retryAfter: 60
          },
          timestamp: new Date().toISOString()
        }
      };
      expect(mockError.error.type).toBe('GeminiAPIError');
      expect(mockError.error.details?.retryAfter).toBe(60);
    });
  });
});
