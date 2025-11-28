import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { FarmersRepository } from './farmers.repository';
import { hashPassword } from '../../utils/password';
import { ConflictError } from '../../utils/errors';

describe('FarmersRepository', () => {
  let repository: FarmersRepository;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new FarmersRepository(db);
    await repository.createIndexes();
  });

  afterAll(async () => {
    // Clean up test collection
    const db = getDatabase();
    await db.collection('farmers').drop().catch(() => {});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear collection before each test
    await repository['collection'].deleteMany({});
  });

  describe('create', () => {
    it('should create a farmer with hashed password', async () => {
      const passwordHash = await hashPassword('testPassword123');
      const farmerData = {
        phone: '+8801712345678',
        passwordHash,
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn' as const,
        roles: ['farmer' as const]
      };

      const created = await repository.create(farmerData);

      expect(created._id).toBeInstanceOf(ObjectId);
      expect(created.phone).toBe(farmerData.phone);
      expect(created.passwordHash).toBe(passwordHash);
      expect(created.name).toBe(farmerData.name);
      expect(created.registeredAt).toBeInstanceOf(Date);
    });

    it('should reject duplicate phone numbers', async () => {
      const passwordHash = await hashPassword('testPassword123');
      const farmerData = {
        phone: '+8801712345679',
        passwordHash,
        name: 'First Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn' as const,
        roles: ['farmer' as const]
      };

      await repository.create(farmerData);

      // Try to create another farmer with same phone
      const duplicateData = {
        ...farmerData,
        name: 'Second Farmer'
      };

      await expect(repository.create(duplicateData)).rejects.toThrow(ConflictError);
    });
  });

  describe('findByPhone', () => {
    it('should find farmer by phone number', async () => {
      const passwordHash = await hashPassword('testPassword123');
      const farmerData = {
        phone: '+8801712345680',
        passwordHash,
        name: 'Findable Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'bn' as const,
        roles: ['farmer' as const]
      };

      await repository.create(farmerData);
      const found = await repository.findByPhone('+8801712345680');

      expect(found).not.toBeNull();
      expect(found?.phone).toBe(farmerData.phone);
      expect(found?.name).toBe(farmerData.name);
    });

    it('should return null for non-existent phone', async () => {
      const found = await repository.findByPhone('+8801799999999');

      expect(found).toBeNull();
    });
  });

  describe('indexes', () => {
    it('should have created unique index on phone', async () => {
      const indexes = await repository['collection'].indexes();
      const phoneIndex = indexes.find(idx => idx.name === 'phone_unique');

      expect(phoneIndex).toBeDefined();
      expect(phoneIndex?.unique).toBe(true);
    });

    it('should have created location index', async () => {
      const indexes = await repository['collection'].indexes();
      const locationIndex = indexes.find(idx => idx.name === 'location_index');

      expect(locationIndex).toBeDefined();
      expect(locationIndex?.key).toHaveProperty('division');
      expect(locationIndex?.key).toHaveProperty('district');
      expect(locationIndex?.key).toHaveProperty('upazila');
    });
  });
});
