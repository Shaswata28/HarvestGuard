import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { AdvisoriesRepository } from '../db/repositories/advisories.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { AdvisoryService } from '../services/advisory.service';
import { Advisory } from '../db/schemas';

describe('Advisory Routes Integration', () => {
  let advisoriesRepository: AdvisoriesRepository;
  let farmersRepository: FarmersRepository;
  let advisoryService: AdvisoryService;
  let testFarmerId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    advisoriesRepository = new AdvisoriesRepository(db);
    farmersRepository = new FarmersRepository(db);
    advisoryService = new AdvisoryService(advisoriesRepository);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up test data
    const db = getDatabase();
    await db.collection('advisories').deleteMany({});
    await db.collection('farmers').deleteMany({});

    // Create a test farmer
    const farmer = await farmersRepository.create({
      phone: '+8801712345678',
      passwordHash: 'hashedpassword123',
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer'],
      registeredAt: new Date()
    });
    testFarmerId = farmer._id!;
  });

  describe('POST /api/advisories', () => {
    it('should create a farmer-specific advisory', async () => {
      const advisory = await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'weather',
        message: 'Heavy rain expected tomorrow',
        actions: ['Cover crops', 'Check drainage']
      });

      expect(advisory._id).toBeDefined();
      expect(advisory.farmerId?.toString()).toBe(testFarmerId.toString());
      expect(advisory.source).toBe('weather');
      expect(advisory.payload.message).toBe('Heavy rain expected tomorrow');
      expect(advisory.payload.actions).toEqual(['Cover crops', 'Check drainage']);
      expect(advisory.status).toBe('delivered');
      expect(advisory.createdAt).toBeInstanceOf(Date);
    });

    it('should create a broadcast advisory', async () => {
      const advisory = await advisoryService.createBroadcastAdvisory({
        source: 'manual',
        message: 'New pest control guidelines available',
        actions: ['Visit resource center']
      });

      expect(advisory._id).toBeDefined();
      expect(advisory.farmerId).toBeFalsy(); // null or undefined for broadcast
      expect(advisory.source).toBe('manual');
      expect(advisory.payload.message).toBe('New pest control guidelines available');
      expect(advisory.status).toBe('delivered');
    });

    it('should reject advisory with empty message', async () => {
      await expect(
        advisoryService.createFarmerAdvisory({
          farmerId: testFarmerId,
          source: 'weather',
          message: '   ',
          actions: []
        })
      ).rejects.toThrow('Advisory message cannot be empty');
    });

    it('should reject advisory with invalid source', async () => {
      await expect(
        advisoryService.createFarmerAdvisory({
          farmerId: testFarmerId,
          source: 'invalid' as any,
          message: 'Test message',
          actions: []
        })
      ).rejects.toThrow('Invalid advisory source');
    });
  });

  describe('GET /api/advisories', () => {
    beforeEach(async () => {
      // Create test advisories
      await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'weather',
        message: 'Farmer-specific advisory 1',
        actions: ['Action 1']
      });

      await advisoryService.createBroadcastAdvisory({
        source: 'manual',
        message: 'Broadcast advisory 1',
        actions: ['Action 2']
      });

      await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'scanner',
        message: 'Farmer-specific advisory 2'
      });
    });

    it('should get all advisories for a farmer (including broadcast)', async () => {
      const advisories = await advisoryService.getAdvisoriesForFarmer(testFarmerId);

      expect(advisories.length).toBe(3); // 2 farmer-specific + 1 broadcast
      expect(advisories.some(a => !a.farmerId)).toBe(true); // Has broadcast (null or undefined)
      expect(advisories.some(a => a.farmerId?.equals(testFarmerId))).toBe(true); // Has farmer-specific
    });

    it('should filter advisories by status', async () => {
      // Update one advisory status directly
      const advisories = await advisoriesRepository.findMany({});
      await advisoriesRepository.updateById(advisories[0]._id!, { status: 'read' } as any);

      const deliveredAdvisories = await advisoriesRepository.findMany({ status: 'delivered' });
      const readAdvisories = await advisoriesRepository.findMany({ status: 'read' });

      expect(deliveredAdvisories.length).toBe(2);
      expect(readAdvisories.length).toBe(1);
    });
  });

  describe('GET /api/advisories/:id', () => {
    it('should get an advisory by ID', async () => {
      const created = await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'weather',
        message: 'Test advisory',
        actions: ['Test action']
      });

      const advisory = await advisoryService.getAdvisoryById(created._id!);

      expect(advisory._id?.toString()).toBe(created._id!.toString());
      expect(advisory.payload.message).toBe('Test advisory');
    });

    it('should throw NotFoundError for non-existent advisory', async () => {
      const nonExistentId = new ObjectId();

      await expect(
        advisoryService.getAdvisoryById(nonExistentId)
      ).rejects.toThrow('Advisory not found');
    });
  });



  describe('Advisory filtering and querying', () => {
    it('should support filtering by source', async () => {
      await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'weather',
        message: 'Weather advisory'
      });

      await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'scanner',
        message: 'Scanner advisory'
      });

      const weatherAdvisories = await advisoriesRepository.findMany({ source: 'weather' });
      const scannerAdvisories = await advisoriesRepository.findMany({ source: 'scanner' });

      expect(weatherAdvisories.length).toBe(1);
      expect(scannerAdvisories.length).toBe(1);
    });


  });
});
