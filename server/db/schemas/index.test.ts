import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  FarmerSchema,
  CropBatchSchema,
  HealthScanSchema,
  LossEventSchema,
  InterventionSchema,
  AdvisorySchema,
  SessionSchema,
  WeatherSnapshotSchema
} from './index';

describe('Schema Validation', () => {
  describe('FarmerSchema', () => {
    it('should validate a valid farmer document', () => {
      const validFarmer = {
        phone: '+8801234567890',
        passwordHash: 'hashed_password',
        name: 'John Doe',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn' as const,
        roles: ['farmer' as const]
      };

      const result = FarmerSchema.safeParse(validFarmer);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const invalidFarmer = {
        phone: '1234567890', // Missing +880 prefix
        passwordHash: 'hashed_password',
        name: 'John Doe',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      const result = FarmerSchema.safeParse(invalidFarmer);
      expect(result.success).toBe(false);
    });
  });

  describe('CropBatchSchema', () => {
    it('should validate a valid growing stage crop batch', () => {
      const validBatch = {
        farmerId: new ObjectId(),
        cropType: 'Rice',
        stage: 'growing' as const,
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2024-12-31')
      };

      const result = CropBatchSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
    });

    it('should validate a valid harvested stage crop batch', () => {
      const validBatch = {
        farmerId: new ObjectId(),
        cropType: 'Rice',
        stage: 'harvested' as const,
        finalWeightKg: 95,
        actualHarvestDate: new Date('2024-11-15'),
        storageLocation: 'silo' as const,
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka'
      };

      const result = CropBatchSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
    });

    it('should reject negative weight', () => {
      const invalidBatch = {
        farmerId: new ObjectId(),
        cropType: 'Rice',
        stage: 'growing' as const,
        estimatedWeightKg: -10
      };

      const result = CropBatchSchema.safeParse(invalidBatch);
      expect(result.success).toBe(false);
    });
  });

  describe('HealthScanSchema', () => {
    it('should validate a valid health scan', () => {
      const validScan = {
        farmerId: new ObjectId(),
        diseaseLabel: 'Leaf Blight',
        confidence: 85.5,
        status: 'pending' as const
      };

      const result = HealthScanSchema.safeParse(validScan);
      expect(result.success).toBe(true);
    });

    it('should reject confidence outside 0-100 range', () => {
      const invalidScan = {
        farmerId: new ObjectId(),
        diseaseLabel: 'Leaf Blight',
        confidence: 150
      };

      const result = HealthScanSchema.safeParse(invalidScan);
      expect(result.success).toBe(false);
    });
  });

  describe('LossEventSchema', () => {
    it('should validate a valid loss event', () => {
      const validEvent = {
        farmerId: new ObjectId(),
        batchId: new ObjectId(),
        eventType: 'Pest Damage',
        lossPercentage: 15,
        lossWeightKg: 10,
        location: 'Field A'
      };

      const result = LossEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject loss percentage over 100', () => {
      const invalidEvent = {
        farmerId: new ObjectId(),
        batchId: new ObjectId(),
        eventType: 'Pest Damage',
        lossPercentage: 150,
        lossWeightKg: 10,
        location: 'Field A'
      };

      const result = LossEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('InterventionSchema', () => {
    it('should validate a valid intervention', () => {
      const validIntervention = {
        farmerId: new ObjectId(),
        batchId: new ObjectId(),
        interventionType: 'Pesticide Application',
        success: true,
        notes: 'Applied organic pesticide'
      };

      const result = InterventionSchema.safeParse(validIntervention);
      expect(result.success).toBe(true);
    });
  });

  describe('AdvisorySchema', () => {
    it('should validate a farmer-specific advisory', () => {
      const validAdvisory = {
        farmerId: new ObjectId(),
        source: 'weather' as const,
        payload: {
          message: 'Heavy rain expected tomorrow'
        }
      };

      const result = AdvisorySchema.safeParse(validAdvisory);
      expect(result.success).toBe(true);
    });

    it('should validate a broadcast advisory (no farmerId)', () => {
      const validAdvisory = {
        source: 'manual' as const,
        payload: {
          message: 'New farming techniques available',
          actions: ['Visit training center']
        }
      };

      const result = AdvisorySchema.safeParse(validAdvisory);
      expect(result.success).toBe(true);
    });
  });

  describe('SessionSchema', () => {
    it('should validate a valid session', () => {
      const validSession = {
        farmerId: new ObjectId(),
        authType: 'password' as const,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      };

      const result = SessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });
  });

  describe('WeatherSnapshotSchema', () => {
    it('should validate a valid weather snapshot', () => {
      const validSnapshot = {
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103]
        },
        temperature: 28,
        feelsLike: 30,
        humidity: 75,
        pressure: 1013,
        windSpeed: 10,
        windDirection: 180,
        rainfall: 0,
        weatherCondition: 'Clear',
        weatherDescription: 'clear sky',
        weatherIcon: '01d',
        visibility: 10000,
        cloudiness: 0,
        sunrise: new Date(),
        sunset: new Date(),
        expiresAt: new Date(Date.now() + 3600 * 1000)
      };

      const result = WeatherSnapshotSchema.safeParse(validSnapshot);
      expect(result.success).toBe(true);
    });
  });
});
