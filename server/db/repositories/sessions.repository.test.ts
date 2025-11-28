import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { SessionsRepository } from './sessions.repository';
import { Session } from '../schemas';

describe('SessionsRepository', () => {
  let repository: SessionsRepository;
  let testFarmerId: ObjectId;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new SessionsRepository(db);
    await repository.createIndexes();
    testFarmerId = new ObjectId();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up sessions collection before each test
    const db = getDatabase();
    await db.collection('sessions').deleteMany({});
  });

  describe('create', () => {
    it('should create a valid session', async () => {
      const sessionData: Omit<Session, '_id'> = {
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date()
      };

      const created = await repository.create(sessionData);

      expect(created._id).toBeInstanceOf(ObjectId);
      expect(created.farmerId).toEqual(testFarmerId);
      expect(created.authType).toBe('password');
      expect(created.expiresAt).toBeInstanceOf(Date);
    });

    it('should create a session with device metadata', async () => {
      const sessionData: Omit<Session, '_id'> = {
        farmerId: testFarmerId,
        authType: 'otp',
        expiresAt: new Date(Date.now() + 3600000),
        deviceMeta: {
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1'
        },
        createdAt: new Date()
      };

      const created = await repository.create(sessionData);

      expect(created.deviceMeta).toBeDefined();
      expect(created.deviceMeta?.userAgent).toBe('Mozilla/5.0');
      expect(created.deviceMeta?.ip).toBe('192.168.1.1');
    });
  });

  describe('findByFarmerId', () => {
    it('should find all sessions for a farmer', async () => {
      const farmerId = new ObjectId();

      // Create multiple sessions for the same farmer
      await repository.create({
        farmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(Date.now() - 2000)
      });

      await repository.create({
        farmerId,
        authType: 'otp',
        expiresAt: new Date(Date.now() + 7200000),
        createdAt: new Date(Date.now() - 1000)
      });

      // Create a session for a different farmer
      await repository.create({
        farmerId: new ObjectId(),
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      });

      const sessions = await repository.findByFarmerId(farmerId);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].farmerId).toEqual(farmerId);
      expect(sessions[1].farmerId).toEqual(farmerId);
      // Should be sorted by createdAt descending (most recent first)
      expect(sessions[0].createdAt.getTime()).toBeGreaterThan(sessions[1].createdAt.getTime());
    });

    it('should return empty array if no sessions found', async () => {
      const sessions = await repository.findByFarmerId(new ObjectId());
      expect(sessions).toEqual([]);
    });
  });

  describe('validateSession', () => {
    it('should return true for valid non-expired session', async () => {
      const session = await repository.create({
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date()
      });

      const isValid = await repository.validateSession(session._id!);
      expect(isValid).toBe(true);
    });

    it('should return false for expired session', async () => {
      const session = await repository.create({
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(Date.now() - 3600000)
      });

      const isValid = await repository.validateSession(session._id!);
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      const isValid = await repository.validateSession(new ObjectId());
      expect(isValid).toBe(false);
    });
  });

  describe('deleteExpired', () => {
    it('should delete only expired sessions', async () => {
      // Create expired sessions
      await repository.create({
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(Date.now() - 3600000)
      });

      await repository.create({
        farmerId: testFarmerId,
        authType: 'otp',
        expiresAt: new Date(Date.now() - 2000),
        createdAt: new Date(Date.now() - 7200000)
      });

      // Create valid session
      await repository.create({
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(2);

      // Verify only valid session remains
      const remainingSessions = await repository.findByFarmerId(testFarmerId);
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return 0 if no expired sessions', async () => {
      await repository.create({
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      });

      const deletedCount = await repository.deleteExpired();
      expect(deletedCount).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find a session by ID', async () => {
      const created = await repository.create({
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      });

      const found = await repository.findById(created._id!);

      expect(found).toBeDefined();
      expect(found?._id).toEqual(created._id);
      expect(found?.farmerId).toEqual(testFarmerId);
    });

    it('should return null if session not found', async () => {
      const found = await repository.findById(new ObjectId());
      expect(found).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete a session by ID', async () => {
      const created = await repository.create({
        farmerId: testFarmerId,
        authType: 'password',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      });

      const deleted = await repository.deleteById(created._id!);
      expect(deleted).toBe(true);

      const found = await repository.findById(created._id!);
      expect(found).toBeNull();
    });

    it('should return false if session not found', async () => {
      const deleted = await repository.deleteById(new ObjectId());
      expect(deleted).toBe(false);
    });
  });
});
