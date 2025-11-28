import { Db, ObjectId, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { Farmer, FarmerSchema } from '../schemas';
import { ConflictError, handleDatabaseError, logError } from '../../utils/errors';

/**
 * Repository for managing farmer documents
 */
export class FarmersRepository extends BaseRepository<Farmer> {
  constructor(db: Db) {
    super(db, 'farmers', FarmerSchema);
  }

  /**
   * Finds a farmer by phone number
   * @param phone - The phone number to search for
   * @returns Promise resolving to the farmer or null if not found
   */
  async findByPhone(phone: string): Promise<Farmer | null> {
    try {
      return await this.findOne({ phone } as Filter<Farmer>);
    } catch (error) {
      logError(error as Error, 'FarmersRepository.findByPhone');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the farmers collection
   * - Unique index on phone for authentication
   * - Location indexes for queries by division, district, upazila
   */
  async createIndexes(): Promise<void> {
    try {
      // Unique index on phone field
      await this.collection.createIndex(
        { phone: 1 },
        { unique: true, name: 'phone_unique' }
      );

      // Location indexes for efficient location-based queries
      await this.collection.createIndex(
        { division: 1, district: 1, upazila: 1 },
        { name: 'location_index' }
      );

      console.log('✓ Farmers collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'FarmersRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Override create to handle unique constraint violations
   */
  async create(data: Omit<Farmer, '_id'> & { _id?: ObjectId }): Promise<Farmer> {
    try {
      return await super.create(data);
    } catch (error: any) {
      // Check for duplicate key error (MongoDB error code 11000)
      if (error.code === 11000 || error.message?.includes('duplicate key')) {
        throw new ConflictError(
          'A farmer with this phone number already exists',
          { field: 'phone', value: data.phone }
        );
      }
      throw error;
    }
  }
}
