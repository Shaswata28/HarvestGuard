import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { createServer } from '../index';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { initializeIndexes } from '../db/initialize';
import { Express } from 'express';

describe('Crop Batches API Routes', () => {
  let app: Express;
  let testFarmerId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    await initializeIndexes();
    app = createServer();

    // Create a test farmer
    const db = getDatabase();
    const farmersCollection = db.collection('farmers');
    const result = await farmersCollection.insertOne({
      phone: '+8801234567890',
      passwordHash: 'test_hash',
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer'],
      registeredAt: new Date()
    });
    testFarmerId = result.insertedId;
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('farmers').deleteMany({});
    await db.collection('crop_batches').deleteMany({});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up crop batches before each test
    const db = getDatabase();
    await db.collection('crop_batches').deleteMany({});
  });

  describe('POST /api/crop-batches', () => {
    it('should create a growing crop batch', async () => {
      const response = await request(app)
        .post('/api/crop-batches')
        .send({
          farmerId: testFarmerId.toString(),
          cropType: 'Rice',
          stage: 'growing',
          estimatedWeightKg: 100,
          expectedHarvestDate: new Date('2025-12-31').toISOString(),
          notes: 'Test batch',
          batchNumber: 'BATCH-001'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.farmerId).toBe(testFarmerId.toString());
      expect(response.body.cropType).toBe('Rice');
      expect(response.body.stage).toBe('growing');
      expect(response.body.estimatedWeightKg).toBe(100);
      expect(response.body.notes).toBe('Test batch');
      expect(response.body.batchNumber).toBe('BATCH-001');
    });

    it('should create a harvested crop batch', async () => {
      const response = await request(app)
        .post('/api/crop-batches')
        .send({
          farmerId: testFarmerId.toString(),
          cropType: 'Wheat',
          stage: 'harvested',
          finalWeightKg: 95,
          actualHarvestDate: new Date('2025-01-15').toISOString(),
          storageLocation: 'silo',
          storageDivision: 'Dhaka',
          storageDistrict: 'Dhaka'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.stage).toBe('harvested');
      expect(response.body.finalWeightKg).toBe(95);
      expect(response.body.storageLocation).toBe('silo');
    });

    it('should reject growing batch without required fields', async () => {
      const response = await request(app)
        .post('/api/crop-batches')
        .send({
          farmerId: testFarmerId.toString(),
          cropType: 'Rice',
          stage: 'growing'
          // Missing estimatedWeightKg and expectedHarvestDate
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject harvested batch without required fields', async () => {
      const response = await request(app)
        .post('/api/crop-batches')
        .send({
          farmerId: testFarmerId.toString(),
          cropType: 'Wheat',
          stage: 'harvested',
          finalWeightKg: 95
          // Missing other required harvested fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject invalid farmer ID', async () => {
      const response = await request(app)
        .post('/api/crop-batches')
        .send({
          farmerId: 'invalid-id',
          cropType: 'Rice',
          stage: 'growing',
          estimatedWeightKg: 100,
          expectedHarvestDate: new Date('2025-12-31').toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('GET /api/crop-batches', () => {
    beforeEach(async () => {
      // Create test batches
      const db = getDatabase();
      await db.collection('crop_batches').insertMany([
        {
          farmerId: testFarmerId,
          cropType: 'Rice',
          stage: 'growing',
          estimatedWeightKg: 100,
          expectedHarvestDate: new Date('2025-12-31'),
          enteredDate: new Date()
        },
        {
          farmerId: testFarmerId,
          cropType: 'Wheat',
          stage: 'harvested',
          finalWeightKg: 95,
          actualHarvestDate: new Date('2025-01-15'),
          storageLocation: 'silo',
          storageDivision: 'Dhaka',
          storageDistrict: 'Dhaka',
          enteredDate: new Date()
        }
      ]);
    });

    it('should list all crop batches', async () => {
      const response = await request(app)
        .get('/api/crop-batches');

      expect(response.status).toBe(200);
      expect(response.body.batches).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter by farmer ID', async () => {
      const response = await request(app)
        .get('/api/crop-batches')
        .query({ farmerId: testFarmerId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.batches).toHaveLength(2);
      expect(response.body.batches.every((b: any) => b.farmerId === testFarmerId.toString())).toBe(true);
    });

    it('should filter by stage', async () => {
      const response = await request(app)
        .get('/api/crop-batches')
        .query({ 
          farmerId: testFarmerId.toString(),
          stage: 'growing'
        });

      expect(response.status).toBe(200);
      expect(response.body.batches).toHaveLength(1);
      expect(response.body.batches[0].stage).toBe('growing');
    });

    it('should filter by location', async () => {
      const response = await request(app)
        .get('/api/crop-batches')
        .query({ 
          division: 'Dhaka',
          district: 'Dhaka'
        });

      expect(response.status).toBe(200);
      expect(response.body.batches).toHaveLength(1);
      expect(response.body.batches[0].stage).toBe('harvested');
    });
  });

  describe('GET /api/crop-batches/:id', () => {
    let testBatchId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('crop_batches').insertOne({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2025-12-31'),
        enteredDate: new Date()
      });
      testBatchId = result.insertedId;
    });

    it('should get a crop batch by ID', async () => {
      const response = await request(app)
        .get(`/api/crop-batches/${testBatchId.toString()}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(testBatchId.toString());
      expect(response.body.cropType).toBe('Rice');
    });

    it('should return 404 for non-existent batch', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .get(`/api/crop-batches/${fakeId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NotFoundError');
    });

    it('should reject invalid batch ID', async () => {
      const response = await request(app)
        .get('/api/crop-batches/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('PUT /api/crop-batches/:id', () => {
    let testBatchId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('crop_batches').insertOne({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2025-12-31'),
        enteredDate: new Date()
      });
      testBatchId = result.insertedId;
    });

    it('should update a crop batch', async () => {
      const response = await request(app)
        .put(`/api/crop-batches/${testBatchId.toString()}`)
        .send({
          notes: 'Updated notes',
          estimatedWeightKg: 120
        });

      expect(response.status).toBe(200);
      expect(response.body.notes).toBe('Updated notes');
      expect(response.body.estimatedWeightKg).toBe(120);
    });

    it('should return 404 for non-existent batch', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .put(`/api/crop-batches/${fakeId.toString()}`)
        .send({ notes: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NotFoundError');
    });
  });

  describe('PUT /api/crop-batches/:id/stage', () => {
    let testBatchId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('crop_batches').insertOne({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2025-12-31'),
        enteredDate: new Date()
      });
      testBatchId = result.insertedId;
    });

    it('should transition batch from growing to harvested', async () => {
      const response = await request(app)
        .put(`/api/crop-batches/${testBatchId.toString()}/stage`)
        .send({
          finalWeightKg: 95,
          actualHarvestDate: new Date('2025-01-15').toISOString(),
          storageLocation: 'silo',
          storageDivision: 'Dhaka',
          storageDistrict: 'Dhaka'
        });

      expect(response.status).toBe(200);
      expect(response.body.stage).toBe('harvested');
      expect(response.body.finalWeightKg).toBe(95);
      expect(response.body.storageLocation).toBe('silo');
    });

    it('should reject transition without required fields', async () => {
      const response = await request(app)
        .put(`/api/crop-batches/${testBatchId.toString()}/stage`)
        .send({
          finalWeightKg: 95
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('DELETE /api/crop-batches/:id', () => {
    let testBatchId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('crop_batches').insertOne({
        farmerId: testFarmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 100,
        expectedHarvestDate: new Date('2025-12-31'),
        enteredDate: new Date()
      });
      testBatchId = result.insertedId;
    });

    it('should delete a crop batch', async () => {
      const response = await request(app)
        .delete(`/api/crop-batches/${testBatchId.toString()}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const db = getDatabase();
      const batch = await db.collection('crop_batches').findOne({ _id: testBatchId });
      expect(batch).toBeNull();
    });

    it('should return 404 for non-existent batch', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .delete(`/api/crop-batches/${fakeId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NotFoundError');
    });
  });
});
