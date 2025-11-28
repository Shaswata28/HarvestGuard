import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { AdvisoriesRepository } from './advisories.repository';
import { Advisory } from '../schemas';

describe('AdvisoriesRepository', () => {
  let repository: AdvisoriesRepository;
  let testFarmerId: ObjectId;
  let testFarmerId2: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new AdvisoriesRepository(db);
    await repository.createIndexes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('advisories').deleteMany({});
    
    // Create test farmer IDs
    testFarmerId = new ObjectId();
    testFarmerId2 = new ObjectId();
  });

  describe('create', () => {
    it('should create a farmer-specific advisory', async () => {
      const advisoryData: Omit<Advisory, '_id'> = {
        farmerId: testFarmerId,
        source: 'weather',
        payload: {
          message: 'Heavy rain expected tomorrow',
          actions: ['Secure crops', 'Check drainage']
        },
        status: 'delivered',
        createdAt: new Date()
      };

      const created = await repository.create(advisoryData);

      expect(created._id).toBeInstanceOf(ObjectId);
      expect(created.farmerId).toEqual(testFarmerId);
      expect(created.source).toBe('weather');
      expect(created.payload.message).toBe('Heavy rain expected tomorrow');
      expect(created.status).toBe('delivered');
    });

    it('should create a broadcast advisory with null farmerId', async () => {
      const advisoryData: Omit<Advisory, '_id'> = {
        farmerId: undefined,
        source: 'manual',
        payload: {
          message: 'System maintenance scheduled',
          actions: ['Save your work']
        },
        status: 'delivered',
        createdAt: new Date()
      };

      const created = await repository.create(advisoryData);

      expect(created._id).toBeInstanceOf(ObjectId);
      // MongoDB stores undefined as null
      expect(created.farmerId).toBeNull();
      expect(created.source).toBe('manual');
      expect(created.payload.message).toBe('System maintenance scheduled');
    });

    it('should create advisory from scanner source', async () => {
      const advisoryData: Omit<Advisory, '_id'> = {
        farmerId: testFarmerId,
        source: 'scanner',
        payload: {
          message: 'Disease detected: Apply fungicide',
          actions: ['Apply treatment', 'Monitor progress']
        },
        status: 'delivered',
        createdAt: new Date()
      };

      const created = await repository.create(advisoryData);

      expect(created._id).toBeInstanceOf(ObjectId);
      expect(created.source).toBe('scanner');
    });
  });

  describe('findByFarmerId', () => {
    it('should find farmer-specific advisories', async () => {
      // Create advisories for farmer 1
      await repository.create({
        farmerId: testFarmerId,
        source: 'weather',
        payload: { message: 'Advisory 1' },
        status: 'delivered',
        createdAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        source: 'scanner',
        payload: { message: 'Advisory 2' },
        status: 'read',
        createdAt: new Date()
      });

      // Create advisory for farmer 2
      await repository.create({
        farmerId: testFarmerId2,
        source: 'manual',
        payload: { message: 'Advisory 3' },
        status: 'delivered',
        createdAt: new Date()
      });

      const advisories = await repository.findByFarmerId(testFarmerId);

      expect(advisories).toHaveLength(2);
      expect(advisories.every(a => a.farmerId?.equals(testFarmerId))).toBe(true);
    });

    it('should include broadcast advisories for any farmer', async () => {
      // Create farmer-specific advisory
      await repository.create({
        farmerId: testFarmerId,
        source: 'weather',
        payload: { message: 'Farmer specific' },
        status: 'delivered',
        createdAt: new Date()
      });

      // Create broadcast advisory
      await repository.create({
        farmerId: undefined,
        source: 'manual',
        payload: { message: 'Broadcast message' },
        status: 'delivered',
        createdAt: new Date()
      });

      const advisories = await repository.findByFarmerId(testFarmerId);

      expect(advisories).toHaveLength(2);
      // MongoDB stores undefined as null
      expect(advisories.some(a => a.farmerId === null || a.farmerId === undefined)).toBe(true);
      expect(advisories.some(a => a.farmerId?.equals(testFarmerId))).toBe(true);
    });

    it('should return advisories sorted by creation date (newest first)', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      await repository.create({
        farmerId: testFarmerId,
        source: 'weather',
        payload: { message: 'Old advisory' },
        status: 'delivered',
        createdAt: twoDaysAgo
      });

      await repository.create({
        farmerId: testFarmerId,
        source: 'scanner',
        payload: { message: 'Recent advisory' },
        status: 'delivered',
        createdAt: yesterday
      });

      await repository.create({
        farmerId: testFarmerId,
        source: 'manual',
        payload: { message: 'Latest advisory' },
        status: 'delivered',
        createdAt: now
      });

      const advisories = await repository.findByFarmerId(testFarmerId);

      expect(advisories).toHaveLength(3);
      expect(advisories[0].payload.message).toBe('Latest advisory');
      expect(advisories[1].payload.message).toBe('Recent advisory');
      expect(advisories[2].payload.message).toBe('Old advisory');
    });
  });



  describe('findById', () => {
    it('should find advisory by ID', async () => {
      const advisory = await repository.create({
        farmerId: testFarmerId,
        source: 'weather',
        payload: { message: 'Test advisory' },
        status: 'delivered',
        createdAt: new Date()
      });

      const found = await repository.findById(advisory._id!);

      expect(found).not.toBeNull();
      expect(found!._id).toEqual(advisory._id);
      expect(found!.payload.message).toBe('Test advisory');
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = new ObjectId();
      const found = await repository.findById(nonExistentId);

      expect(found).toBeNull();
    });
  });

  describe('count', () => {
    it('should count advisories for a farmer', async () => {
      await repository.create({
        farmerId: testFarmerId,
        source: 'weather',
        payload: { message: 'Advisory 1' },
        status: 'delivered',
        createdAt: new Date()
      });

      await repository.create({
        farmerId: testFarmerId,
        source: 'scanner',
        payload: { message: 'Advisory 2' },
        status: 'delivered',
        createdAt: new Date()
      });

      const count = await repository.count({ farmerId: testFarmerId } as any);

      expect(count).toBe(2);
    });

    it('should count broadcast advisories', async () => {
      await repository.create({
        farmerId: undefined,
        source: 'manual',
        payload: { message: 'Broadcast 1' },
        status: 'delivered',
        createdAt: new Date()
      });

      await repository.create({
        farmerId: undefined,
        source: 'manual',
        payload: { message: 'Broadcast 2' },
        status: 'delivered',
        createdAt: new Date()
      });

      // MongoDB stores undefined as null, so we need to check for null
      const count = await repository.count({ farmerId: null } as any);

      expect(count).toBe(2);
    });
  });
});
