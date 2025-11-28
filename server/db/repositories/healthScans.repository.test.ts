import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { HealthScansRepository } from './healthScans.repository';
import { FarmersRepository } from './farmers.repository';
import { CropBatchesRepository } from './cropBatches.repository';
import { hashPassword } from '../../utils/password';

describe('HealthScansRepository', () => {
  let repository: HealthScansRepository;
  let farmersRepository: FarmersRepository;
  let cropBatchesRepository: CropBatchesRepository;
  let testFarmerId: ObjectId;
  let testBatchId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new HealthScansRepository(db);
    farmersRepository = new FarmersRepository(db);
    cropBatchesRepository = new CropBatchesRepository(db);
    
    // Create indexes
    await repository.createIndexes();
    await farmersRepository.createIndexes();
    await cropBatchesRepository.createIndexes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up collections
    const db = getDatabase();
    await db.collection('health_scans').deleteMany({});
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

    // Create a test crop batch
    const testBatch = await cropBatchesRepository.create({
      farmerId: testFarmerId,
      cropType: 'Rice',
      stage: 'growing',
      estimatedWeightKg: 100,
      expectedHarvestDate: new Date('2024-12-31')
    });
    testBatchId = testBatch._id!;
  });

  describe('create', () => {
    it('should create a health scan with required fields', async () => {
      const healthScan = await repository.create({
        farmerId: testFarmerId,
        diseaseLabel: 'Rice Blast',
        confidence: 85.5
      });

      expect(healthScan._id).toBeDefined();
      expect(healthScan.farmerId).toEqual(testFarmerId);
      expect(healthScan.diseaseLabel).toBe('Rice Blast');
      expect(healthScan.confidence).toBe(85.5);
      expect(healthScan.status).toBe('pending');
      expect(healthScan.capturedAt).toBeInstanceOf(Date);
    });

    it('should create a health scan with optional batchId', async () => {
      const healthScan = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        diseaseLabel: 'Leaf Blight',
        confidence: 92.3,
        remedyText: 'Apply fungicide'
      });

      expect(healthScan.batchId).toEqual(testBatchId);
      expect(healthScan.remedyText).toBe('Apply fungicide');
    });

    it('should create a health scan with all optional fields', async () => {
      const healthScan = await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        diseaseLabel: 'Healthy',
        confidence: 98.7,
        remedyText: 'No action needed',
        immediateFeedback: 'correct',
        outcome: 'recovered',
        status: 'healthy',
        imageUrl: 'https://example.com/image.jpg'
      });

      expect(healthScan.immediateFeedback).toBe('correct');
      expect(healthScan.outcome).toBe('recovered');
      expect(healthScan.status).toBe('healthy');
      expect(healthScan.imageUrl).toBe('https://example.com/image.jpg');
    });
  });

  describe('findByFarmerId', () => {
    beforeEach(async () => {
      // Create multiple health scans for the test farmer
      await repository.create({
        farmerId: testFarmerId,
        diseaseLabel: 'Rice Blast',
        confidence: 85.5,
        capturedAt: new Date('2024-11-01')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        diseaseLabel: 'Leaf Blight',
        confidence: 92.3,
        capturedAt: new Date('2024-11-15')
      });

      await repository.create({
        farmerId: testFarmerId,
        diseaseLabel: 'Healthy',
        confidence: 98.7,
        capturedAt: new Date('2024-11-20')
      });

      // Create a scan for a different farmer
      const otherFarmerId = new ObjectId();
      await repository.create({
        farmerId: otherFarmerId,
        diseaseLabel: 'Brown Spot',
        confidence: 78.2
      });
    });

    it('should find all health scans for a farmer', async () => {
      const scans = await repository.findByFarmerId(testFarmerId);
      
      expect(scans).toHaveLength(3);
      expect(scans.every(s => s.farmerId.equals(testFarmerId))).toBe(true);
    });

    it('should return scans sorted by capturedAt descending (newest first)', async () => {
      const scans = await repository.findByFarmerId(testFarmerId);
      
      expect(scans[0].diseaseLabel).toBe('Healthy'); // Nov 20
      expect(scans[1].diseaseLabel).toBe('Leaf Blight'); // Nov 15
      expect(scans[2].diseaseLabel).toBe('Rice Blast'); // Nov 1
    });

    it('should return empty array for farmer with no scans', async () => {
      const nonExistentFarmerId = new ObjectId();
      const scans = await repository.findByFarmerId(nonExistentFarmerId);
      
      expect(scans).toHaveLength(0);
    });
  });

  describe('findByBatchId', () => {
    let anotherBatchId: ObjectId;

    beforeEach(async () => {
      // Create another batch
      const anotherBatch = await cropBatchesRepository.create({
        farmerId: testFarmerId,
        cropType: 'Wheat',
        stage: 'growing',
        estimatedWeightKg: 80
      });
      anotherBatchId = anotherBatch._id!;

      // Create scans for different batches
      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        diseaseLabel: 'Rice Blast',
        confidence: 85.5,
        capturedAt: new Date('2024-11-01')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        diseaseLabel: 'Leaf Blight',
        confidence: 92.3,
        capturedAt: new Date('2024-11-15')
      });

      await repository.create({
        farmerId: testFarmerId,
        batchId: anotherBatchId,
        diseaseLabel: 'Wheat Rust',
        confidence: 88.1,
        capturedAt: new Date('2024-11-10')
      });

      // Create a scan without batchId
      await repository.create({
        farmerId: testFarmerId,
        diseaseLabel: 'General Scan',
        confidence: 75.0
      });
    });

    it('should find all health scans for a batch', async () => {
      const scans = await repository.findByBatchId(testBatchId);
      
      expect(scans).toHaveLength(2);
      expect(scans.every(s => s.batchId?.equals(testBatchId))).toBe(true);
    });

    it('should return scans sorted by capturedAt descending (newest first)', async () => {
      const scans = await repository.findByBatchId(testBatchId);
      
      expect(scans[0].diseaseLabel).toBe('Leaf Blight'); // Nov 15
      expect(scans[1].diseaseLabel).toBe('Rice Blast'); // Nov 1
    });

    it('should return empty array for batch with no scans', async () => {
      const nonExistentBatchId = new ObjectId();
      const scans = await repository.findByBatchId(nonExistentBatchId);
      
      expect(scans).toHaveLength(0);
    });
  });

  describe('updateStatus', () => {
    let scanId: ObjectId;

    beforeEach(async () => {
      const scan = await repository.create({
        farmerId: testFarmerId,
        diseaseLabel: 'Rice Blast',
        confidence: 85.5,
        status: 'pending'
      });
      scanId = scan._id!;
    });

    it('should update status to resolved', async () => {
      const updated = await repository.updateStatus(scanId, 'resolved');

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('resolved');
      expect(updated!._id).toEqual(scanId);
    });

    it('should update status to healthy', async () => {
      const updated = await repository.updateStatus(scanId, 'healthy');

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('healthy');
    });

    it('should throw NotFoundError for non-existent scan', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(
        repository.updateStatus(nonExistentId, 'resolved')
      ).rejects.toThrow('Health scan not found');
    });

    it('should preserve other fields when updating status', async () => {
      const updated = await repository.updateStatus(scanId, 'resolved');

      expect(updated!.diseaseLabel).toBe('Rice Blast');
      expect(updated!.confidence).toBe(85.5);
      expect(updated!.farmerId).toEqual(testFarmerId);
    });
  });

  describe('indexes', () => {
    it('should have created the required indexes', async () => {
      const db = getDatabase();
      const indexes = await db.collection('health_scans').indexes();
      
      const indexNames = indexes.map(idx => idx.name);
      
      expect(indexNames).toContain('farmerId_capturedAt_index');
      expect(indexNames).toContain('batchId_index');
      expect(indexNames).toContain('status_capturedAt_index');
    });
  });
});
