/**
 * Tests for SmartAlertService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { SmartAlertService } from './smartAlert.service';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { AdvisoryService } from './advisory.service';
import type { CropBatch, Farmer } from '../db/schemas';
import type { WeatherData } from '../utils/riskCalculator';

describe('SmartAlertService', () => {
  let service: SmartAlertService;
  let mockCropBatchesRepo: any;
  let mockFarmersRepo: any;
  let mockAdvisoryService: any;

  beforeEach(() => {
    // Create mock repositories
    mockCropBatchesRepo = {
      findByFarmerId: vi.fn()
    };

    mockFarmersRepo = {
      findById: vi.fn()
    };

    mockAdvisoryService = {
      createFarmerAdvisory: vi.fn()
    };

    service = new SmartAlertService(
      mockCropBatchesRepo as any,
      mockFarmersRepo as any,
      mockAdvisoryService as any
    );
  });

  describe('generateAlertsForFarmer', () => {
    it('should return empty array when farmer has no crops', async () => {
      const farmerId = new ObjectId();
      const weather: WeatherData = {
        temperature: 25,
        humidity: 60,
        rainfall: 0,
        windSpeed: 5
      };

      mockCropBatchesRepo.findByFarmerId.mockResolvedValue([]);

      const alerts = await service.generateAlertsForFarmer(farmerId, weather);

      expect(alerts).toEqual([]);
      expect(mockCropBatchesRepo.findByFarmerId).toHaveBeenCalledWith(farmerId);
    });

    it('should generate alerts for harvested crops with high humidity', async () => {
      const farmerId = new ObjectId();
      const cropId = new ObjectId();
      const weather: WeatherData = {
        temperature: 36,
        humidity: 85,
        rainfall: 10,
        windSpeed: 5
      };

      const crop: CropBatch = {
        _id: cropId,
        farmerId,
        cropType: 'ধান',
        stage: 'harvested',
        storageLocation: 'open_space',
        storageDivision: 'ঢাকা',
        storageDistrict: 'গাজীপুর',
        finalWeightKg: 100,
        enteredDate: new Date()
      };

      mockCropBatchesRepo.findByFarmerId.mockResolvedValue([crop]);

      const alerts = await service.generateAlertsForFarmer(farmerId, weather);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].cropType).toBe('ধান');
      expect(alerts[0].stage).toBe('harvested');
      expect(alerts[0].riskLevel).toBeDefined();
      expect(alerts[0].message).toBeTruthy();
      expect(alerts[0].actions.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate alerts for growing crops with extreme weather', async () => {
      const farmerId = new ObjectId();
      const cropId = new ObjectId();
      const weather: WeatherData = {
        temperature: 40,
        humidity: 70,
        rainfall: 80,
        windSpeed: 15
      };

      const crop: CropBatch = {
        _id: cropId,
        farmerId,
        cropType: 'গম',
        stage: 'growing',
        estimatedWeightKg: 150,
        expectedHarvestDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        enteredDate: new Date()
      };

      mockCropBatchesRepo.findByFarmerId.mockResolvedValue([crop]);

      const alerts = await service.generateAlertsForFarmer(farmerId, weather);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].cropType).toBe('গম');
      expect(alerts[0].stage).toBe('growing');
      expect(alerts[0].riskLevel).toBeDefined();
    });

    it('should not generate alerts for low risk conditions', async () => {
      const farmerId = new ObjectId();
      const cropId = new ObjectId();
      const weather: WeatherData = {
        temperature: 25,
        humidity: 55,
        rainfall: 5,
        windSpeed: 3
      };

      const crop: CropBatch = {
        _id: cropId,
        farmerId,
        cropType: 'ধান',
        stage: 'harvested',
        storageLocation: 'silo',
        finalWeightKg: 100,
        enteredDate: new Date()
      };

      mockCropBatchesRepo.findByFarmerId.mockResolvedValue([crop]);

      const alerts = await service.generateAlertsForFarmer(farmerId, weather);

      expect(alerts).toEqual([]);
    });

    it('should generate separate alerts for multiple crops', async () => {
      const farmerId = new ObjectId();
      const weather: WeatherData = {
        temperature: 38,
        humidity: 85,
        rainfall: 60,
        windSpeed: 12
      };

      const crops: CropBatch[] = [
        {
          _id: new ObjectId(),
          farmerId,
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'open_space',
          finalWeightKg: 100,
          enteredDate: new Date()
        },
        {
          _id: new ObjectId(),
          farmerId,
          cropType: 'গম',
          stage: 'growing',
          estimatedWeightKg: 150,
          enteredDate: new Date()
        }
      ];

      mockCropBatchesRepo.findByFarmerId.mockResolvedValue(crops);

      const alerts = await service.generateAlertsForFarmer(farmerId, weather);

      expect(alerts.length).toBe(2);
      expect(alerts[0].cropType).not.toBe(alerts[1].cropType);
    });
  });

  describe('storeAlertsAsAdvisories', () => {
    it('should store all alerts as advisories', async () => {
      const farmerId = new ObjectId();
      const alerts = [
        {
          farmerId,
          cropId: new ObjectId(),
          cropType: 'ধান',
          stage: 'harvested' as const,
          riskLevel: 'High' as const,
          message: 'Test message',
          actions: ['Action 1', 'Action 2'],
          weatherConditions: {
            temperature: 35,
            humidity: 85,
            rainfall: 20,
            windSpeed: 10
          },
          generatedAt: new Date()
        }
      ];

      mockAdvisoryService.createFarmerAdvisory.mockResolvedValue({
        _id: new ObjectId(),
        farmerId,
        source: 'weather',
        payload: {
          message: alerts[0].message,
          actions: alerts[0].actions
        },
        status: 'delivered',
        createdAt: new Date()
      });

      const count = await service.storeAlertsAsAdvisories(alerts);

      expect(count).toBe(1);
      expect(mockAdvisoryService.createFarmerAdvisory).toHaveBeenCalledWith({
        farmerId,
        source: 'weather',
        message: alerts[0].message,
        actions: alerts[0].actions
      });
    });

    it('should simulate SMS for critical alerts', async () => {
      const farmerId = new ObjectId();
      const farmer: Farmer = {
        _id: farmerId,
        phone: '+8801712345678',
        passwordHash: 'hash',
        name: 'Test Farmer',
        division: 'ঢাকা',
        district: 'গাজীপুর',
        upazila: 'কালিয়াকৈর',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      };

      const alerts = [
        {
          farmerId,
          cropId: new ObjectId(),
          cropType: 'ধান',
          stage: 'harvested' as const,
          riskLevel: 'Critical' as const,
          message: 'Critical alert message',
          actions: ['Action 1', 'Action 2'],
          weatherConditions: {
            temperature: 42,
            humidity: 95,
            rainfall: 150,
            windSpeed: 20
          },
          generatedAt: new Date()
        }
      ];

      mockAdvisoryService.createFarmerAdvisory.mockResolvedValue({
        _id: new ObjectId(),
        farmerId,
        source: 'weather',
        payload: {
          message: alerts[0].message,
          actions: alerts[0].actions
        },
        status: 'delivered',
        createdAt: new Date()
      });

      mockFarmersRepo.findById.mockResolvedValue(farmer);

      // Spy on console.log to verify SMS simulation
      const consoleSpy = vi.spyOn(console, 'log');

      const count = await service.storeAlertsAsAdvisories(alerts);

      expect(count).toBe(1);
      expect(mockFarmersRepo.findById).toHaveBeenCalledWith(farmerId);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMS ALERT')
      );

      consoleSpy.mockRestore();
    });

    it('should return correct count for multiple alerts', async () => {
      const farmerId = new ObjectId();
      const alerts = [
        {
          farmerId,
          cropId: new ObjectId(),
          cropType: 'ধান',
          stage: 'harvested' as const,
          riskLevel: 'High' as const,
          message: 'Message 1',
          actions: ['Action 1'],
          weatherConditions: {
            temperature: 35,
            humidity: 85,
            rainfall: 20,
            windSpeed: 10
          },
          generatedAt: new Date()
        },
        {
          farmerId,
          cropId: new ObjectId(),
          cropType: 'গম',
          stage: 'growing' as const,
          riskLevel: 'Medium' as const,
          message: 'Message 2',
          actions: ['Action 2'],
          weatherConditions: {
            temperature: 35,
            humidity: 85,
            rainfall: 20,
            windSpeed: 10
          },
          generatedAt: new Date()
        }
      ];

      mockAdvisoryService.createFarmerAdvisory.mockResolvedValue({
        _id: new ObjectId(),
        farmerId,
        source: 'weather',
        payload: {},
        status: 'delivered',
        createdAt: new Date()
      });

      const count = await service.storeAlertsAsAdvisories(alerts);

      expect(count).toBe(2);
      expect(mockAdvisoryService.createFarmerAdvisory).toHaveBeenCalledTimes(2);
    });
  });
});
