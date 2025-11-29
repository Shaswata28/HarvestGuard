/**
 * Integration tests for WeatherAdvisoryService with SmartAlertService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { WeatherAdvisoryService } from './weatherAdvisory.service';
import { SmartAlertService } from './smartAlert.service';
import { AdvisoryService } from './advisory.service';
import type { AdvisoriesRepository } from '../db/repositories/advisories.repository';
import type { FarmersRepository } from '../db/repositories/farmers.repository';
import type { CropBatchesRepository } from '../db/repositories/cropBatches.repository';

// Mock the weather service
vi.mock('./weather.service', () => ({
  getWeatherForFarmer: vi.fn().mockResolvedValue({
    temperature: 35,
    humidity: 85,
    rainfall: 60,
    windSpeed: 12,
    description: 'Heavy rain expected'
  }),
  generateAdvisories: vi.fn().mockReturnValue([
    {
      message: 'Heavy rain expected in your area',
      actions: ['Secure crops', 'Check drainage']
    }
  ])
}));

describe('WeatherAdvisoryService Integration', () => {
  let weatherAdvisoryService: WeatherAdvisoryService;
  let smartAlertService: SmartAlertService;
  let mockAdvisoryService: any;
  let mockAdvisoriesRepository: any;
  let mockFarmersRepository: any;
  let mockCropBatchesRepository: any;

  beforeEach(() => {
    // Create mock repositories
    mockAdvisoriesRepository = {
      findRecentByFarmerAndType: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((advisory) => 
        Promise.resolve({ ...advisory, _id: new ObjectId() })
      )
    } as unknown as AdvisoriesRepository;

    mockFarmersRepository = {
      findById: vi.fn().mockResolvedValue({
        _id: new ObjectId(),
        phone: '+8801712345678',
        name: 'Test Farmer'
      })
    } as unknown as FarmersRepository;

    mockCropBatchesRepository = {
      findByFarmerId: vi.fn().mockResolvedValue([
        {
          _id: new ObjectId(),
          farmerId: new ObjectId(),
          cropType: 'ধান',
          stage: 'harvested',
          storageLocation: 'open_space',
          storageDivision: 'Dhaka',
          storageDistrict: 'Dhaka'
        }
      ])
    } as unknown as CropBatchesRepository;

    // Create mock advisory service
    mockAdvisoryService = {
      createFarmerAdvisory: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          _id: new ObjectId(),
          farmerId: data.farmerId,
          source: data.source,
          payload: {
            message: data.message,
            actions: data.actions || []
          },
          status: 'delivered',
          createdAt: new Date()
        })
      )
    } as unknown as AdvisoryService;

    // Create SmartAlertService
    smartAlertService = new SmartAlertService(
      mockCropBatchesRepository,
      mockFarmersRepository,
      mockAdvisoryService
    );

    // Create WeatherAdvisoryService with SmartAlertService
    weatherAdvisoryService = new WeatherAdvisoryService(
      mockAdvisoryService,
      mockAdvisoriesRepository,
      mockFarmersRepository,
      mockCropBatchesRepository,
      smartAlertService
    );
  });

  describe('generateForFarmer with SmartAlertService', () => {
    it('should generate both weather advisories and smart alerts', async () => {
      const farmerId = new ObjectId();

      const advisories = await weatherAdvisoryService.generateForFarmer(farmerId);

      // Should create weather advisory
      expect(advisories.length).toBeGreaterThan(0);
      
      // Should have called createFarmerAdvisory multiple times
      // (once for weather advisory, potentially more for smart alerts)
      expect(mockAdvisoryService.createFarmerAdvisory).toHaveBeenCalled();
    });

    it('should continue if SmartAlertService fails', async () => {
      // Make SmartAlertService throw an error
      const failingSmartAlertService = {
        generateAlertsForFarmer: vi.fn().mockRejectedValue(new Error('Smart alert failed')),
        storeAlertsAsAdvisories: vi.fn()
      } as unknown as SmartAlertService;

      const serviceWithFailingSmartAlert = new WeatherAdvisoryService(
        mockAdvisoryService,
        mockAdvisoriesRepository,
        mockFarmersRepository,
        mockCropBatchesRepository,
        failingSmartAlertService
      );

      const farmerId = new ObjectId();

      // Should not throw error
      const advisories = await serviceWithFailingSmartAlert.generateForFarmer(farmerId);

      // Should still create weather advisories
      expect(advisories.length).toBeGreaterThan(0);
    });

    it('should work without SmartAlertService (backward compatibility)', async () => {
      // Create service without SmartAlertService
      const serviceWithoutSmartAlert = new WeatherAdvisoryService(
        mockAdvisoryService,
        mockAdvisoriesRepository,
        mockFarmersRepository,
        mockCropBatchesRepository
      );

      const farmerId = new ObjectId();

      const advisories = await serviceWithoutSmartAlert.generateForFarmer(farmerId);

      // Should still create weather advisories
      expect(advisories.length).toBeGreaterThan(0);
    });
  });
});
