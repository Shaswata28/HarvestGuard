import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { AdvisoriesRepository } from '../db/repositories/advisories.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { AdvisoryService } from './advisory.service';
import { hashPassword } from '../utils/password';
import { ValidationError, NotFoundError } from '../utils/errors';

describe('AdvisoryService', () => {
  let advisoryService: AdvisoryService;
  let advisoriesRepository: AdvisoriesRepository;
  let farmersRepository: FarmersRepository;
  let testFarmerId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    
    advisoriesRepository = new AdvisoriesRepository(db);
    farmersRepository = new FarmersRepository(db);
    advisoryService = new AdvisoryService(advisoriesRepository);

    // Create indexes
    await advisoriesRepository.createIndexes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up collections
    const db = getDatabase();
    await db.collection('advisories').deleteMany({});
    await db.collection('farmers').deleteMany({});

    // Create a test farmer
    const passwordHash = await hashPassword('password123');
    const testFarmer = await farmersRepository.create({
      phone: '+8801712345678',
      passwordHash,
      name: 'Test Farmer',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Savar',
      language: 'bn',
      roles: ['farmer'],
      registeredAt: new Date()
    });
    testFarmerId = testFarmer._id!;
  });

  describe('createFarmerAdvisory', () => {
    it('should create a farmer-specific advisory', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'weather' as const,
        message: 'Heavy rain expected tomorrow',
        actions: ['Harvest early', 'Cover crops']
      };

      const advisory = await advisoryService.createFarmerAdvisory(input);

      expect(advisory._id).toBeDefined();
      expect(advisory.farmerId?.equals(testFarmerId)).toBe(true);
      expect(advisory.source).toBe('weather');
      expect(advisory.payload.message).toBe('Heavy rain expected tomorrow');
      expect(advisory.payload.actions).toEqual(['Harvest early', 'Cover crops']);
      expect(advisory.status).toBe('delivered');
      expect(advisory.createdAt).toBeInstanceOf(Date);
    });

    it('should create advisory without actions', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'manual' as const,
        message: 'Check your crops today'
      };

      const advisory = await advisoryService.createFarmerAdvisory(input);

      expect(advisory.payload.message).toBe('Check your crops today');
      expect(advisory.payload.actions).toBeFalsy(); // MongoDB stores undefined as null
    });

    it('should trim message and actions', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'scanner' as const,
        message: '  Disease detected  ',
        actions: ['  Apply fungicide  ', '  Monitor daily  ']
      };

      const advisory = await advisoryService.createFarmerAdvisory(input);

      expect(advisory.payload.message).toBe('Disease detected');
      expect(advisory.payload.actions).toEqual(['Apply fungicide', 'Monitor daily']);
    });

    it('should reject empty message', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'weather' as const,
        message: '   '
      };

      await expect(advisoryService.createFarmerAdvisory(input))
        .rejects.toThrow(ValidationError);
    });

    it('should reject message that is too long', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'weather' as const,
        message: 'a'.repeat(5001)
      };

      await expect(advisoryService.createFarmerAdvisory(input))
        .rejects.toThrow(ValidationError);
    });

    it('should reject invalid source', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'invalid' as any,
        message: 'Test message'
      };

      await expect(advisoryService.createFarmerAdvisory(input))
        .rejects.toThrow(ValidationError);
    });

    it('should reject empty actions array', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'weather' as const,
        message: 'Test message',
        actions: []
      };

      await expect(advisoryService.createFarmerAdvisory(input))
        .rejects.toThrow(ValidationError);
    });

    it('should reject actions with empty strings', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'weather' as const,
        message: 'Test message',
        actions: ['Valid action', '   ', 'Another valid action']
      };

      await expect(advisoryService.createFarmerAdvisory(input))
        .rejects.toThrow(ValidationError);
    });

    it('should reject too many actions', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'weather' as const,
        message: 'Test message',
        actions: Array(21).fill('Action')
      };

      await expect(advisoryService.createFarmerAdvisory(input))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('createBroadcastAdvisory', () => {
    it('should create a broadcast advisory', async () => {
      const input = {
        source: 'weather' as const,
        message: 'Cyclone warning for all regions',
        actions: ['Secure crops', 'Stay safe']
      };

      const advisory = await advisoryService.createBroadcastAdvisory(input);

      expect(advisory._id).toBeDefined();
      expect(advisory.farmerId).toBeFalsy(); // MongoDB stores undefined as null
      expect(advisory.source).toBe('weather');
      expect(advisory.payload.message).toBe('Cyclone warning for all regions');
      expect(advisory.payload.actions).toEqual(['Secure crops', 'Stay safe']);
      expect(advisory.status).toBe('delivered');
    });

    it('should create broadcast advisory without actions', async () => {
      const input = {
        source: 'manual' as const,
        message: 'System maintenance scheduled'
      };

      const advisory = await advisoryService.createBroadcastAdvisory(input);

      expect(advisory.farmerId).toBeFalsy(); // MongoDB stores undefined as null
      expect(advisory.payload.message).toBe('System maintenance scheduled');
      expect(advisory.payload.actions).toBeFalsy(); // MongoDB stores undefined as null
    });
  });

  describe('deliverAdvisory', () => {
    it('should deliver farmer-specific advisory', async () => {
      const input = {
        farmerId: testFarmerId,
        source: 'scanner' as const,
        message: 'Disease detected in your crop'
      };

      const result = await advisoryService.deliverAdvisory(input);

      expect(result.isBroadcast).toBe(false);
      expect(result.targetFarmerId?.equals(testFarmerId)).toBe(true);
      expect(result.advisory.farmerId?.equals(testFarmerId)).toBe(true);
    });

    it('should deliver broadcast advisory', async () => {
      const input = {
        source: 'weather' as const,
        message: 'General weather update'
      };

      const result = await advisoryService.deliverAdvisory(input);

      expect(result.isBroadcast).toBe(true);
      expect(result.targetFarmerId).toBeUndefined();
      expect(result.advisory.farmerId).toBeFalsy(); // MongoDB stores undefined as null
    });
  });

  describe('getAdvisoriesForFarmer', () => {
    it('should get farmer-specific advisories', async () => {
      // Create farmer-specific advisory
      await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'scanner' as const,
        message: 'Your crop advisory'
      });

      const advisories = await advisoryService.getAdvisoriesForFarmer(testFarmerId);

      expect(advisories).toHaveLength(1);
      expect(advisories[0].farmerId?.equals(testFarmerId)).toBe(true);
    });

    it('should get broadcast advisories for farmer', async () => {
      // Create broadcast advisory
      await advisoryService.createBroadcastAdvisory({
        source: 'weather' as const,
        message: 'Broadcast message'
      });

      const advisories = await advisoryService.getAdvisoriesForFarmer(testFarmerId);

      expect(advisories).toHaveLength(1);
      expect(advisories[0].farmerId).toBeFalsy(); // MongoDB stores undefined as null
    });

    it('should get both farmer-specific and broadcast advisories', async () => {
      // Create farmer-specific advisory
      await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'scanner' as const,
        message: 'Your crop advisory'
      });

      // Create broadcast advisory
      await advisoryService.createBroadcastAdvisory({
        source: 'weather' as const,
        message: 'Broadcast message'
      });

      const advisories = await advisoryService.getAdvisoriesForFarmer(testFarmerId);

      expect(advisories).toHaveLength(2);
    });

    it('should not get advisories for other farmers', async () => {
      // Create another farmer
      const passwordHash = await hashPassword('password123');
      const otherFarmer = await farmersRepository.create({
        phone: '+8801798765432',
        passwordHash,
        name: 'Other Farmer',
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Rangunia',
        language: 'bn',
        roles: ['farmer'],
        registeredAt: new Date()
      });

      // Create advisory for other farmer
      await advisoryService.createFarmerAdvisory({
        farmerId: otherFarmer._id!,
        source: 'scanner' as const,
        message: 'Other farmer advisory'
      });

      const advisories = await advisoryService.getAdvisoriesForFarmer(testFarmerId);

      expect(advisories).toHaveLength(0);
    });
  });



  describe('getAdvisoryById', () => {
    it('should get advisory by ID', async () => {
      const created = await advisoryService.createFarmerAdvisory({
        farmerId: testFarmerId,
        source: 'scanner' as const,
        message: 'Test advisory'
      });

      const advisory = await advisoryService.getAdvisoryById(created._id!);

      expect(advisory._id?.equals(created._id!)).toBe(true);
      expect(advisory.payload.message).toBe('Test advisory');
    });

    it('should throw NotFoundError if advisory does not exist', async () => {
      const nonExistentId = new ObjectId();

      await expect(advisoryService.getAdvisoryById(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });
  });


});
