import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { createServer, initializeServer } from '../index';
import { getDatabase, closeDatabase } from '../db/connection';
import { hashPassword } from '../utils/password';
import { Express } from 'express';

describe('Dashboard Routes', () => {
  let app: Express;

  beforeAll(async () => {
    app = await initializeServer();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    const db = getDatabase();
    await db.collection('farmers').deleteMany({});
    await db.collection('crop_batches').deleteMany({});
    await db.collection('loss_events').deleteMany({});
    await db.collection('interventions').deleteMany({});
  });

  describe('GET /api/dashboard/farmer/:farmerId', () => {
    it('should return farmer dashboard metrics', async () => {
      const db = getDatabase();
      
      // Create a farmer
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567890',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmerId = farmerResult.insertedId;

      // Create crop batches
      await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });

      await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Wheat',
        stage: 'harvested',
        finalWeightKg: 300,
        actualHarvestDate: new Date('2024-10-15'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka',
        enteredDate: new Date()
      });

      const response = await request(app)
        .get(`/api/dashboard/farmer/${farmerId.toString()}`)
        .expect(200);

      expect(response.body).toMatchObject({
        farmerId: farmerId.toString(),
        totalCrops: 2,
        totalWeightKg: 300,
        growingCrops: 1,
        harvestedCrops: 1,
        totalLossWeightKg: 0,
        totalLossPercentage: 0,
        interventionSuccessRate: 0,
        badges: ['first_harvest']
      });
    });

    it('should return 400 for invalid farmer ID format', async () => {
      const response = await request(app)
        .get('/api/dashboard/farmer/invalid-id')
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should include loss metrics when loss events exist', async () => {
      const db = getDatabase();
      
      // Create a farmer
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567891',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmerId = farmerResult.insertedId;

      // Create a crop batch
      const batchResult = await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });
      const batchId = batchResult.insertedId;

      // Create loss events
      await db.collection('loss_events').insertOne({
        farmerId,
        batchId,
        eventType: 'pest',
        lossPercentage: 10,
        lossWeightKg: 50,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });

      await db.collection('loss_events').insertOne({
        farmerId,
        batchId,
        eventType: 'disease',
        lossPercentage: 20,
        lossWeightKg: 100,
        reportedAt: new Date(),
        location: 'Dhaka, Savar'
      });

      const response = await request(app)
        .get(`/api/dashboard/farmer/${farmerId.toString()}`)
        .expect(200);

      expect(response.body.totalLossWeightKg).toBe(150);
      expect(response.body.totalLossPercentage).toBe(15); // (10 + 20) / 2
    });

    it('should include intervention success rate', async () => {
      const db = getDatabase();
      
      // Create a farmer
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567892',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmerId = farmerResult.insertedId;

      // Create a crop batch
      const batchResult = await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });
      const batchId = batchResult.insertedId;

      // Create interventions (3 successful, 1 failed)
      await db.collection('interventions').insertMany([
        {
          farmerId,
          batchId,
          interventionType: 'pesticide',
          success: true,
          performedAt: new Date()
        },
        {
          farmerId,
          batchId,
          interventionType: 'fertilizer',
          success: true,
          performedAt: new Date()
        },
        {
          farmerId,
          batchId,
          interventionType: 'irrigation',
          success: true,
          performedAt: new Date()
        },
        {
          farmerId,
          batchId,
          interventionType: 'weeding',
          success: false,
          performedAt: new Date()
        }
      ]);

      const response = await request(app)
        .get(`/api/dashboard/farmer/${farmerId.toString()}`)
        .expect(200);

      expect(response.body.interventionSuccessRate).toBe(75); // 3/4 * 100
    });

    it('should award appropriate badges', async () => {
      const db = getDatabase();
      
      // Create a farmer
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567893',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmerId = farmerResult.insertedId;

      // Create a harvested batch with high yield
      await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Rice',
        stage: 'harvested',
        finalWeightKg: 1200,
        actualHarvestDate: new Date('2024-11-01'),
        storageLocation: 'silo',
        storageDivision: 'Dhaka',
        storageDistrict: 'Dhaka',
        enteredDate: new Date()
      });

      const response = await request(app)
        .get(`/api/dashboard/farmer/${farmerId.toString()}`)
        .expect(200);

      expect(response.body.badges).toContain('first_harvest');
      expect(response.body.badges).toContain('high_yield');
    });
  });

  describe('GET /api/dashboard/admin', () => {
    it('should return admin dashboard metrics with no data', async () => {
      const response = await request(app)
        .get('/api/dashboard/admin')
        .expect(200);

      expect(response.body).toMatchObject({
        totalFarmers: 0,
        totalCropBatches: 0,
        totalGrowingBatches: 0,
        totalHarvestedBatches: 0,
        totalLossWeightKg: 0,
        averageLossPercentage: 0,
        interventionSuccessRate: 0,
        topLossLocations: []
      });
    });

    it('should return correct system-wide metrics', async () => {
      const db = getDatabase();
      
      // Create farmers
      const farmer1Result = await db.collection('farmers').insertOne({
        phone: '+8801234567894',
        passwordHash: await hashPassword('password123'),
        name: 'Farmer 1',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmer1Id = farmer1Result.insertedId;

      const farmer2Result = await db.collection('farmers').insertOne({
        phone: '+8801234567895',
        passwordHash: await hashPassword('password123'),
        name: 'Farmer 2',
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Rangunia',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmer2Id = farmer2Result.insertedId;

      // Create crop batches
      await db.collection('crop_batches').insertMany([
        {
          farmerId: farmer1Id,
          cropType: 'Rice',
          stage: 'growing',
          estimatedWeightKg: 500,
          expectedHarvestDate: new Date('2025-12-01'),
          enteredDate: new Date()
        },
        {
          farmerId: farmer1Id,
          cropType: 'Wheat',
          stage: 'harvested',
          finalWeightKg: 300,
          actualHarvestDate: new Date('2024-10-15'),
          storageLocation: 'silo',
          storageDivision: 'Dhaka',
          storageDistrict: 'Dhaka',
          enteredDate: new Date()
        },
        {
          farmerId: farmer2Id,
          cropType: 'Rice',
          stage: 'harvested',
          finalWeightKg: 450,
          actualHarvestDate: new Date('2024-11-01'),
          storageLocation: 'jute_bag',
          storageDivision: 'Chittagong',
          storageDistrict: 'Chittagong',
          enteredDate: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/dashboard/admin')
        .expect(200);

      expect(response.body.totalFarmers).toBe(2);
      expect(response.body.totalCropBatches).toBe(3);
      expect(response.body.totalGrowingBatches).toBe(1);
      expect(response.body.totalHarvestedBatches).toBe(2);
    });

    it('should calculate system-wide loss metrics', async () => {
      const db = getDatabase();
      
      // Create a farmer
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567896',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmerId = farmerResult.insertedId;

      // Create a crop batch
      const batchResult = await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });
      const batchId = batchResult.insertedId;

      // Create loss events
      await db.collection('loss_events').insertMany([
        {
          farmerId,
          batchId,
          eventType: 'pest',
          lossPercentage: 10,
          lossWeightKg: 50,
          reportedAt: new Date(),
          location: 'Dhaka, Savar'
        },
        {
          farmerId,
          batchId,
          eventType: 'disease',
          lossPercentage: 20,
          lossWeightKg: 100,
          reportedAt: new Date(),
          location: 'Chittagong, Rangunia'
        }
      ]);

      const response = await request(app)
        .get('/api/dashboard/admin')
        .expect(200);

      expect(response.body.totalLossWeightKg).toBe(150);
      expect(response.body.averageLossPercentage).toBe(15); // (10 + 20) / 2
    });

    it('should calculate system-wide intervention success rate', async () => {
      const db = getDatabase();
      
      // Create a farmer
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567897',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmerId = farmerResult.insertedId;

      // Create a crop batch
      const batchResult = await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });
      const batchId = batchResult.insertedId;

      // Create interventions (4 successful, 1 failed)
      const interventions = [];
      for (let i = 0; i < 4; i++) {
        interventions.push({
          farmerId,
          batchId,
          interventionType: 'pesticide',
          success: true,
          performedAt: new Date()
        });
      }
      interventions.push({
        farmerId,
        batchId,
        interventionType: 'weeding',
        success: false,
        performedAt: new Date()
      });

      await db.collection('interventions').insertMany(interventions);

      const response = await request(app)
        .get('/api/dashboard/admin')
        .expect(200);

      expect(response.body.interventionSuccessRate).toBe(80); // 4/5 * 100
    });

    it('should return top loss locations', async () => {
      const db = getDatabase();
      
      // Create a farmer
      const farmerResult = await db.collection('farmers').insertOne({
        phone: '+8801234567898',
        passwordHash: await hashPassword('password123'),
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });
      const farmerId = farmerResult.insertedId;

      // Create a crop batch
      const batchResult = await db.collection('crop_batches').insertOne({
        farmerId,
        cropType: 'Rice',
        stage: 'growing',
        estimatedWeightKg: 500,
        expectedHarvestDate: new Date('2025-12-01'),
        enteredDate: new Date()
      });
      const batchId = batchResult.insertedId;

      // Create loss events in different locations
      await db.collection('loss_events').insertMany([
        {
          farmerId,
          batchId,
          eventType: 'pest',
          lossPercentage: 10,
          lossWeightKg: 100,
          reportedAt: new Date(),
          location: 'Dhaka, Savar'
        },
        {
          farmerId,
          batchId,
          eventType: 'disease',
          lossPercentage: 15,
          lossWeightKg: 50,
          reportedAt: new Date(),
          location: 'Chittagong, Rangunia'
        },
        {
          farmerId,
          batchId,
          eventType: 'weather',
          lossPercentage: 20,
          lossWeightKg: 75,
          reportedAt: new Date(),
          location: 'Dhaka, Savar'
        }
      ]);

      const response = await request(app)
        .get('/api/dashboard/admin')
        .expect(200);

      expect(response.body.topLossLocations.length).toBeGreaterThan(0);
      expect(response.body.topLossLocations[0]).toMatchObject({
        location: 'Dhaka, Savar',
        totalLossWeightKg: 175, // 100 + 75
        totalEvents: 2
      });
    });
  });
});
