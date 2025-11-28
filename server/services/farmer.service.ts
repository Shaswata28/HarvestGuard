import { ObjectId } from 'mongodb';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { Farmer } from '../db/schemas';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  logError
} from '../utils/errors';

/**
 * Input data for farmer registration
 */
export interface RegisterFarmerInput {
  phone: string;
  password: string;
  name: string;
  division: string;
  district: string;
  upazila: string;
  language?: 'bn' | 'en';
  roles?: ('farmer' | 'admin')[];
}

/**
 * Input data for farmer authentication
 */
export interface AuthenticateFarmerInput {
  phone: string;
  password: string;
}

/**
 * Input data for updating farmer profile
 */
export interface UpdateFarmerProfileInput {
  name?: string;
  division?: string;
  district?: string;
  upazila?: string;
  language?: 'bn' | 'en';
}

/**
 * Result of successful authentication
 */
export interface AuthenticationResult {
  farmer: Farmer;
  authenticated: boolean;
}

/**
 * Service layer for farmer-related business logic
 */
export class FarmerService {
  constructor(private farmersRepository: FarmersRepository) {}

  /**
   * Registers a new farmer
   * @param input - Registration data
   * @returns Promise resolving to the created farmer
   * @throws ValidationError if input is invalid
   * @throws ConflictError if phone number already exists
   */
  async register(input: RegisterFarmerInput): Promise<Farmer> {
    try {
      // Business validation: phone format
      this.validatePhoneFormat(input.phone);

      // Business validation: password strength
      this.validatePasswordStrength(input.password);

      // Business validation: name length
      if (input.name.trim().length === 0) {
        throw new ValidationError('Name cannot be empty', { field: 'name' });
      }

      // Business validation: location fields
      this.validateLocationFields(input.division, input.district, input.upazila);

      // Check if farmer already exists
      const existingFarmer = await this.farmersRepository.findByPhone(input.phone);
      if (existingFarmer) {
        throw new ConflictError(
          'A farmer with this phone number already exists',
          { field: 'phone', value: input.phone }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create farmer document
      const farmerData: Omit<Farmer, '_id'> = {
        phone: input.phone,
        passwordHash,
        name: input.name.trim(),
        division: input.division.trim(),
        district: input.district.trim(),
        upazila: input.upazila.trim(),
        language: input.language || 'bn',
        roles: input.roles || ['farmer'],
        registeredAt: new Date()
      };

      const farmer = await this.farmersRepository.create(farmerData);
      
      console.log(`✓ Farmer registered successfully: ${farmer.phone}`);
      return farmer;
    } catch (error) {
      logError(error as Error, 'FarmerService.register');
      throw error;
    }
  }

  /**
   * Authenticates a farmer with phone and password
   * @param input - Authentication credentials
   * @returns Promise resolving to authentication result
   * @throws AuthenticationError if credentials are invalid
   */
  async authenticate(input: AuthenticateFarmerInput): Promise<AuthenticationResult> {
    try {
      // Find farmer by phone
      const farmer = await this.farmersRepository.findByPhone(input.phone);
      
      if (!farmer) {
        throw new AuthenticationError(
          'Invalid phone number or password',
          { field: 'credentials' }
        );
      }

      // Verify password
      const isPasswordValid = await verifyPassword(input.password, farmer.passwordHash);
      
      if (!isPasswordValid) {
        throw new AuthenticationError(
          'Invalid phone number or password',
          { field: 'credentials' }
        );
      }

      console.log(`✓ Farmer authenticated successfully: ${farmer.phone}`);
      return {
        farmer,
        authenticated: true
      };
    } catch (error) {
      logError(error as Error, 'FarmerService.authenticate');
      throw error;
    }
  }

  /**
   * Gets a farmer by ID
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to the farmer
   * @throws NotFoundError if farmer doesn't exist
   */
  async getFarmerById(farmerId: ObjectId): Promise<Farmer> {
    try {
      const farmer = await this.farmersRepository.findById(farmerId);
      
      if (!farmer) {
        throw new NotFoundError(
          'Farmer not found',
          { farmerId: farmerId.toString() }
        );
      }

      return farmer;
    } catch (error) {
      logError(error as Error, 'FarmerService.getFarmerById');
      throw error;
    }
  }

  /**
   * Gets a farmer by phone number
   * @param phone - The farmer's phone number
   * @returns Promise resolving to the farmer
   * @throws NotFoundError if farmer doesn't exist
   */
  async getFarmerByPhone(phone: string): Promise<Farmer> {
    try {
      const farmer = await this.farmersRepository.findByPhone(phone);
      
      if (!farmer) {
        throw new NotFoundError(
          'Farmer not found',
          { phone }
        );
      }

      return farmer;
    } catch (error) {
      logError(error as Error, 'FarmerService.getFarmerByPhone');
      throw error;
    }
  }

  /**
   * Updates a farmer's profile
   * @param farmerId - The farmer's ObjectId
   * @param input - Profile update data
   * @returns Promise resolving to the updated farmer
   * @throws NotFoundError if farmer doesn't exist
   * @throws ValidationError if input is invalid
   */
  async updateProfile(
    farmerId: ObjectId,
    input: UpdateFarmerProfileInput
  ): Promise<Farmer> {
    try {
      // Verify farmer exists
      const existingFarmer = await this.getFarmerById(farmerId);

      // Business validation for updated fields
      if (input.name !== undefined) {
        if (input.name.trim().length === 0) {
          throw new ValidationError('Name cannot be empty', { field: 'name' });
        }
      }

      if (input.division || input.district || input.upazila) {
        // If updating location, validate all three fields
        const division = input.division || existingFarmer.division;
        const district = input.district || existingFarmer.district;
        const upazila = input.upazila || existingFarmer.upazila;
        this.validateLocationFields(division, district, upazila);
      }

      // Prepare update data
      const updateData: Partial<Farmer> = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      if (input.division !== undefined) {
        updateData.division = input.division.trim();
      }
      if (input.district !== undefined) {
        updateData.district = input.district.trim();
      }
      if (input.upazila !== undefined) {
        updateData.upazila = input.upazila.trim();
      }
      if (input.language !== undefined) {
        updateData.language = input.language;
      }

      const updatedFarmer = await this.farmersRepository.updateById(farmerId, updateData);
      
      if (!updatedFarmer) {
        throw new NotFoundError(
          'Farmer not found after update',
          { farmerId: farmerId.toString() }
        );
      }

      console.log(`✓ Farmer profile updated successfully: ${updatedFarmer.phone}`);
      return updatedFarmer;
    } catch (error) {
      logError(error as Error, 'FarmerService.updateProfile');
      throw error;
    }
  }

  /**
   * Changes a farmer's password
   * @param farmerId - The farmer's ObjectId
   * @param currentPassword - The current password for verification
   * @param newPassword - The new password
   * @returns Promise resolving to the updated farmer
   * @throws AuthenticationError if current password is incorrect
   * @throws ValidationError if new password is invalid
   */
  async changePassword(
    farmerId: ObjectId,
    currentPassword: string,
    newPassword: string
  ): Promise<Farmer> {
    try {
      // Get farmer
      const farmer = await this.getFarmerById(farmerId);

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        currentPassword,
        farmer.passwordHash
      );
      
      if (!isCurrentPasswordValid) {
        throw new AuthenticationError(
          'Current password is incorrect',
          { field: 'currentPassword' }
        );
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Ensure new password is different from current
      const isSamePassword = await verifyPassword(newPassword, farmer.passwordHash);
      if (isSamePassword) {
        throw new ValidationError(
          'New password must be different from current password',
          { field: 'newPassword' }
        );
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      const updatedFarmer = await this.farmersRepository.updateById(farmerId, {
        passwordHash: newPasswordHash
      });

      if (!updatedFarmer) {
        throw new NotFoundError(
          'Farmer not found after password update',
          { farmerId: farmerId.toString() }
        );
      }

      console.log(`✓ Farmer password changed successfully: ${updatedFarmer.phone}`);
      return updatedFarmer;
    } catch (error) {
      logError(error as Error, 'FarmerService.changePassword');
      throw error;
    }
  }

  /**
   * Validates phone number format
   * @param phone - Phone number to validate
   * @throws ValidationError if format is invalid
   */
  private validatePhoneFormat(phone: string): void {
    const phoneRegex = /^\+880\d{10}$/;
    if (!phoneRegex.test(phone)) {
      throw new ValidationError(
        'Phone number must be in format +880XXXXXXXXXX (Bangladesh format)',
        { field: 'phone', value: phone }
      );
    }
  }

  /**
   * Validates password strength
   * @param password - Password to validate
   * @throws ValidationError if password is too weak
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 6) {
      throw new ValidationError(
        'Password must be at least 6 characters long',
        { field: 'password' }
      );
    }

    // Additional password strength rules can be added here
    // For example: require uppercase, lowercase, numbers, special characters
  }

  /**
   * Validates location fields are not empty
   * @param division - Division name
   * @param district - District name
   * @param upazila - Upazila name
   * @throws ValidationError if any field is empty
   */
  private validateLocationFields(
    division: string,
    district: string,
    upazila: string
  ): void {
    if (division.trim().length === 0) {
      throw new ValidationError('Division cannot be empty', { field: 'division' });
    }
    if (district.trim().length === 0) {
      throw new ValidationError('District cannot be empty', { field: 'district' });
    }
    if (upazila.trim().length === 0) {
      throw new ValidationError('Upazila cannot be empty', { field: 'upazila' });
    }
  }
}
