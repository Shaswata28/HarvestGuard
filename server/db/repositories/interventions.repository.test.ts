import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { InterventionsRepository } from './interventions.repository';
import { FarmersRepository } from './farmers.repository';
import { CropBatchesRepository } from './cropBatches.repository';
import { Intervention } from '../schemas';

describe('InterventionsRepository', () => {
  let repository: InterventionsRepository;
  let farmersRepository: FarmersRepository;
  let cropBatchesRepository: CropBatchesRepository;
  let testFarmerId: ObjectId;
  let testBatchId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new InterventionsRepository(db);
    farmersRepository = new FarmersRepository(db);
    cropBatchesRepository = new CropBatchesRepository(db);

    // Create indexes
    await repository.createIndexes();

    // Create a test farmer
    const farmer = await farmersRepository.create({
      phone: '+8801234567891',
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
    await db.collection('interventions').deleteMany({});
    await db.collection('crop_batches').deleteMany({});
    await db.collection('farmers').deleteMany({});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear interventions before each test
    const db = getDatabase();
    await db.collection('interventions').deleteMany({});
  });

  describe('create', () => {
    it('should create a new intervention', async () => {
      const interventionData: Omit<Intervention, '_id'> = {
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'pesticide_application',
        success: true,
        notes: 'Applied organic pesticide',
        performedAt: new Date()
      };

      const created = await repository.create(interventionData);

      expect(created._id).toBeDefined();
      expect(created.farmerId).toEqual(testFarmerId);
      expect(created.batchId).toEqual(testBatchId);
      expect(created.interventionType).toBe('pesticide_application');
      expect(created.success).toBe(true);
      expect(created.notes).toBe('Applied organic pesticide');
    });

    it('should create intervention without optional notes', async () => {
      const interventionData: Omit<Intervention, '_id'> = {
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'irrigation',
        success: false,
        performedAt: new Date()
      };

      const created = await repository.create(interventionData);

      expect(created._id).toBeDefined();
      expect(created.notes).toBeUndefined();
    });

    it('should auto-generate performedAt timestamp if not provided', async () => {
      const beforeCreate = new Date();
      
      const interventionData = {
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'fertilizer_application',
        success: true
      };

      const created = await repository.create(interventionData as Omit<Intervention, '_id'>);
      const afterCreate = new Date();

      expect(created.performedAt).toBeDefined();
      expect(created.performedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(created.performedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('findByFarmerId', () => {
    it('should find all interventions for a farmer', async () => {
      const farmer1Id = new ObjectId();
      const farmer2Id = new ObjectId();

      // Create interventions for farmer 1
      await repository.create({
        farmerId: farmer1Id,
        batchId: testBatchId,
        interventionType: 'weeding',
        success: true,
        performedAt: new Date('2024-01-01')
      });

      await repository.create({
        farmerId: farmer1Id,
        batchId: testBatchId,
        interventionType: 'irrigation',
        success: false,
        performedAt: new Date('2024-01-02')
      });

      // Create intervention for farmer 2
      await repository.create({
        farmerId: farmer2Id,
        batchId: testBatchId,
        interventionType: 'harvesting',
        success: true,
        performedAt: new Date('2024-01-03')
      });

      const farmer1Interventions = await repository.findByFarmerId(farmer1Id);

      expect(farmer1Interventions).toHaveLength(2);
      expect(farmer1Interventions[0].farmerId).toEqual(farmer1Id);
      expect(farmer1Interventions[1].farmerId).toEqual(farmer1Id);
    });

    it('should return interventions sorted by performedAt descending', async () => {
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'first',
        success: true,
        performedAt: new Date('2024-01-01')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'third',
        success: true,
        performedAt: new Date('2024-01-03')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'second',
        success: true,
        performedAt: new Date('2024-01-02')
      });

      const interventions = await repository.findByFarmerId(testFarmerId);

      expect(interventions).toHaveLength(3);
      expect(interventions[0].interventionType).toBe('third');
      expect(interventions[1].interventionType).toBe('second');
      expect(interventions[2].interventionType).toBe('first');
    });

    it('should return empty array if no interventions found', async () => {
      const nonExistentFarmerId = new ObjectId();
      const interventions = await repository.findByFarmerId(nonExistentFarmerId);

      expect(interventions).toEqual([]);
    });
  });

  describe('findByBatchId', () => {
    it('should find all interventions for a batch', async () => {
      const batch1Id = new ObjectId();
      const batch2Id = new ObjectId();

      // Create interventions for batch 1
      await repository.create({
        farmerId: testFarmerId,
        batchId: batch1Id,
        interventionType: 'weeding',
        success: true,
        performedAt: new Date('2024-01-01')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: batch1Id,
        interventionType: 'irrigation',
        success: false,
        performedAt: new Date('2024-01-02')
      });

      // Create intervention for batch 2
      await repository.create({
        farmerId: testFarmerId,
        batchId: batch2Id,
        interventionType: 'harvesting',
        success: true,
        performedAt: new Date('2024-01-03')
      });

      const batch1Interventions = await repository.findByBatchId(batch1Id);

      expect(batch1Interventions).toHaveLength(2);
      expect(batch1Interventions[0].batchId).toEqual(batch1Id);
      expect(batch1Interventions[1].batchId).toEqual(batch1Id);
    });

    it('should return interventions sorted by performedAt descending', async () => {
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'first',
        success: true,
        performedAt: new Date('2024-01-01')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'third',
        success: true,
        performedAt: new Date('2024-01-03')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'second',
        success: true,
        performedAt: new Date('2024-01-02')
      });

      const interventions = await repository.findByBatchId(testBatchId);

      expect(interventions).toHaveLength(3);
      expect(interventions[0].interventionType).toBe('third');
      expect(interventions[1].interventionType).toBe('second');
      expect(interventions[2].interventionType).toBe('first');
    });

    it('should return empty array if no interventions found', async () => {
      const nonExistentBatchId = new ObjectId();
      const interventions = await repository.findByBatchId(nonExistentBatchId);

      expect(interventions).toEqual([]);
    });
  });

  describe('calculateSuccessRate', () => {
    beforeEach(async () => {
      // Create test interventions with mixed success rates
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'weeding',
        success: true,
        performedAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'irrigation',
        success: true,
        performedAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'fertilizer',
        success: false,
        performedAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'pesticide',
        success: true,
        performedAt: new Date()
      });
    });

    it('should calculate overall success rate', async () => {
      const result = await repository.calculateSuccessRate();

      expect(result.total).toBe(4);
      expect(result.successful).toBe(3);
      expect(result.successRate).toBe(75);
    });

    it('should calculate success rate for specific farmer', async () => {
      const otherFarmerId = new ObjectId();
      
      // Add intervention for another farmer
      await repository.create({
        farmerId: otherFarmerId,
        batchId: testBatchId,
        interventionType: 'harvesting',
        success: false,
        performedAt: new Date()
      });

      const result = await repository.calculateSuccessRate(testFarmerId);

      expect(result.total).toBe(4);
      expect(result.successful).toBe(3);
      expect(result.successRate).toBe(75);
    });

    it('should calculate success rate for specific batch', async () => {
      const otherBatchId = new ObjectId();
      
      // Add intervention for another batch
      await repository.create({
        farmerId: testFarmerId,
        batchId: otherBatchId,
        interventionType: 'harvesting',
        success: false,
        performedAt: new Date()
      });

      const result = await repository.calculateSuccessRate(undefined, testBatchId);

      expect(result.total).toBe(4);
      expect(result.successful).toBe(3);
      expect(result.successRate).toBe(75);
    });

    it('should calculate success rate for specific farmer and batch', async () => {
      const otherFarmerId = new ObjectId();
      const otherBatchId = new ObjectId();
      
      // Add interventions for other combinations
      await repository.create({
        farmerId: otherFarmerId,
        batchId: testBatchId,
        interventionType: 'test1',
        success: false,
        performedAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: otherBatchId,
        interventionType: 'test2',
        success: false,
        performedAt: new Date()
      });

      const result = await repository.calculateSuccessRate(testFarmerId, testBatchId);

      expect(result.total).toBe(4);
      expect(result.successful).toBe(3);
      expect(result.successRate).toBe(75);
    });

    it('should return zero values when no interventions exist', async () => {
      const db = getDatabase();
      await db.collection('interventions').deleteMany({});

      const result = await repository.calculateSuccessRate();

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it('should handle 100% success rate', async () => {
      const db = getDatabase();
      await db.collection('interventions').deleteMany({});

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'test1',
        success: true,
        performedAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'test2',
        success: true,
        performedAt: new Date()
      });

      const result = await repository.calculateSuccessRate();

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.successRate).toBe(100);
    });

    it('should handle 0% success rate', async () => {
      const db = getDatabase();
      await db.collection('interventions').deleteMany({});

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'test1',
        success: false,
        performedAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'test2',
        success: false,
        performedAt: new Date()
      });

      const result = await repository.calculateSuccessRate();

      expect(result.total).toBe(2);
      expect(result.successful).toBe(0);
      expect(result.successRate).toBe(0);
    });
  });

  describe('updateById', () => {
    it('should update intervention fields', async () => {
      const created = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'weeding',
        success: false,
        performedAt: new Date()
      });

      const updated = await repository.updateById(created._id!, {
        success: true,
        notes: 'Updated to successful'
      });

      expect(updated).not.toBeNull();
      expect(updated!.success).toBe(true);
      expect(updated!.notes).toBe('Updated to successful');
      expect(updated!.interventionType).toBe('weeding');
    });
  });

  describe('deleteById', () => {
    it('should delete an intervention', async () => {
      const created = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'weeding',
        success: true,
        performedAt: new Date()
      });

      const deleted = await repository.deleteById(created._id!);
      expect(deleted).toBe(true);

      const found = await repository.findById(created._id!);
      expect(found).toBeNull();
    });
  });
});
