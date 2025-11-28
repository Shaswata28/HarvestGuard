import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { LossEventsRepository } from '../db/repositories/lossEvents.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchService } from './cropBatch.service';
import { ValidationError, NotFoundError } from '../utils/errors';
import { hashPassword } from '../utils/password';

describe('CropBatchService', () => {
  let service: CropBatchService;
  let cropBatchesRepository: CropBatchesRepository;
  let lossEventsRepository: LossEventsRepository;
  let farmersRepository: FarmersRepository;
  let testFarmerId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    
    cropBatchesRepository = new CropBatchesRepository(db);
    lossEventsRepository = new LossEventsRepository(db);
    farmersRepository = new FarmersRepository(db);
    service = new CropBatchService(cropBatchesRepository, lossEventsRepository);

    // Create a test farmer
    const passwordHash = await hashPassword('testpass123');
    const farmer = await farmersRepository.create({
      phone: '+8801700000099',
      passwordHash,
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer'],
      registeredAt: new Date()
    });
    testFarmerId = farmer._id!;
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('crop_batches').deleteMany({});
    await db.collection('loss_events').deleteMany({});
    await db.collection('farmers').deleteMany({});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up crop batches and loss events before each test
    const db = getDatabase();
    await db.collection('crop_batches').deleteMany({});
    await db.collection('loss_events').deleteMany({});
  });

  describe('createGrowingBatch', () => {
    it('should create a growing crop batch with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const batch = await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow,
        notes: 'Test batch'
      });

      expect(batch._id).toBeDefined();
      expect(batch.farmerId.toString()).toBe(testFarmerId.toString());
      expect(batch.cropType).toBe('Rice');
      expect(batch.stage).toBe('growing');
      expect(batch.estimatedWeightKg).toBe(100);
      expect(batch.notes).toBe('Test batch');
    });

    it('should reject empty crop type', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      await expect(
        service.createGrowingBatch({
          farmerId: testFarmerId,
          cropType: '   ',
          estimatedWeightKg: 100,
          expectedHarvestDate: tomorrow
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject negative weight', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      await expect(
        service.createGrowingBatch({
          farmerId: testFarmerId,
          cropType: 'Rice',
          estimatedWeightKg: -10,
          expectedHarvestDate: tomorrow
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject past expected harvest date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await expect(
        service.createGrowingBatch({
          farmerId: testFarmerId,
          cropType: 'Rice',
          estimatedWeightKg: 100,
          expectedHarvestDate: yesterday
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('createHarvestedBatch', () => {
    it('should create a harvested crop batch with valid data', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const batch = await service.createHarvestedBatch({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        finalWeightKg: 95,
        actualHarvestDate: yesterday,
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Gazipur'
      });

      expect(batch._id).toBeDefined();
      expect(batch.stage).toBe('harvested');
      expect(batch.finalWeightKg).toBe(95);
      expect(batch.storageLocation).toBe('silo');
      expect(batch.storageDivision).toBe('Dhaka');
      expect(batch.storageDistrict).toBe('Gazipur');
    });

    it('should reject future actual harvest date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await expect(
        service.createHarvestedBatch({
          farmerId: testFarmerId,
          cropType: 'Wheat',
          finalWeightKg: 95,
          actualHarvestDate: tomorrow,
          storageLocation: 'silo',
          storageDivision: 'Dhaka',
          storageDistrict: 'Gazipur'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty storage location fields', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await expect(
        service.createHarvestedBatch({
          farmerId: testFarmerId,
          cropType: 'Wheat',
          finalWeightKg: 95,
          actualHarvestDate: yesterday,
          storageLocation: 'silo',
          storageDivision: '   ',
          storageDistrict: 'Gazipur'
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('transitionToHarvested', () => {
    it('should transition a growing batch to harvested', async () => {
      // Create a growing batch
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const growingBatch = await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      // Transition to harvested
      const today = new Date();
      const harvestedBatch = await service.transitionToHarvested(growingBatch._id!, {
        finalWeightKg: 95,
        actualHarvestDate: today,
        storageLocation: 'jute_bag',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka'
      });

      expect(harvestedBatch.stage).toBe('harvested');
      expect(harvestedBatch.finalWeightKg).toBe(95);
      expect(harvestedBatch.storageLocation).toBe('jute_bag');
      expect(harvestedBatch.estimatedWeightKg).toBe(100); // Should preserve growing stage data
    });

    it('should reject transition of already harvested batch', async () => {
      // Create a harvested batch
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const harvestedBatch = await service.createHarvestedBatch({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        finalWeightKg: 95,
        actualHarvestDate: yesterday,
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Gazipur'
      });

      // Try to transition again
      await expect(
        service.transitionToHarvested(harvestedBatch._id!, {
          finalWeightKg: 90,
          actualHarvestDate: new Date(),
          storageLocation: 'tin_shed',
          storageDivision: 'Dhaka',
          storageDistrict: 'Dhaka'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject transition with non-existent batch', async () => {
      const fakeBatchId = new ObjectId();

      await expect(
        service.transitionToHarvested(fakeBatchId, {
          finalWeightKg: 95,
          actualHarvestDate: new Date(),
          storageLocation: 'silo',
          storageDivision: 'Dhaka',
          storageDistrict: 'Dhaka'
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBatchById', () => {
    it('should retrieve an existing batch', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const created = await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      const retrieved = await service.getBatchById(created._id!);
      expect(retrieved._id!.toString()).toBe(created._id!.toString());
      expect(retrieved.cropType).toBe('Rice');
    });

    it('should throw NotFoundError for non-existent batch', async () => {
      const fakeBatchId = new ObjectId();
      await expect(service.getBatchById(fakeBatchId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBatchesByFarmerId', () => {
    it('should retrieve all batches for a farmer', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        estimatedWeightKg: 80,
        expectedHarvestDate: tomorrow
      });

      const batches = await service.getBatchesByFarmerId(testFarmerId);
      expect(batches).toHaveLength(2);
    });

    it('should filter batches by stage', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      await service.createHarvestedBatch({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        finalWeightKg: 95,
        actualHarvestDate: yesterday,
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Gazipur'
      });

      const growingBatches = await service.getBatchesByFarmerId(testFarmerId, 'growing');
      const harvestedBatches = await service.getBatchesByFarmerId(testFarmerId, 'harvested');

      expect(growingBatches).toHaveLength(1);
      expect(harvestedBatches).toHaveLength(1);
      expect(growingBatches[0].stage).toBe('growing');
      expect(harvestedBatches[0].stage).toBe('harvested');
    });
  });

  describe('calculateBatchLoss', () => {
    it('should calculate loss statistics for a batch with loss events', async () => {
      // Create a growing batch
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const batch = await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      // Create loss events
      await lossEventsRepository.create({
        farmerId: testFarmerId,
        batchId: batch._id!,
        eventType: 'pest',
        lossPercentage: 10,
        lossWeightKg: 10,
        reportedAt: new Date(),
        location: 'Dhaka'
      });

      await lossEventsRepository.create({
        farmerId: testFarmerId,
        batchId: batch._id!,
        eventType: 'weather',
        lossPercentage: 5,
        lossWeightKg: 5,
        reportedAt: new Date(),
        location: 'Dhaka'
      });

      const stats = await service.calculateBatchLoss(batch._id!);

      expect(stats.totalLossEvents).toBe(2);
      expect(stats.totalLossWeightKg).toBe(15);
      expect(stats.totalLossPercentage).toBe(15);
      expect(stats.currentBatchLossPercentage).toBe(15); // 15kg / 100kg = 15%
    });

    it('should return zero statistics for batch with no loss events', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const batch = await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      const stats = await service.calculateBatchLoss(batch._id!);

      expect(stats.totalLossEvents).toBe(0);
      expect(stats.totalLossWeightKg).toBe(0);
      expect(stats.totalLossPercentage).toBe(0);
      expect(stats.currentBatchLossPercentage).toBe(0);
    });
  });

  describe('updateBatchLossPercentage', () => {
    it('should update loss percentage on a batch', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const batch = await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      const updated = await service.updateBatchLossPercentage(batch._id!, 12.5);

      expect(updated.lossPercentage).toBe(12.5);
    });

    it('should reject invalid loss percentage', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30);

      const batch = await service.createGrowingBatch({
        farmerId: testFarmerId,
        cropType: 'Rice',
        estimatedWeightKg: 100,
        expectedHarvestDate: tomorrow
      });

      await expect(
        service.updateBatchLossPercentage(batch._id!, 150)
      ).rejects.toThrow(ValidationError);

      await expect(
        service.updateBatchLossPercentage(batch._id!, -10)
      ).rejects.toThrow(ValidationError);
    });
  });
});
