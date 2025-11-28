import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { ObjectId } from 'mongodb';
import { createFarmersRouter } from './farmers';
import { errorHandler } from '../middleware/errorHandler';
import { connectToDatabase, getDatabase, closeDatabase } from '../db/connection';

describe('Farmers API Routes', () => {
  let app: Express;
  let testFarmerId: string;

  beforeAll(async () => {
    // Connect to database (will use existing connection if already connected)
    await connectToDatabase();
    const db = getDatabase();

    // Create Express app with farmers routes
    app = express();
    app.use(express.json());
    app.use('/api/farmers', createFarmersRouter());
    app.use(errorHandler);
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('farmers').deleteMany({ phone: { $regex: /^\+88017/ } });
  });

  beforeEach(async () => {
    // Clear test farmers before each test
    const db = getDatabase();
    await db.collection('farmers').deleteMany({ phone: { $regex: /^\+88017/ } });
  });

  describe('POST /api/farmers/register', () => {
    it('should register a new farmer with valid data', async () => {
      const farmerData = {
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn'
      };

      const response = await request(app)
        .post('/api/farmers/register')
        .send(farmerData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.phone).toBe(farmerData.phone);
      expect(response.body.name).toBe(farmerData.name);
      expect(response.body.division).toBe(farmerData.division);
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('password');

      testFarmerId = response.body._id;
    });

    it('should reject registration with invalid phone format', async () => {
      const farmerData = {
        phone: '1234567890', // Invalid format
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      const response = await request(app)
        .post('/api/farmers/register')
        .send(farmerData)
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject registration with short password', async () => {
      const farmerData = {
        phone: '+8801712345678',
        password: '123', // Too short
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      const response = await request(app)
        .post('/api/farmers/register')
        .send(farmerData)
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject registration with missing required fields', async () => {
      const farmerData = {
        phone: '+8801712345678',
        password: 'password123'
        // Missing name, division, district, upazila
      };

      const response = await request(app)
        .post('/api/farmers/register')
        .send(farmerData)
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should reject duplicate phone number', async () => {
      const farmerData = {
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      // Register first farmer
      await request(app)
        .post('/api/farmers/register')
        .send(farmerData)
        .expect(201);

      // Try to register with same phone
      const response = await request(app)
        .post('/api/farmers/register')
        .send(farmerData)
        .expect(409);

      expect(response.body.error.type).toBe('ConflictError');
    });
  });

  describe('POST /api/farmers/login', () => {
    beforeEach(async () => {
      // Register a farmer for login tests
      await request(app)
        .post('/api/farmers/register')
        .send({
          phone: '+8801712345678',
          password: 'password123',
          name: 'Test Farmer',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Savar'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/farmers/login')
        .send({
          phone: '+8801712345678',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('farmer');
      expect(response.body).toHaveProperty('message');
      expect(response.body.farmer.phone).toBe('+8801712345678');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/farmers/login')
        .send({
          phone: '+8801712345678',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error.type).toBe('AuthenticationError');
    });

    it('should reject login with non-existent phone', async () => {
      const response = await request(app)
        .post('/api/farmers/login')
        .send({
          phone: '+8801799999999',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error.type).toBe('AuthenticationError');
    });
  });

  describe('GET /api/farmers/:id', () => {
    beforeEach(async () => {
      // Register a farmer
      const response = await request(app)
        .post('/api/farmers/register')
        .send({
          phone: '+8801712345678',
          password: 'password123',
          name: 'Test Farmer',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Savar'
        });
      testFarmerId = response.body._id;
    });

    it('should get farmer by valid ID', async () => {
      const response = await request(app)
        .get(`/api/farmers/${testFarmerId}`)
        .expect(200);

      expect(response.body._id).toBe(testFarmerId);
      expect(response.body.phone).toBe('+8801712345678');
      expect(response.body.name).toBe('Test Farmer');
    });

    it('should return 404 for non-existent farmer', async () => {
      const nonExistentId = new ObjectId().toString();
      const response = await request(app)
        .get(`/api/farmers/${nonExistentId}`)
        .expect(404);

      expect(response.body.error.type).toBe('NotFoundError');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/farmers/invalid-id')
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('PUT /api/farmers/:id', () => {
    beforeEach(async () => {
      // Register a farmer
      const response = await request(app)
        .post('/api/farmers/register')
        .send({
          phone: '+8801712345678',
          password: 'password123',
          name: 'Test Farmer',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Savar'
        });
      testFarmerId = response.body._id;
    });

    it('should update farmer profile with valid data', async () => {
      const updateData = {
        name: 'Updated Farmer',
        language: 'en' as const
      };

      const response = await request(app)
        .put(`/api/farmers/${testFarmerId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Farmer');
      expect(response.body.language).toBe('en');
      expect(response.body.phone).toBe('+8801712345678'); // Unchanged
    });

    it('should update location fields', async () => {
      const updateData = {
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Rangunia'
      };

      const response = await request(app)
        .put(`/api/farmers/${testFarmerId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.division).toBe('Chittagong');
      expect(response.body.district).toBe('Chittagong');
      expect(response.body.upazila).toBe('Rangunia');
    });

    it('should return 404 for non-existent farmer', async () => {
      const nonExistentId = new ObjectId().toString();
      const response = await request(app)
        .put(`/api/farmers/${nonExistentId}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error.type).toBe('NotFoundError');
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .put(`/api/farmers/${testFarmerId}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    });
  });
});
