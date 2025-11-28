import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { createServer } from '../index';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { initializeIndexes } from '../db/initialize';
import { Express } from 'express';

describe('Health Scans API Routes', () => {
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
      stage: 'growing',
      estimatedWeightKg: 100,
      expectedHarvestDate: new Date('2025-12-31'),
      enteredDate: new Date()
    });
    testBatchId = batchResult.insertedId;
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('farmers').deleteMany({});
    await db.collection('crop_batches').deleteMany({});
    await db.collection('health_scans').deleteMany({});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up health scans before each test
    const db = getDatabase();
    await db.collection('health_scans').deleteMany({});
  });

  describe('POST /api/health-scans', () => {
    it('should create a health scan with all fields', async () => {
      const response = await request(app)
        .post('/api/health-scans')
        .send({
          farmerId: testFarmerId.toString(),
          batchId: testBatchId.toString(),
          diseaseLabel: 'Rice Blast',
          confidence: 85.5,
          remedyText: 'Apply fungicide',
          imageUrl: 'https://example.com/image.jpg',
          immediateFeedback: 'correct'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.farmerId).toBe(testFarmerId.toString());
      expect(response.body.batchId).toBe(testBatchId.toString());
      expect(response.body.diseaseLabel).toBe('Rice Blast');
      expect(response.body.confidence).toBe(85.5);
      expect(response.body.remedyText).toBe('Apply fungicide');
      expect(response.body.imageUrl).toBe('https://example.com/image.jpg');
      expect(response.body.immediateFeedback).toBe('correct');
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('capturedAt');
    });

    it('should create a health scan without optional fields', async () => {
      const response = await request(app)
        .post('/api/health-scans')
        .send({
          farmerId: testFarmerId.toString(),
          diseaseLabel: 'Leaf Blight',
          confidence: 75
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.farmerId).toBe(testFarmerId.toString());
      expect(response.body.diseaseLabel).toBe('Leaf Blight');
      expect(response.body.confidence).toBe(75);
      expect(response.body.status).toBe('pending');
    });

    it('should reject scan without required fields', async () => {
      const response = await request(app)
        .post('/api/health-scans')
        .send({
          farmerId: testFarmerId.toString()
          // Missing diseaseLabel and confidence
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject scan with invalid confidence', async () => {
      const response = await request(app)
        .post('/api/health-scans')
        .send({
          farmerId: testFarmerId.toString(),
          diseaseLabel: 'Test Disease',
          confidence: 150 // Invalid: > 100
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject scan with invalid farmer ID', async () => {
      const response = await request(app)
        .post('/api/health-scans')
        .send({
          farmerId: 'invalid-id',
          diseaseLabel: 'Test Disease',
          confidence: 80
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject scan with invalid image URL', async () => {
      const response = await request(app)
        .post('/api/health-scans')
        .send({
          farmerId: testFarmerId.toString(),
          diseaseLabel: 'Test Disease',
          confidence: 80,
          imageUrl: 'not-a-valid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('GET /api/health-scans', () => {
    beforeEach(async () => {
      // Create test health scans
      const db = getDatabase();
      await db.collection('health_scans').insertMany([
        {
          farmerId: testFarmerId,
          batchId: testBatchId,
          capturedAt: new Date(),
          diseaseLabel: 'Rice Blast',
          confidence: 85,
          status: 'pending'
        },
        {
          farmerId: testFarmerId,
          capturedAt: new Date(),
          diseaseLabel: 'Leaf Blight',
          confidence: 75,
          status: 'resolved'
        },
        {
          farmerId: new ObjectId(), // Different farmer
          capturedAt: new Date(),
          diseaseLabel: 'Brown Spot',
          confidence: 90,
          status: 'pending'
        }
      ]);
    });

    it('should list all health scans', async () => {
      const response = await request(app)
        .get('/api/health-scans');

      expect(response.status).toBe(200);
      expect(response.body.scans).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('should filter by farmer ID', async () => {
      const response = await request(app)
        .get('/api/health-scans')
        .query({ farmerId: testFarmerId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.scans).toHaveLength(2);
      expect(response.body.scans.every((s: any) => s.farmerId === testFarmerId.toString())).toBe(true);
    });

    it('should filter by batch ID', async () => {
      const response = await request(app)
        .get('/api/health-scans')
        .query({ batchId: testBatchId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.scans).toHaveLength(1);
      expect(response.body.scans[0].batchId).toBe(testBatchId.toString());
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/health-scans')
        .query({ 
          farmerId: testFarmerId.toString(),
          status: 'pending'
        });

      expect(response.status).toBe(200);
      expect(response.body.scans).toHaveLength(1);
      expect(response.body.scans[0].status).toBe('pending');
    });
  });

  describe('GET /api/health-scans/:id', () => {
    let testScanId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('health_scans').insertOne({
        farmerId: testFarmerId,
        batchId: testBatchId,
        capturedAt: new Date(),
        diseaseLabel: 'Rice Blast',
        confidence: 85,
        status: 'pending'
      });
      testScanId = result.insertedId;
    });

    it('should get a health scan by ID', async () => {
      const response = await request(app)
        .get(`/api/health-scans/${testScanId.toString()}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(testScanId.toString());
      expect(response.body.diseaseLabel).toBe('Rice Blast');
      expect(response.body.confidence).toBe(85);
    });

    it('should return 404 for non-existent scan', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .get(`/api/health-scans/${fakeId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NotFoundError');
    });

    it('should reject invalid scan ID', async () => {
      const response = await request(app)
        .get('/api/health-scans/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('PUT /api/health-scans/:id/status', () => {
    let testScanId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('health_scans').insertOne({
        farmerId: testFarmerId,
        batchId: testBatchId,
        capturedAt: new Date(),
        diseaseLabel: 'Rice Blast',
        confidence: 85,
        status: 'pending'
      });
      testScanId = result.insertedId;
    });

    it('should update scan status to resolved', async () => {
      const response = await request(app)
        .put(`/api/health-scans/${testScanId.toString()}/status`)
        .send({ status: 'resolved' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
    });

    it('should update scan status to healthy', async () => {
      const response = await request(app)
        .put(`/api/health-scans/${testScanId.toString()}/status`)
        .send({ status: 'healthy' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    it('should reject invalid status value', async () => {
      const response = await request(app)
        .put(`/api/health-scans/${testScanId.toString()}/status`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should return 404 for non-existent scan', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .put(`/api/health-scans/${fakeId.toString()}/status`)
        .send({ status: 'resolved' });

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NotFoundError');
    });
  });

  describe('PUT /api/health-scans/:id/outcome', () => {
    let testScanId: ObjectId;

    beforeEach(async () => {
      const db = getDatabase();
      const result = await db.collection('health_scans').insertOne({
        farmerId: testFarmerId,
        batchId: testBatchId,
        capturedAt: new Date(),
        diseaseLabel: 'Rice Blast',
        confidence: 85,
        status: 'pending'
      });
      testScanId = result.insertedId;
    });

    it('should update scan outcome to recovered', async () => {
      const response = await request(app)
        .put(`/api/health-scans/${testScanId.toString()}/outcome`)
        .send({ outcome: 'recovered' });

      expect(response.status).toBe(200);
      expect(response.body.outcome).toBe('recovered');
      expect(response.body.status).toBe('resolved'); // Auto-updated
    });

    it('should update scan outcome with feedback', async () => {
      const response = await request(app)
        .put(`/api/health-scans/${testScanId.toString()}/outcome`)
        .send({ 
          outcome: 'same',
          immediateFeedback: 'correct'
        });

      expect(response.status).toBe(200);
      expect(response.body.outcome).toBe('same');
      expect(response.body.immediateFeedback).toBe('correct');
    });

    it('should reject invalid outcome value', async () => {
      const response = await request(app)
        .put(`/api/health-scans/${testScanId.toString()}/outcome`)
        .send({ outcome: 'invalid-outcome' });

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should return 404 for non-existent scan', async () => {
      const fakeId = new ObjectId();
      const response = await request(app)
        .put(`/api/health-scans/${fakeId.toString()}/outcome`)
        .send({ outcome: 'recovered' });

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('NotFoundError');
    });
  });
});
