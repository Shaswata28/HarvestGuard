import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { connectToDatabase, closeDatabase, getDatabase } from '../connection';
import { BaseRepository } from './base.repository';
import { ValidationError, ConflictError, NotFoundError } from '../../utils/errors';

// Test schema
const TestSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).max(150),
  createdAt: z.date().default(() => new Date())
});

type TestDocument = z.infer<typeof TestSchema>;

describe('BaseRepository', () => {
  let repository: BaseRepository<TestDocument>;
  const testCollectionName = 'test_base_repository';

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new BaseRepository(db, testCollectionName, TestSchema);
  });

  afterAll(async () => {
    // Clean up test collection
    const db = getDatabase();
    await db.collection(testCollectionName).drop().catch(() => {});
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clear collection before each test
    await repository['collection'].deleteMany({});
  });

  describe('create', () => {
    it('should create a valid document', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const created = await repository.create(data);

      expect(created._id).toBeInstanceOf(ObjectId);
      expect(created.name).toBe(data.name);
      expect(created.email).toBe(data.email);
      expect(created.age).toBe(data.age);
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    it('should reject invalid document with validation error', async () => {
      const invalidData = {
        name: '',
        email: 'not-an-email',
        age: -5
      };

      await expect(repository.create(invalidData as any)).rejects.toThrow(ValidationError);
    });

    it('should reject document with missing required fields', async () => {
      const incompleteData = {
        name: 'John Doe'
        // missing email and age
      };

      await expect(repository.create(incompleteData as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('findById', () => {
    it('should find document by ID', async () => {
      const data = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25
      };

      const created = await repository.create(data);
      const found = await repository.findById(created._id!);

      expect(found).not.toBeNull();
      expect(found?._id?.toString()).toBe(created._id?.toString());
      expect(found?.name).toBe(data.name);
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = new ObjectId();
      const found = await repository.findById(nonExistentId);

      expect(found).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find document by filter', async () => {
      const data = {
        name: 'Bob Smith',
        email: 'bob@example.com',
        age: 35
      };

      await repository.create(data);
      const found = await repository.findOne({ email: 'bob@example.com' } as any);

      expect(found).not.toBeNull();
      expect(found?.email).toBe(data.email);
    });

    it('should return null when no match found', async () => {
      const found = await repository.findOne({ email: 'nonexistent@example.com' } as any);

      expect(found).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find multiple documents', async () => {
      await repository.create({ name: 'User 1', email: 'user1@example.com', age: 20 });
      await repository.create({ name: 'User 2', email: 'user2@example.com', age: 30 });
      await repository.create({ name: 'User 3', email: 'user3@example.com', age: 40 });

      const found = await repository.findMany({});

      expect(found).toHaveLength(3);
    });

    it('should filter documents correctly', async () => {
      await repository.create({ name: 'Young User', email: 'young@example.com', age: 20 });
      await repository.create({ name: 'Old User', email: 'old@example.com', age: 60 });

      const found = await repository.findMany({ age: { $gte: 50 } } as any);

      expect(found).toHaveLength(1);
      expect(found[0].age).toBe(60);
    });

    it('should return empty array when no matches', async () => {
      const found = await repository.findMany({ age: { $gt: 200 } } as any);

      expect(found).toHaveLength(0);
    });
  });

  describe('updateById', () => {
    it('should update document by ID', async () => {
      const data = {
        name: 'Original Name',
        email: 'original@example.com',
        age: 25
      };

      const created = await repository.create(data);
      const updated = await repository.updateById(created._id!, { name: 'Updated Name' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.email).toBe(data.email); // unchanged
    });

    it('should validate update data', async () => {
      const data = {
        name: 'Test User',
        email: 'test@example.com',
        age: 30
      };

      const created = await repository.create(data);

      await expect(
        repository.updateById(created._id!, { age: -10 } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = new ObjectId();
      const updated = await repository.updateById(nonExistentId, { name: 'New Name' });

      expect(updated).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete document by ID', async () => {
      const data = {
        name: 'To Delete',
        email: 'delete@example.com',
        age: 30
      };

      const created = await repository.create(data);
      const deleted = await repository.deleteById(created._id!);

      expect(deleted).toBe(true);

      const found = await repository.findById(created._id!);
      expect(found).toBeNull();
    });

    it('should return false for non-existent ID', async () => {
      const nonExistentId = new ObjectId();
      const deleted = await repository.deleteById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all documents', async () => {
      await repository.create({ name: 'User 1', email: 'user1@example.com', age: 20 });
      await repository.create({ name: 'User 2', email: 'user2@example.com', age: 30 });

      const count = await repository.count({});

      expect(count).toBe(2);
    });

    it('should count filtered documents', async () => {
      await repository.create({ name: 'Young', email: 'young@example.com', age: 20 });
      await repository.create({ name: 'Old', email: 'old@example.com', age: 60 });

      const count = await repository.count({ age: { $gte: 50 } } as any);

      expect(count).toBe(1);
    });

    it('should return 0 for no matches', async () => {
      const count = await repository.count({ age: { $gt: 200 } } as any);

      expect(count).toBe(0);
    });
  });
});
