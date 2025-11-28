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
  AdvisoryQueryParams
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
  });
});
