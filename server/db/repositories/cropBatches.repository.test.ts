import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { CropBatchesRepository } from './cropBatches.repository';
import { FarmersRepository } from './farmers.repository';
import { hashPassword } from '../../utils/password';

describe('CropBatchesRepository', () => {
  let repository: CropBatchesRepository;
  let farmersRepository: FarmersRepository;
  let testFarmerId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new CropBatchesRepository(db);
    farmersRepository = new FarmersRepository(db);
    
    // Create indexes
    await repository.createIndexes();
    await farmersRepository.createIndexes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up collections
    const db = getDatabase();
    await db.collection('crop_batches').deleteMany({});
    await db.collection('farmers').deleteMany({});

    // Create a test farmer
    const testFarmer = await farmersRepository.create({
      phone: '+8801712345678',
      passwordHash: await hashPassword('password123'),
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer']
    });
    testFarmerId = testFarmer._id!;
  });

  describe('create', () => {
    it('should create a crop batch in growing stage', async () => {
      const cropBatch = await repository.create({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2024-12-31')
      });

      expect(cropBatch._id).toBeDefined();
      expect(cropBatch.farmerId).toEqual(testFarmerId);
      expect(cropBatch.cropType).toBe('Rice');
      expect(cropBatch.stage).toBe('growing');
      expect(cropBatch.estimatedWeightKg).toBe(100);
      expect(cropBatch.enteredDate).toBeInstanceOf(Date);
    });

    it('should create a crop batch in harvested stage', async () => {
      const cropBatch = await repository.create({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        stage: 'harvested',
        finalWeightKg: 95,
        actualHarvestDate: new Date('2024-11-15'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka'
      });

      expect(cropBatch._id).toBeDefined();
      expect(cropBatch.stage).toBe('harvested');
      expect(cropBatch.finalWeightKg).toBe(95);
      expect(cropBatch.storageLocation).toBe('silo');
      expect(cropBatch.storageDivision).toBe('Dhaka');
    });
  });

  describe('findByFarmerId', () => {
    beforeEach(async () => {
      // Create multiple crop batches
      await repository.create({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2024-12-31')
      });

      await repository.create({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        stage: 'harvested',
        finalWeightKg: 95,
        actualHarvestDate: new Date('2024-11-15'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka'
      });

      // Create a batch for a different farmer
      const otherFarmerId = new ObjectId();
      await repository.create({
        farmerId: otherFarmerId,
        cropType: 'Corn',
        stage: 'growing',
        estimatedWeightKg: 50
      });
    });

    it('should find all crop batches for a farmer', async () => {
      const batches = await repository.findByFarmerId(testFarmerId);
      
      expect(batches).toHaveLength(2);
      expect(batches.every(b => b.farmerId.equals(testFarmerId))).toBe(true);
    });

    it('should filter by stage when provided', async () => {
      const growingBatches = await repository.findByFarmerId(testFarmerId, 'growing');
      
      expect(growingBatches).toHaveLength(1);
      expect(growingBatches[0].stage).toBe('growing');
      expect(growingBatches[0].cropType).toBe('Rice');
    });

    it('should return empty array for farmer with no batches', async () => {
      const nonExistentFarmerId = new ObjectId();
      const batches = await repository.findByFarmerId(nonExistentFarmerId);
      
      expect(batches).toHaveLength(0);
    });
  });

  describe('findByLocation', () => {
    beforeEach(async () => {
      // Create batches in different locations
      await repository.create({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'harvested',
        finalWeightKg: 100,
        actualHarvestDate: new Date('2024-11-15'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka'
      });

      await repository.create({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        stage: 'harvested',
        finalWeightKg: 95,
        actualHarvestDate: new Date('2024-11-15'),
        storageLocation: 'jute_bag',
        storageDivision: 'Dhaka',
        storageDistrict: 'Gazipur'
      });

      await repository.create({
        farmerId: testFarmerId,
        cropType: 'Corn',
        stage: 'harvested',
        finalWeightKg: 80,
        actualHarvestDate: new Date('2024-11-15'),
        storageLocation: 'silo',
        storageDivision: 'Chittagong',
        storageDistrict: 'Chittagong'
      });
    });

    it('should find all batches in a division', async () => {
      const batches = await repository.findByLocation('Dhaka');
      
      expect(batches).toHaveLength(2);
      expect(batches.every(b => b.storageDivision === 'Dhaka')).toBe(true);
    });

    it('should filter by district when provided', async () => {
      const batches = await repository.findByLocation('Dhaka', 'Gazipur');
      
      expect(batches).toHaveLength(1);
      expect(batches[0].storageDistrict).toBe('Gazipur');
      expect(batches[0].cropType).toBe('Wheat');
    });

    it('should return empty array for location with no batches', async () => {
      const batches = await repository.findByLocation('Sylhet');
      
      expect(batches).toHaveLength(0);
    });
  });

  describe('updateStage', () => {
    let batchId: ObjectId;

    beforeEach(async () => {
      const batch = await repository.create({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2024-12-31')
      });
      batchId = batch._id!;
    });

    it('should update stage from growing to harvested', async () => {
      const updated = await repository.updateStage(batchId, 'harvested', {
        finalWeightKg: 95,
        actualHarvestDate: new Date('2024-11-20'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka'
      });

      expect(updated).not.toBeNull();
      expect(updated!.stage).toBe('harvested');
      expect(updated!.finalWeightKg).toBe(95);
      expect(updated!.storageLocation).toBe('silo');
    });

    it('should throw NotFoundError for non-existent batch', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(
        repository.updateStage(nonExistentId, 'harvested', {
          finalWeightKg: 95
        })
      ).rejects.toThrow('Crop batch not found');
    });

    it('should allow updating other fields during stage transition', async () => {
      const updated = await repository.updateStage(batchId, 'harvested', {
        finalWeightKg: 95,
        actualHarvestDate: new Date('2024-11-20'),
        lossPercentage: 5,
        notes: 'Some loss due to pests'
      });

      expect(updated!.lossPercentage).toBe(5);
      expect(updated!.notes).toBe('Some loss due to pests');
    });
  });

  describe('indexes', () => {
    it('should have created the required indexes', async () => {
      const db = getDatabase();
      const indexes = await db.collection('crop_batches').indexes();
      
      const indexNames = indexes.map(idx => idx.name);
      
      expect(indexNames).toContain('farmerId_stage_index');
      expect(indexNames).toContain('storage_location_index');
      expect(indexNames).toContain('farmerId_enteredDate_index');
    });
  });
});
