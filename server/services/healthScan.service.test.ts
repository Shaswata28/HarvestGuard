import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase } from '../db/connection';
import { HealthScansRepository } from '../db/repositories/healthScans.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { HealthScanService, RecordHealthScanInput, UpdateScanOutcomeInput } from './healthScan.service';
import { Farmer, CropBatch } from '../db/schemas';
import { ValidationError, NotFoundError } from '../utils/errors';

describe('HealthScanService', () => {
  let healthScansRepository: HealthScansRepository;
  let farmersRepository: FarmersRepository;
  let cropBatchesRepository: CropBatchesRepository;
  let healthScanService: HealthScanService;
  let testFarmer: Farmer;
  let testBatch: CropBatch;

  beforeAll(async () => {
    const db = await connectToDatabase();
    healthScansRepository = new HealthScansRepository(db);
    farmersRepository = new FarmersRepository(db);
    cropBatchesRepository = new CropBatchesRepository(db);
    healthScanService = new HealthScanService(healthScansRepository);

    // Create test farmer
    testFarmer = await farmersRepository.create({
      phone: '+8801700000099',
      passwordHash: 'hashedpassword',
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer'],
      registeredAt: new Date()
    });

    // Create test crop batch
    testBatch = await cropBatchesRepository.create({
      farmerId: testFarmer._id!,
      cropType: 'Rice',
      stage: 'growing',
      estimatedWeightKg: 100,
      expectedHarvestDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      enteredDate: new Date()
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testFarmer._id) {
      await farmersRepository.deleteById(testFarmer._id);
    }
    if (testBatch._id) {
      await cropBatchesRepository.deleteById(testBatch._id);
    }
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up health scans before each test
    const scans = await healthScansRepository.findByFarmerId(testFarmer._id!);
    for (const scan of scans) {
      if (scan._id) {
        await healthScansRepository.deleteById(scan._id);
      }
    }
  });

  describe('recordScan', () => {
    it('should record a health scan with valid data', async () => {
      const input: RecordHealthScanInput = {
        farmerId: testFarmer._id!,
        batchId: testBatch._id!,
        diseaseLabel: 'Bacterial Leaf Blight',
        confidence: 85.5,
        remedyText: 'Apply copper-based fungicide',
        immediateFeedback: 'correct'
      };

      const scan = await healthScanService.recordScan(input);

      expect(scan._id).toBeDefined();
      expect(scan.farmerId.toString()).toBe(testFarmer._id!.toString());
      expect(scan.batchId?.toString()).toBe(testBatch._id!.toString());
      expect(scan.diseaseLabel).toBe('Bacterial Leaf Blight');
      expect(scan.confidence).toBe(85.5);
      expect(scan.remedyText).toBe('Apply copper-based fungicide');
      expect(scan.immediateFeedback).toBe('correct');
      expect(scan.status).toBe('pending');
      expect(scan.capturedAt).toBeInstanceOf(Date);
    });

    it('should record a scan without batchId', async () => {
      const input: RecordHealthScanInput = {
        farmerId: testFarmer._id!,
        diseaseLabel: 'Healthy',
        confidence: 95
      };

      const scan = await healthScanService.recordScan(input);

      expect(scan._id).toBeDefined();
      // MongoDB returns null for optional fields that aren't set
      expect(scan.batchId).toBeNull();
      expect(scan.diseaseLabel).toBe('Healthy');
    });

    it('should record a scan with image URL', async () => {
      const input: RecordHealthScanInput = {
        farmerId: testFarmer._id!,
        diseaseLabel: 'Brown Spot',
        confidence: 78,
        imageUrl: 'https://example.com/scan-image.jpg'
      };

      const scan = await healthScanService.recordScan(input);

      expect(scan.imageUrl).toBe('https://example.com/scan-image.jpg');
    });

    it('should reject empty disease label', async () => {
      const input: RecordHealthScanInput = {
        farmerId: testFarmer._id!,
        diseaseLabel: '   ',
        confidence: 80
      };

      await expect(healthScanService.recordScan(input)).rejects.toThrow(ValidationError);
      await expect(healthScanService.recordScan(input)).rejects.toThrow('Disease label cannot be empty');
    });

    it('should reject confidence below 0', async () => {
      const input: RecordHealthScanInput = {
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: -5
      };

      await expect(healthScanService.recordScan(input)).rejects.toThrow(ValidationError);
      await expect(healthScanService.recordScan(input)).rejects.toThrow('Confidence must be between 0 and 100');
    });

    it('should reject confidence above 100', async () => {
      const input: RecordHealthScanInput = {
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 105
      };

      await expect(healthScanService.recordScan(input)).rejects.toThrow(ValidationError);
      await expect(healthScanService.recordScan(input)).rejects.toThrow('Confidence must be between 0 and 100');
    });

    it('should reject invalid image URL', async () => {
      const input: RecordHealthScanInput = {
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80,
        imageUrl: 'not-a-valid-url'
      };

      await expect(healthScanService.recordScan(input)).rejects.toThrow(ValidationError);
      await expect(healthScanService.recordScan(input)).rejects.toThrow('Invalid image URL format');
    });
  });

  describe('getScanById', () => {
    it('should retrieve a scan by ID', async () => {
      const created = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const retrieved = await healthScanService.getScanById(created._id!);

      expect(retrieved._id?.toString()).toBe(created._id!.toString());
      expect(retrieved.diseaseLabel).toBe('Test Disease');
    });

    it('should throw NotFoundError for non-existent scan', async () => {
      const fakeId = new ObjectId();

      await expect(healthScanService.getScanById(fakeId)).rejects.toThrow(NotFoundError);
      await expect(healthScanService.getScanById(fakeId)).rejects.toThrow('Health scan not found');
    });
  });

  describe('getScansByFarmerId', () => {
    it('should retrieve all scans for a farmer', async () => {
      await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Disease 1',
        confidence: 80
      });

      await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Disease 2',
        confidence: 90
      });

      const scans = await healthScanService.getScansByFarmerId(testFarmer._id!);

      expect(scans).toHaveLength(2);
      expect(scans[0].diseaseLabel).toBe('Disease 2'); // Newest first
      expect(scans[1].diseaseLabel).toBe('Disease 1');
    });

    it('should return empty array for farmer with no scans', async () => {
      const anotherFarmer = await farmersRepository.create({
        phone: '+8801700000098',
        passwordHash: 'hashedpassword',
        name: 'Another Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const scans = await healthScanService.getScansByFarmerId(anotherFarmer._id!);

      expect(scans).toHaveLength(0);

      // Clean up
      await farmersRepository.deleteById(anotherFarmer._id!);
    });
  });

  describe('getScansByBatchId', () => {
    it('should retrieve all scans for a batch', async () => {
      await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        batchId: testBatch._id!,
        diseaseLabel: 'Disease 1',
        confidence: 80
      });

      await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        batchId: testBatch._id!,
        diseaseLabel: 'Disease 2',
        confidence: 90
      });

      const scans = await healthScanService.getScansByBatchId(testBatch._id!);

      expect(scans).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('should update status from pending to resolved', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const updated = await healthScanService.updateStatus(scan._id!, 'resolved');

      expect(updated.status).toBe('resolved');
    });

    it('should update status from pending to healthy', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const updated = await healthScanService.updateStatus(scan._id!, 'healthy');

      expect(updated.status).toBe('healthy');
    });

    it('should reject transition from resolved to pending', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      await healthScanService.updateStatus(scan._id!, 'resolved');

      await expect(
        healthScanService.updateStatus(scan._id!, 'pending')
      ).rejects.toThrow(ValidationError);
      await expect(
        healthScanService.updateStatus(scan._id!, 'pending')
      ).rejects.toThrow('Cannot change status from resolved/healthy back to pending');
    });

    it('should reject transition from healthy to pending', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      await healthScanService.updateStatus(scan._id!, 'healthy');

      await expect(
        healthScanService.updateStatus(scan._id!, 'pending')
      ).rejects.toThrow(ValidationError);
    });

    it('should reject transition from healthy to resolved', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      await healthScanService.updateStatus(scan._id!, 'healthy');

      await expect(
        healthScanService.updateStatus(scan._id!, 'resolved')
      ).rejects.toThrow(ValidationError);
      await expect(
        healthScanService.updateStatus(scan._id!, 'resolved')
      ).rejects.toThrow('Cannot change status from healthy to resolved');
    });

    it('should throw NotFoundError for non-existent scan', async () => {
      const fakeId = new ObjectId();

      await expect(
        healthScanService.updateStatus(fakeId, 'resolved')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateOutcome', () => {
    it('should update outcome to recovered', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const input: UpdateScanOutcomeInput = {
        outcome: 'recovered'
      };

      const updated = await healthScanService.updateOutcome(scan._id!, input);

      expect(updated.outcome).toBe('recovered');
      expect(updated.status).toBe('resolved'); // Auto-updated
    });

    it('should update outcome to same', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const input: UpdateScanOutcomeInput = {
        outcome: 'same'
      };

      const updated = await healthScanService.updateOutcome(scan._id!, input);

      expect(updated.outcome).toBe('same');
    });

    it('should update outcome to worse', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const input: UpdateScanOutcomeInput = {
        outcome: 'worse'
      };

      const updated = await healthScanService.updateOutcome(scan._id!, input);

      expect(updated.outcome).toBe('worse');
      expect(updated.status).toBe('pending'); // Stays pending
    });

    it('should update outcome with immediate feedback', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const input: UpdateScanOutcomeInput = {
        outcome: 'recovered',
        immediateFeedback: 'correct'
      };

      const updated = await healthScanService.updateOutcome(scan._id!, input);

      expect(updated.outcome).toBe('recovered');
      expect(updated.immediateFeedback).toBe('correct');
    });

    it('should throw NotFoundError for non-existent scan', async () => {
      const fakeId = new ObjectId();
      const input: UpdateScanOutcomeInput = {
        outcome: 'recovered'
      };

      await expect(
        healthScanService.updateOutcome(fakeId, input)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateImmediateFeedback', () => {
    it('should update immediate feedback to correct', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const updated = await healthScanService.updateImmediateFeedback(scan._id!, 'correct');

      expect(updated.immediateFeedback).toBe('correct');
    });

    it('should update immediate feedback to incorrect', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const updated = await healthScanService.updateImmediateFeedback(scan._id!, 'incorrect');

      expect(updated.immediateFeedback).toBe('incorrect');
    });

    it('should update immediate feedback to unsure', async () => {
      const scan = await healthScanService.recordScan({
        farmerId: testFarmer._id!,
        diseaseLabel: 'Test Disease',
        confidence: 80
      });

      const updated = await healthScanService.updateImmediateFeedback(scan._id!, 'unsure');

      expect(updated.immediateFeedback).toBe('unsure');
    });

    it('should throw NotFoundError for non-existent scan', async () => {
      const fakeId = new ObjectId();

      await expect(
        healthScanService.updateImmediateFeedback(fakeId, 'correct')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
