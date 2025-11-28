import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { LossEventsRepository } from '../db/repositories/lossEvents.repository';
import { InterventionsRepository } from '../db/repositories/interventions.repository';
import { DashboardService } from './dashboard.service';
import { Farmer, CropBatch, LossEvent, Intervention } from '../db/schemas';
import { hashPassword } from '../utils/password';

describe('DashboardService', () => {
  let farmersRepository: FarmersRepository;
  let cropBatchesRepository: CropBatchesRepository;
  let lossEventsRepository: LossEventsRepository;
  let interventionsRepository: InterventionsRepository;
  let dashboardService: DashboardService;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    
    farmersRepository = new FarmersRepository(db);
    cropBatchesRepository = new CropBatchesRepository(db);
    lossEventsRepository = new LossEventsRepository(db);
    interventionsRepository = new InterventionsRepository(db);
    
    dashboardService = new DashboardService(
      farmersRepository,
      cropBatchesRepository,
      lossEventsRepository,
      interventionsRepository
    );
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    const db = getDatabase();
    await db.collection('farmers').deleteMany({});
    await db.collection('crop_batches').deleteMany({});
    await db.collection('loss_events').deleteMany({});
    await db.collection('interventions').deleteMany({});
  });

  describe('getFarmerDashboard', () => {
    it('should return correct metrics for a farmer with no data', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567890',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const metrics = await dashboardService.getFarmerDashboard(farmer._id!);

      expect(metrics.farmerId).toEqual(farmer._id);
      expect(metrics.totalCrops).toBe(0);
      expect(metrics.totalWeightKg).toBe(0);
      expect(metrics.growingCrops).toBe(0);
      expect(metrics.harvestedCrops).toBe(0);
      expect(metrics.totalLossWeightKg).toBe(0);
      expect(metrics.totalLossPercentage).toBe(0);
      expect(metrics.interventionSuccessRate).toBe(0);
      expect(metrics.badges).toEqual([]);
    });

    it('should calculate total crops and weight correctly', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567891',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      // Create growing batch
      await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      // Create harvested batches
      await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'harvested',
        finalWeightKg: 450,
        actualHarvestDate: new Date('2024-11-01'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka',
        enteredDate: new Date()
      });

      await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Wheat',
        stage: 'harvested',
        finalWeightKg: 300,
        actualHarvestDate: new Date('2024-10-15'),
        storageLocation: 'jute_bag',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka',
        enteredDate: new Date()
      });

      const metrics = await dashboardService.getFarmerDashboard(farmer._id!);

      expect(metrics.totalCrops).toBe(3);
      expect(metrics.growingCrops).toBe(1);
      expect(metrics.harvestedCrops).toBe(2);
      expect(metrics.totalWeightKg).toBe(750); // 450 + 300
    });

    it('should calculate loss metrics correctly', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567892',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const batch = await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      // Create loss events
      await lossEventsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        eventType: 'pest',
        lossPercentage: 10,
        lossWeightKg: 50,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });

      await lossEventsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        eventType: 'disease',
        lossPercentage: 15,
        lossWeightKg: 75,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });

      const metrics = await dashboardService.getFarmerDashboard(farmer._id!);

      expect(metrics.totalLossWeightKg).toBe(125); // 50 + 75
      expect(metrics.totalLossPercentage).toBe(12.5); // (10 + 15) / 2
    });

    it('should calculate intervention success rate correctly', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567893',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const batch = await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      // Create interventions (3 successful, 1 failed)
      await interventionsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        interventionType: 'pesticide',
        success: true,
        performedAt: new Date()
      });

      await interventionsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        interventionType: 'fertilizer',
        success: true,
        performedAt: new Date()
      });

      await interventionsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        interventionType: 'irrigation',
        success: true,
        performedAt: new Date()
      });

      await interventionsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        interventionType: 'weeding',
        success: false,
        performedAt: new Date()
      });

      const metrics = await dashboardService.getFarmerDashboard(farmer._id!);

      expect(metrics.interventionSuccessRate).toBe(75); // 3/4 * 100
    });

    it('should award first_harvest badge', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567894',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'harvested',
        finalWeightKg: 450,
        actualHarvestDate: new Date('2024-11-01'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka',
        enteredDate: new Date()
      });

      const metrics = await dashboardService.getFarmerDashboard(farmer._id!);

      expect(metrics.badges).toContain('first_harvest');
    });

    it('should award high_yield badge for 1000+ kg', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567895',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'harvested',
        finalWeightKg: 1200,
        actualHarvestDate: new Date('2024-11-01'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka',
        enteredDate: new Date()
      });

      const metrics = await dashboardService.getFarmerDashboard(farmer._id!);

      expect(metrics.badges).toContain('first_harvest');
      expect(metrics.badges).toContain('high_yield');
    });
  });

  describe('getAdminDashboard', () => {
    it('should return correct metrics with no data', async () => {
      const metrics = await dashboardService.getAdminDashboard();

      expect(metrics.totalFarmers).toBe(0);
      expect(metrics.totalCropBatches).toBe(0);
      expect(metrics.totalGrowingBatches).toBe(0);
      expect(metrics.totalHarvestedBatches).toBe(0);
      expect(metrics.totalLossWeightKg).toBe(0);
      expect(metrics.averageLossPercentage).toBe(0);
      expect(metrics.interventionSuccessRate).toBe(0);
      expect(metrics.topLossLocations).toEqual([]);
    });

    it('should calculate total farmers and crop batches correctly', async () => {
      // Create farmers
      const farmer1 = await farmersRepository.create({
        phone: '+8801234567896',
        passwordHash: await hashPassword('password123'),
        name: 'Farmer 1',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const farmer2 = await farmersRepository.create({
        phone: '+8801234567897',
        passwordHash: await hashPassword('password123'),
        name: 'Farmer 2',
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Rangunia',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      // Create crop batches
      await cropBatchesRepository.create({
        farmerId: farmer1._id!,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      await cropBatchesRepository.create({
        farmerId: farmer1._id!,
        cropType: 'Wheat',
        stage: 'harvested',
        finalWeightKg: 300,
        actualHarvestDate: new Date('2024-10-15'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka',
        enteredDate: new Date()
      });

      await cropBatchesRepository.create({
        farmerId: farmer2._id!,
        cropType: 'Rice',
        stage: 'harvested',
        finalWeightKg: 450,
        actualHarvestDate: new Date('2024-11-01'),
        storageLocation: 'jute_bag',
        storageDivision: 'Chittagong',
        storageDistrict: 'Chittagong',
        enteredDate: new Date()
      });

      const metrics = await dashboardService.getAdminDashboard();

      expect(metrics.totalFarmers).toBe(2);
      expect(metrics.totalCropBatches).toBe(3);
      expect(metrics.totalGrowingBatches).toBe(1);
      expect(metrics.totalHarvestedBatches).toBe(2);
    });

    it('should calculate system-wide loss metrics correctly', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567898',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const batch = await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      // Create loss events
      await lossEventsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        eventType: 'pest',
        lossPercentage: 10,
        lossWeightKg: 50,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });

      await lossEventsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        eventType: 'disease',
        lossPercentage: 20,
        lossWeightKg: 100,
        reportedAt: new Date(),
        location: 'Chittagong, Rangunia'
      });

      const metrics = await dashboardService.getAdminDashboard();

      expect(metrics.totalLossWeightKg).toBe(150); // 50 + 100
      expect(metrics.averageLossPercentage).toBe(15); // (10 + 20) / 2
    });

    it('should calculate system-wide intervention success rate correctly', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567899',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const batch = await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      // Create interventions (4 successful, 1 failed)
      for (let i = 0; i < 4; i++) {
        await interventionsRepository.create({
          farmerId: farmer._id!,
          batchId: batch._id!,
          interventionType: 'pesticide',
          success: true,
          performedAt: new Date()
        });
      }

      await interventionsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        interventionType: 'weeding',
        success: false,
        performedAt: new Date()
      });

      const metrics = await dashboardService.getAdminDashboard();

      expect(metrics.interventionSuccessRate).toBe(80); // 4/5 * 100
    });

    it('should return top loss locations', async () => {
      const farmer = await farmersRepository.create({
        phone: '+8801234567800',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const batch = await cropBatchesRepository.create({
        farmerId: farmer._id!,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      // Create loss events in different locations
      await lossEventsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        eventType: 'pest',
        lossPercentage: 10,
        lossWeightKg: 100,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });

      await lossEventsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        eventType: 'disease',
        lossPercentage: 15,
        lossWeightKg: 50,
        reportedAt: new Date(),
        location: 'Chittagong, Rangunia'
      });

      await lossEventsRepository.create({
        farmerId: farmer._id!,
        batchId: batch._id!,
        eventType: 'weather',
        lossPercentage: 20,
        lossWeightKg: 75,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });

      const metrics = await dashboardService.getAdminDashboard();

      expect(metrics.topLossLocations.length).toBeGreaterThan(0);
      expect(metrics.topLossLocations[0].location).toBe('Dhaka, Savar');
      expect(metrics.topLossLocations[0].totalLossWeightKg).toBe(175); // 100 + 75
      expect(metrics.topLossLocations[0].totalEvents).toBe(2);
    });
  });
});
