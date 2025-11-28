import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { createServer } from '../index';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { initializeIndexes } from '../db/initialize';
import { Express } from 'express';

describe('Loss Events API Routes', () => {
  let app: Express;
  let testFarmerId: ObjectId;
  let testBatchId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    await initializeIndexes();
    app = createServer();

    // Create a test farmer
    const db = getDatabase();
    const farmersCollection = db.collection('farmers');
    const farmerResult = await farmersCollection.insertOne({
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
    testFarmerId = farmerResult.insertedId;

    // Create a test crop batch
    const batchesCollection = db.collection('crop_batches');
    const batchResult = await batchesCollection.insertOne({
      farmerId: testFarmerId,
      cropType: 'Rice',
      stage: 'harvested',
      finalWeightKg: 100,
      actualHarvestDate: new Date('2025-11-01'),
      storageLocation: 'silo',
      storageDivision: 'Dhaka',
      storageDistrict: 'Dhaka',
      enteredDate: new Date()
    });
    testBatchId = batchResult.insertedId;
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('farmers').deleteMany({});
    await db.collection('crop_batches').deleteMany({});
    await db.collection('loss_events').deleteMany({});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up loss events before each test
    const db = getDatabase();
    await db.collection('loss_events').deleteMany({});
  });

  describe('POST /api/loss-events', () => {
    it('should create a loss event with all fields', async () => {
      const response = await request(app)
        .post('/api/loss-events')
        .send({
          farmerId: testFarmerId.toString(),
          batchId: testBatchId.toString(),
          eventType: 'pest_damage',
          lossPercentage: 15.5,
          lossWeightKg: 15.5,
          location: 'Dhaka, Savar'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.farmerId).toBe(testFarmerId.toString());
      expect(response.body.batchId).toBe(testBatchId.toString());
      expect(response.body.eventType).toBe('pest_damage');
      expect(response.body.lossPercentage).toBe(15.5);
      expect(response.body.lossWeightKg).toBe(15.5);
      expect(response.body.location).toBe('Dhaka, Savar');
      expect(response.body).toHaveProperty('reportedAt');
    });

    it('should reject loss event without required fields', async () => {
      const response = await request(app)
        .post('/api/loss-events')
        .send({
          farmerId: testFarmerId.toString()
          // Missing batchId, eventType, lossPercentage, lossWeightKg, location
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject loss event with invalid loss percentage', async () => {
      const response = await request(app)
        .post('/api/loss-events')
        .send({
          farmerId: testFarmerId.toString(),
          batchId: testBatchId.toString(),
          eventType: 'pest_damage',
          lossPercentage: 150, // Invalid: > 100
          lossWeightKg: 10,
          location: 'Dhaka'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject loss event with negative loss percentage', async () => {
      const response = await request(app)
        .post('/api/loss-events')
        .send({
          farmerId: testFarmerId.toString(),
          batchId: testBatchId.toString(),
          eventType: 'pest_damage',
          lossPercentage: -5, // Invalid: < 0
          lossWeightKg: 10,
          location: 'Dhaka'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject loss event with non-positive loss weight', async () => {
      const response = await request(app)
        .post('/api/loss-events')
        .send({
          farmerId: testFarmerId.toString(),
          batchId: testBatchId.toString(),
          eventType: 'pest_damage',
          lossPercentage: 10,
          lossWeightKg: 0, // Invalid: must be positive
          location: 'Dhaka'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject loss event with invalid farmer ID', async () => {
      const response = await request(app)
        .post('/api/loss-events')
        .send({
          farmerId: 'invalid-id',
          batchId: testBatchId.toString(),
          eventType: 'pest_damage',
          lossPercentage: 10,
          lossWeightKg: 10,
          location: 'Dhaka'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject loss event with invalid batch ID', async () => {
      const response = await request(app)
        .post('/api/loss-events')
        .send({
          farmerId: testFarmerId.toString(),
          batchId: 'invalid-id',
          eventType: 'pest_damage',
          lossPercentage: 10,
          lossWeightKg: 10,
          location: 'Dhaka'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('GET /api/loss-events', () => {
    let otherFarmerId: ObjectId;
    let otherBatchId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      
      // Create another farmer and batch
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567891',
        passwordHash: 'test_hash',
        name: 'Other Farmer',
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Raozan',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      otherFarmerId = farmerResult.insertedId;

      const batchResult = await db.collection('crop_batches').insertOne({
        farmerId: otherFarmerId,
        cropType: 'Wheat',
        stage: 'harvested',
        finalWeightKg: 200,
        actualHarvestDate: new Date('2025-11-01'),
        storageLocation: 'jute_bag',
        storageDivision: 'Chittagong',
        storageDistrict: 'Chittagong',
        enteredDate: new Date()
      });
      otherBatchId = batchResult.insertedId;

      // Create test loss events
      await db.collection('loss_events').insertMany([
        {
          farmerId: testFarmerId,
          batchId: testBatchId,
          eventType: 'pest_damage',
          lossPercentage: 10,
          lossWeightKg: 10,
          reportedAt: new Date(),
          location: 'Dhaka, Savar'
        },
        {
          farmerId: testFarmerId,
          batchId: testBatchId,
          eventType: 'moisture',
          lossPercentage: 5,
          lossWeightKg: 5,
          reportedAt: new Date(),
          location: 'Dhaka, Savar'
        },
        {
          farmerId: otherFarmerId,
          batchId: otherBatchId,
          eventType: 'rodent',
          lossPercentage: 15,
          lossWeightKg: 30,
          reportedAt: new Date(),
          location: 'Chittagong, Raozan'
        }
      ]);
    });

    afterEach(async () => {
      const db = getDatabase();
      await db.collection('farmers').deleteOne({ _id: otherFarmerId });
      await db.collection('crop_batches').deleteOne({ _id: otherBatchId });
    });

    it('should list all loss events', async () => {
      const response = await request(app)
        .get('/api/loss-events');

      expect(response.status).toBe(200);
      expect(response.body.lossEvents).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('should filter by farmer ID', async () => {
      const response = await request(app)
        .get('/api/loss-events')
        .query({ farmerId: testFarmerId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.lossEvents).toHaveLength(2);
      expect(response.body.lossEvents.every((e: any) => e.farmerId === testFarmerId.toString())).toBe(true);
    });

    it('should filter by batch ID', async () => {
      const response = await request(app)
        .get('/api/loss-events')
        .query({ batchId: testBatchId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.lossEvents).toHaveLength(2);
      expect(response.body.lossEvents.every((e: any) => e.batchId === testBatchId.toString())).toBe(true);
    });

    it('should return empty array when no loss events match filter', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .get('/api/loss-events')
        .query({ farmerId: fakeId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.lossEvents).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/loss-events/:id', () => {
    let testLossEventId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('loss_events').insertOne({
        farmerId: testFarmerId,
        batchId: testBatchId,
        eventType: 'pest_damage',
        lossPercentage: 10,
        lossWeightKg: 10,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });
      testLossEventId = result.insertedId;
    });

    it('should get a loss event by ID', async () => {
      const response = await request(app)
        .get(`/api/loss-events/${testLossEventId.toString()}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(testLossEventId.toString());
      expect(response.body.farmerId).toBe(testFarmerId.toString());
      expect(response.body.batchId).toBe(testBatchId.toString());
      expect(response.body.eventType).toBe('pest_damage');
      expect(response.body.lossPercentage).toBe(10);
      expect(response.body.lossWeightKg).toBe(10);
      expect(response.body.location).toBe('Dhaka, Savar');
    });

    it('should return 404 for non-existent loss event', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .get(`/api/loss-events/${fakeId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NotFoundError');
    });

    it('should reject invalid loss event ID', async () => {
      const response = await request(app)
        .get('/api/loss-events/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });
  });
});
