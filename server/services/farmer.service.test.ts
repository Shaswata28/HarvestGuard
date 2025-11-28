import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { FarmerService, RegisterFarmerInput } from './farmer.service';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { connectToDatabase, closeDatabase, getDatabase } from '../db/connection';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError } from '../utils/errors';
import { verifyPassword } from '../utils/password';

describe('FarmerService', () => {
  let service: FarmerService;
  let repository: FarmersRepository;

  beforeAll(async () => {
    await connectToDatabase();
    const db = getDatabase();
    repository = new FarmersRepository(db);
    service = new FarmerService(repository);
    await repository.createIndexes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up farmers collection before each test
    const db = getDatabase();
    await db.collection('farmers').deleteMany({});
  });

  describe('register', () => {
    it('should register a new farmer with valid data', async () => {
      const input: RegisterFarmerInput = {
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      const farmer = await service.register(input);

      expect(farmer._id).toBeInstanceOf(ObjectId);
      expect(farmer.phone).toBe(input.phone);
      expect(farmer.name).toBe(input.name);
      expect(farmer.division).toBe(input.division);
      expect(farmer.district).toBe(input.district);
      expect(farmer.upazila).toBe(input.upazila);
      expect(farmer.language).toBe('bn'); // default
      expect(farmer.roles).toEqual(['farmer']); // default
      expect(farmer.passwordHash).not.toBe(input.password); // should be hashed
      expect(farmer.registeredAt).toBeInstanceOf(Date);
    });

    it('should register a farmer with custom language and roles', async () => {
      const input: RegisterFarmerInput = {
        phone: '+8801712345678',
        password: 'password123',
        name: 'Admin Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        language: 'en',
        roles: ['farmer', 'admin']
      };

      const farmer = await service.register(input);

      expect(farmer.language).toBe('en');
      expect(farmer.roles).toEqual(['farmer', 'admin']);
    });

    it('should throw ValidationError for invalid phone format', async () => {
      const input: RegisterFarmerInput = {
        phone: '01712345678', // missing +880
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      await expect(service.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      const input: RegisterFarmerInput = {
        phone: '+8801712345678',
        password: '12345', // too short
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      await expect(service.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty name', async () => {
      const input: RegisterFarmerInput = {
        phone: '+8801712345678',
        password: 'password123',
        name: '   ', // empty after trim
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      await expect(service.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty location fields', async () => {
      const input: RegisterFarmerInput = {
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: '',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      await expect(service.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError for duplicate phone number', async () => {
      const input: RegisterFarmerInput = {
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      await service.register(input);
      await expect(service.register(input)).rejects.toThrow(ConflictError);
    });

    it('should hash password before storage', async () => {
      const input: RegisterFarmerInput = {
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      };

      const farmer = await service.register(input);
      
      // Password should be hashed
      expect(farmer.passwordHash).not.toBe(input.password);
      
      // But should verify correctly
      const isValid = await verifyPassword(input.password, farmer.passwordHash);
      expect(isValid).toBe(true);
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      // Register a test farmer
      await service.register({
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      });
    });

    it('should authenticate with valid credentials', async () => {
      const result = await service.authenticate({
        phone: '+8801712345678',
        password: 'password123'
      });

      expect(result.authenticated).toBe(true);
      expect(result.farmer.phone).toBe('+8801712345678');
      expect(result.farmer.name).toBe('Test Farmer');
    });

    it('should throw AuthenticationError for non-existent phone', async () => {
      await expect(
        service.authenticate({
          phone: '+8801799999999',
          password: 'password123'
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for incorrect password', async () => {
      await expect(
        service.authenticate({
          phone: '+8801712345678',
          password: 'wrongpassword'
        })
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('getFarmerById', () => {
    it('should get farmer by ID', async () => {
      const registered = await service.register({
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      });

      const farmer = await service.getFarmerById(registered._id!);

      expect(farmer._id).toEqual(registered._id);
      expect(farmer.phone).toBe(registered.phone);
    });

    it('should throw NotFoundError for non-existent ID', async () => {
      const fakeId = new ObjectId();
      await expect(service.getFarmerById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getFarmerByPhone', () => {
    it('should get farmer by phone', async () => {
      await service.register({
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      });

      const farmer = await service.getFarmerByPhone('+8801712345678');

      expect(farmer.phone).toBe('+8801712345678');
      expect(farmer.name).toBe('Test Farmer');
    });

    it('should throw NotFoundError for non-existent phone', async () => {
      await expect(
        service.getFarmerByPhone('+8801799999999')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProfile', () => {
    let farmerId: ObjectId;

    beforeEach(async () => {
      const farmer = await service.register({
        phone: '+8801712345678',
        password: 'password123',
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      });
      farmerId = farmer._id!;
    });

    it('should update farmer name', async () => {
      const updated = await service.updateProfile(farmerId, {
        name: 'Updated Name'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.division).toBe('Dhaka'); // unchanged
    });

    it('should update farmer location', async () => {
      const updated = await service.updateProfile(farmerId, {
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Rangunia'
      });

      expect(updated.division).toBe('Chittagong');
      expect(updated.district).toBe('Chittagong');
      expect(updated.upazila).toBe('Rangunia');
    });

    it('should update farmer language', async () => {
      const updated = await service.updateProfile(farmerId, {
        language: 'en'
      });

      expect(updated.language).toBe('en');
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(
        service.updateProfile(farmerId, { name: '   ' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty location fields', async () => {
      await expect(
        service.updateProfile(farmerId, { division: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent farmer', async () => {
      const fakeId = new ObjectId();
      await expect(
        service.updateProfile(fakeId, { name: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('changePassword', () => {
    let farmerId: ObjectId;
    const currentPassword = 'password123';
    const newPassword = 'newpassword456';

    beforeEach(async () => {
      const farmer = await service.register({
        phone: '+8801712345678',
        password: currentPassword,
        name: 'Test Farmer',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar'
      });
      farmerId = farmer._id!;
    });

    it('should change password with valid current password', async () => {
      const updated = await service.changePassword(
        farmerId,
        currentPassword,
        newPassword
      );

      // Verify new password works
      const isNewPasswordValid = await verifyPassword(newPassword, updated.passwordHash);
      expect(isNewPasswordValid).toBe(true);

      // Verify old password doesn't work
      const isOldPasswordValid = await verifyPassword(currentPassword, updated.passwordHash);
      expect(isOldPasswordValid).toBe(false);
    });

    it('should throw AuthenticationError for incorrect current password', async () => {
      await expect(
        service.changePassword(farmerId, 'wrongpassword', newPassword)
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw ValidationError for weak new password', async () => {
      await expect(
        service.changePassword(farmerId, currentPassword, '12345')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when new password equals current password', async () => {
      await expect(
        service.changePassword(farmerId, currentPassword, currentPassword)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent farmer', async () => {
      const fakeId = new ObjectId();
      await expect(
        service.changePassword(fakeId, currentPassword, newPassword)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
