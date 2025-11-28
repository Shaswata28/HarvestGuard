import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { InterventionsRepository } from '../db/repositories/interventions.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import {
  handleCreateIntervention,
  handleListInterventions,
  handleGetIntervention
} from './interventions';
import { hashPassword } from '../utils/password';

describe('Interventions Routes', () => {
  let interventionsRepository: InterventionsRepository;
  let farmersRepository: FarmersRepository;
  let cropBatchesRepository: CropBatchesRepository;
  let testFarmerId: ObjectId;
  let testBatchId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    interventionsRepository = new InterventionsRepository(db);
    farmersRepository = new FarmersRepository(db);
    cropBatchesRepository = new CropBatchesRepository(db);
    await interventionsRepository.createIndexes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up collections
    const db = getDatabase();
    await db.collection('interventions').deleteMany({});
    await db.collection('farmers').deleteMany({});
    await db.collection('crop_batches').deleteMany({});

    // Create test farmer
    const farmer = await farmersRepository.create({
      phone: '+8801712345678',
      passwordHash: await hashPassword('password123'),
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer'],
      registeredAt: new Date()
    });
    testFarmerId = farmer._id!;

    // Create test crop batch
    const batch = await cropBatchesRepository.create({
      farmerId: testFarmerId,
      cropType: 'Rice',
      stage: 'growing',
      estimatedWeightKg: 100,
      expectedHarvestDate: new Date('2024-12-31'),
      enteredDate: new Date()
    });
    testBatchId = batch._id!;
  });

  describe('POST /api/interventions', () => {
    it('should create a new intervention', async () => {
      const req: any = {
        body: {
          farmerId: testFarmerId.toString(),
          batchId: testBatchId.toString(),
          interventionType: 'Pesticide Application',
          success: true,
          notes: 'Applied organic pesticide'
        }
      };

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(201);
          return res;
        },
        json: (data: any) => {
          expect(data).toHaveProperty('_id');
          expect(data.farmerId).toBe(testFarmerId.toString());
          expect(data.batchId).toBe(testBatchId.toString());
          expect(data.interventionType).toBe('Pesticide Application');
          expect(data.success).toBe(true);
          expect(data.notes).toBe('Applied organic pesticide');
          expect(data).toHaveProperty('performedAt');
        }
      };

      const next = (error?: any) => {
        if (error) throw error;
      };

      await handleCreateIntervention(req, res, next);
    });

    it('should create an intervention without notes', async () => {
      const req: any = {
        body: {
          farmerId: testFarmerId.toString(),
          batchId: testBatchId.toString(),
          interventionType: 'Fertilizer Application',
          success: false
        }
      };

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(201);
          return res;
        },
        json: (data: any) => {
          expect(data).toHaveProperty('_id');
          expect(data.interventionType).toBe('Fertilizer Application');
          expect(data.success).toBe(false);
          // Notes can be undefined or null when not provided
          expect(data.notes == null).toBe(true);
        }
      };

      const next = (error?: any) => {
        if (error) throw error;
      };

      await handleCreateIntervention(req, res, next);
    });
  });

  describe('GET /api/interventions', () => {
    beforeEach(async () => {
      // Create test interventions
      await interventionsRepository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'Pesticide Application',
        success: true,
        notes: 'First intervention',
        performedAt: new Date('2024-01-15')
      });

      await interventionsRepository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'Fertilizer Application',
        success: false,
        performedAt: new Date('2024-01-20')
      });

      // Create another farmer and batch for filtering tests
      const anotherFarmer = await farmersRepository.create({
        phone: '+8801812345678',
        passwordHash: await hashPassword('password123'),
        name: 'Another Farmer',
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Raozan',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      const anotherBatch = await cropBatchesRepository.create({
        farmerId: anotherFarmer._id!,
        cropType: 'Wheat',
        stage: 'growing',
        estimatedWeightKg: 50,
        expectedHarvestDate: new Date('2024-12-31'),
        enteredDate: new Date()
      });

      await interventionsRepository.create({
        farmerId: anotherFarmer._id!,
        batchId: anotherBatch._id!,
        interventionType: 'Irrigation',
        success: true,
        performedAt: new Date('2024-01-25')
      });
    });

    it('should get all interventions', async () => {
      const req: any = {
        query: {}
      };

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(200);
          return res;
        },
        json: (data: any) => {
          expect(data.interventions).toHaveLength(3);
          expect(data.total).toBe(3);
        }
      };

      const next = (error?: any) => {
        if (error) throw error;
      };

      await handleListInterventions(req, res, next);
    });

    it('should filter interventions by farmerId', async () => {
      const req: any = {
        query: {
          farmerId: testFarmerId.toString()
        }
      };

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(200);
          return res;
        },
        json: (data: any) => {
          expect(data.interventions).toHaveLength(2);
          expect(data.total).toBe(2);
          // Verify all interventions belong to the test farmer
          data.interventions.forEach((intervention: any) => {
            expect(intervention.farmerId).toBe(testFarmerId.toString());
          });
        }
      };

      const next = (error?: any) => {
        if (error) throw error;
      };

      await handleListInterventions(req, res, next);
    });

    it('should filter interventions by batchId', async () => {
      const req: any = {
        query: {
          batchId: testBatchId.toString()
        }
      };

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(200);
          return res;
        },
        json: (data: any) => {
          expect(data.interventions).toHaveLength(2);
          expect(data.total).toBe(2);
          // Verify all interventions belong to the test batch
          data.interventions.forEach((intervention: any) => {
            expect(intervention.batchId).toBe(testBatchId.toString());
          });
        }
      };

      const next = (error?: any) => {
        if (error) throw error;
      };

      await handleListInterventions(req, res, next);
    });
  });

  describe('GET /api/interventions/:id', () => {
    it('should get an intervention by ID', async () => {
      const intervention = await interventionsRepository.create({
        farmerId: testFarmerId,
        batchId: testBatchId,
        interventionType: 'Pesticide Application',
        success: true,
        notes: 'Test intervention',
        performedAt: new Date()
      });

      const req: any = {
        params: {
          id: intervention._id!.toString()
        }
      };

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(200);
          return res;
        },
        json: (data: any) => {
          expect(data._id).toBe(intervention._id!.toString());
          expect(data.farmerId).toBe(testFarmerId.toString());
          expect(data.batchId).toBe(testBatchId.toString());
          expect(data.interventionType).toBe('Pesticide Application');
          expect(data.success).toBe(true);
          expect(data.notes).toBe('Test intervention');
        }
      };

      const next = (error?: any) => {
        if (error) throw error;
      };

      await handleGetIntervention(req, res, next);
    });

    it('should return 404 for non-existent intervention', async () => {
      const nonExistentId = new ObjectId();

      const req: any = {
        params: {
          id: nonExistentId.toString()
        }
      };

      const res: any = {
        status: (code: number) => {
          expect(code).toBe(404);
          return res;
        },
        json: (data: any) => {
          expect(data.error.type).toBe('NotFoundError');
          expect(data.error.message).toBe('Intervention not found');
        }
      };

      const next = (error?: any) => {
        if (error) throw error;
      };

      await handleGetIntervention(req, res, next);
    });
  });
});
