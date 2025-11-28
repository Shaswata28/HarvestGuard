import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { LossEventsRepository } from './lossEvents.repository';
import { FarmersRepository } from './farmers.repository';
import { CropBatchesRepository } from './cropBatches.repository';
import { LossEvent } from '../schemas';

describe('LossEventsRepository', () => {
  let repository: LossEventsRepository;
  let farmersRepository: FarmersRepository;
  let cropBatchesRepository: CropBatchesRepository;
  let testFarmerId: ObjectId;
  let testBatchId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new LossEventsRepository(db);
    farmersRepository = new FarmersRepository(db);
    cropBatchesRepository = new CropBatchesRepository(db);

    // Create indexes
    await repository.createIndexes();

    // Create a test farmer
    const farmer = await farmersRepository.create({
      phone: '+8801234567890',
      passwordHash: 'hashedpassword123',
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer']
    });
    testFarmerId = farmer._id!;

    // Create a test crop batch
    const batch = await cropBatchesRepository.create({
      farmerId: testFarmerId,
      cropType: 'Rice',
      stage: 'growing',
      estimatedWeightKg: 1000,
      expectedHarvestDate: new Date('2024-12-31')
    });
    testBatchId = batch._id!;
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('loss_events').deleteMany({});
    await db.collection('crop_batches').deleteMany({});
    await db.collection('farmers').deleteMany({});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear loss events before each test
    const db = getDatabase();
    await db.collection('loss_events').deleteMany({});
  });

  describe('create', () => {
    it('should create a loss event with valid data', async () => {
      const lossEventData = {
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      };

      const created = await repository.create(lossEventData);

      expect(created._id).toBeInstanceOf(ObjectId);
      expect(created.farmerId).toEqual(testFarmerId);
      expect(created.batchId).toEqual(testBatchId);
      expect(created.eventType).toBe('pest_damage');
      expect(created.lossPercentage).toBe(15);
      expect(created.lossWeightKg).toBe(150);
      expect(created.location).toBe('Dhaka, Savar');
      expect(created.reportedAt).toBeInstanceOf(Date);
    });

    it('should auto-generate reportedAt timestamp', async () => {
      const before = new Date();
      
      const created = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'weather_damage',
        lossPercentage: 20,
        lossWeightKg: 200,
        location: 'Dhaka, Savar'
      });

      const after = new Date();

      expect(created.reportedAt).toBeInstanceOf(Date);
      expect(created.reportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(created.reportedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should reject loss event with missing required fields', async () => {
      await expect(
        repository.create({
          farmerId: testFarmerId,
          batchId: testBatchId,
          eventType: 'pest_damage',
          lossPercentage: 15
          // Missing lossWeightKg and location
        } as any)
      ).rejects.toThrow();
    });

    it('should reject loss event with invalid loss percentage', async () => {
      await expect(
        repository.create({
          farmerId: testFarmerId,
          batchId: testBatchId,
          eventType: 'pest_damage',
          lossPercentage: 150, // Invalid: > 100
          lossWeightKg: 150,
          location: 'Dhaka, Savar'
        })
      ).rejects.toThrow();
    });

    it('should reject loss event with negative loss weight', async () => {
      await expect(
        repository.create({
          farmerId: testFarmerId,
          batchId: testBatchId,
          eventType: 'pest_damage',
          lossPercentage: 15,
          lossWeightKg: -150, // Invalid: negative
          location: 'Dhaka, Savar'
        })
      ).rejects.toThrow();
    });
  });

  describe('findByFarmerId', () => {
    it('should find all loss events for a farmer', async () => {
      // Create multiple loss events
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'weather_damage',
        lossPercentage: 20,
        lossWeightKg: 200,
        location: 'Dhaka, Savar'
      });

      const events = await repository.findByFarmerId(testFarmerId);

      expect(events).toHaveLength(2);
      expect(events[0].farmerId).toEqual(testFarmerId);
      expect(events[1].farmerId).toEqual(testFarmerId);
    });

    it('should return events sorted by reportedAt descending', async () => {
      // Create events with different timestamps
      const event1 = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar',
        reportedAt: new Date('2024-01-01')
      });

      const event2 = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'weather_damage',
        lossPercentage: 20,
        lossWeightKg: 200,
        location: 'Dhaka, Savar',
        reportedAt: new Date('2024-01-15')
      });

      const events = await repository.findByFarmerId(testFarmerId);

      expect(events).toHaveLength(2);
      // Most recent first
      expect(events[0]._id).toEqual(event2._id);
      expect(events[1]._id).toEqual(event1._id);
    });

    it('should return empty array for farmer with no loss events', async () => {
      const nonExistentFarmerId = new ObjectId();
      const events = await repository.findByFarmerId(nonExistentFarmerId);

      expect(events).toHaveLength(0);
    });
  });

  describe('findByBatchId', () => {
    it('should find all loss events for a crop batch', async () => {
      // Create multiple loss events for the same batch
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'weather_damage',
        lossPercentage: 20,
        lossWeightKg: 200,
        location: 'Dhaka, Savar'
      });

      const events = await repository.findByBatchId(testBatchId);

      expect(events).toHaveLength(2);
      expect(events[0].batchId).toEqual(testBatchId);
      expect(events[1].batchId).toEqual(testBatchId);
    });

    it('should return events sorted by reportedAt descending', async () => {
      const event1 = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar',
        reportedAt: new Date('2024-01-01')
      });

      const event2 = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'weather_damage',
        lossPercentage: 20,
        lossWeightKg: 200,
        location: 'Dhaka, Savar',
        reportedAt: new Date('2024-01-15')
      });

      const events = await repository.findByBatchId(testBatchId);

      expect(events).toHaveLength(2);
      // Most recent first
      expect(events[0]._id).toEqual(event2._id);
      expect(events[1]._id).toEqual(event1._id);
    });

    it('should return empty array for batch with no loss events', async () => {
      const nonExistentBatchId = new ObjectId();
      const events = await repository.findByBatchId(nonExistentBatchId);

      expect(events).toHaveLength(0);
    });
  });

  describe('aggregateLossByLocation', () => {
    beforeEach(async () => {
      // Create loss events in different locations
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'weather_damage',
        lossPercentage: 25,
        lossWeightKg: 250,
        location: 'Dhaka, Savar'
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 30,
        lossWeightKg: 300,
        location: 'Chittagong, Cox\'s Bazar'
      });
    });

    it('should aggregate loss data by location', async () => {
      const results = await repository.aggregateLossByLocation();

      expect(results).toHaveLength(2);
      
      // Results should be sorted by totalLossWeightKg descending
      // Dhaka has 400kg total (150 + 250), Chittagong has 300kg
      expect(results[0].location).toBe('Dhaka, Savar');
      expect(results[0].totalEvents).toBe(2);
      expect(results[0].totalLossWeightKg).toBe(400);
      expect(results[0].averageLossPercentage).toBe(20); // (15 + 25) / 2

      expect(results[1].location).toBe('Chittagong, Cox\'s Bazar');
      expect(results[1].totalEvents).toBe(1);
      expect(results[1].totalLossWeightKg).toBe(300);
      expect(results[1].averageLossPercentage).toBe(30);
    });

    it('should filter by division', async () => {
      const results = await repository.aggregateLossByLocation('Dhaka');

      expect(results).toHaveLength(1);
      expect(results[0].location).toBe('Dhaka, Savar');
      expect(results[0].totalEvents).toBe(2);
    });

    it('should filter by district', async () => {
      const results = await repository.aggregateLossByLocation(undefined, 'Savar');

      expect(results).toHaveLength(1);
      expect(results[0].location).toBe('Dhaka, Savar');
    });

    it('should return empty array when no events match filter', async () => {
      const results = await repository.aggregateLossByLocation('Sylhet');

      expect(results).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find a loss event by ID', async () => {
      const created = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      });

      const found = await repository.findById(created._id!);

      expect(found).not.toBeNull();
      expect(found!._id).toEqual(created._id);
      expect(found!.eventType).toBe('pest_damage');
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = new ObjectId();
      const found = await repository.findById(nonExistentId);

      expect(found).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update a loss event', async () => {
      const created = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      });

      const updated = await repository.updateById(created._id!, {
        lossPercentage: 20,
        lossWeightKg: 200
      });

      expect(updated).not.toBeNull();
      expect(updated!.lossPercentage).toBe(20);
      expect(updated!.lossWeightKg).toBe(200);
      expect(updated!.eventType).toBe('pest_damage'); // Unchanged
    });
  });

  describe('deleteById', () => {
    it('should delete a loss event', async () => {
      const created = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      });

      const deleted = await repository.deleteById(created._id!);
      expect(deleted).toBe(true);

      const found = await repository.findById(created._id!);
      expect(found).toBeNull();
    });

    it('should return false for non-existent ID', async () => {
      const nonExistentId = new ObjectId();
      const deleted = await repository.deleteById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should count loss events matching filter', async () => {
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 15,
        lossWeightKg: 150,
        location: 'Dhaka, Savar'
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'weather_damage',
        lossPercentage: 20,
        lossWeightKg: 200,
        location: 'Dhaka, Savar'
      });

      const count = await repository.count({ farmerId: testFarmerId } as any);
      expect(count).toBe(2);
    });
  });
});
