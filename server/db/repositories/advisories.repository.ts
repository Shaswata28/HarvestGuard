import { Db, ObjectId, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { Advisory, AdvisorySchema } from '../schemas';
import { handleDatabaseError, logError } from '../../utils/errors';

/**
 * Repository for managing advisory documents
 */
export class AdvisoriesRepository extends BaseRepository<Advisory> {
  constructor(db: Db) {
    super(db, 'advisories', AdvisorySchema);
  }

  /**
   * Finds all advisories for a specific farmer (including broadcast advisories)
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to array of advisories sorted by creation date (newest first)
   */
  async findByFarmerId(farmerId: ObjectId): Promise<Advisory[]> {
    try {
      // Find advisories that are either:
      // 1. Specifically for this farmer (farmerId matches)
      // 2. Broadcast advisories (farmerId is null/undefined)
      const filter: Filter<Advisory> = {
        $or: [
          { farmerId: farmerId },
          { farmerId: null },
          { farmerId: { $exists: false } }
        ]
      } as Filter<Advisory>;
      
      return await this.findMany(filter, { sort: { createdAt: -1 } });
    } catch (error) {
      logError(error as Error, 'AdvisoriesRepository.findByFarmerId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds recent advisories for a farmer by source type within a time window
   * Used for duplicate prevention
   * @param farmerId - The farmer's ObjectId
   * @param source - The advisory source type
   * @param hours - Number of hours to look back (default 24)
   * @returns Promise resolving to array of recent advisories
   */
  async findRecentByFarmerAndType(
    farmerId: ObjectId,
    source: 'weather' | 'scanner' | 'manual',
    hours: number = 24
  ): Promise<Advisory[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const filter: Filter<Advisory> = {
        farmerId: farmerId,
        source: source,
        createdAt: { $gte: cutoffTime }
      } as Filter<Advisory>;
      
      return await this.findMany(filter, { sort: { createdAt: -1 } });
    } catch (error) {
      logError(error as Error, 'AdvisoriesRepository.findRecentByFarmerAndType');
      throw handleDatabaseError(error);
    }
  }



  /**
   * Creates indexes for the advisories collection
   * - Compound index on (farmerId, source, createdAt) for duplicate checking
   * - Compound index on (source, createdAt) for source-based filtering
   */
  async createIndexes(): Promise<void> {
    try {
      // Compound index on farmerId, source, and createdAt for duplicate prevention
      await this.collection.createIndex(
        { farmerId: 1, source: 1, createdAt: -1 },
        { name: 'farmerId_source_createdAt_index' }
      );

      // Compound index on source and createdAt for source-based filtering
      await this.collection.createIndex(
        { source: 1, createdAt: -1 },
        { name: 'source_createdAt_index' }
      );

      console.log('✓ Advisories collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'AdvisoriesRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }
}
