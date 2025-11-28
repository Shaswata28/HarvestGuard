import { Db, ObjectId, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { HealthScan, HealthScanSchema } from '../schemas';
import { handleDatabaseError, logError, NotFoundError } from '../../utils/errors';

/**
 * Repository for managing health scan documents
 */
export class HealthScansRepository extends BaseRepository<HealthScan> {
  constructor(db: Db) {
    super(db, 'health_scans', HealthScanSchema);
  }

  /**
   * Finds all health scans for a specific farmer
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to array of health scans sorted by capture date (newest first)
   */
  async findByFarmerId(farmerId: ObjectId): Promise<HealthScan[]> {
    try {
      const filter: Filter<HealthScan> = { farmerId } as Filter<HealthScan>;
      return await this.findMany(filter, { sort: { capturedAt: -1 } });
    } catch (error) {
      logError(error as Error, 'HealthScansRepository.findByFarmerId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds all health scans for a specific crop batch
   * @param batchId - The crop batch's ObjectId
   * @returns Promise resolving to array of health scans sorted by capture date (newest first)
   */
  async findByBatchId(batchId: ObjectId): Promise<HealthScan[]> {
    try {
      const filter: Filter<HealthScan> = { batchId } as Filter<HealthScan>;
      return await this.findMany(filter, { sort: { capturedAt: -1 } });
    } catch (error) {
      logError(error as Error, 'HealthScansRepository.findByBatchId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Updates the status of a health scan
   * @param id - The health scan ObjectId
   * @param status - The new status ('pending', 'resolved', or 'healthy')
   * @returns Promise resolving to the updated health scan
   */
  async updateStatus(
    id: ObjectId,
    status: 'pending' | 'resolved' | 'healthy'
  ): Promise<HealthScan | null> {
    try {
      // Verify the health scan exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError('Health scan not found', { id: id.toString() });
      }

      // Perform the update directly without full validation
      // since we're doing a partial update
      const result = await this.collection.findOneAndUpdate(
        { _id: id } as Filter<HealthScan>,
        { $set: { status } },
        { returnDocument: 'after' }
      );

      return result as HealthScan | null;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logError(error as Error, 'HealthScansRepository.updateStatus');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the health_scans collection
   * - Compound index on (farmerId, capturedAt) for farmer's scan history
   * - Index on batchId for batch-specific scans
   * - Compound index on (status, capturedAt) for pending scans
   */
  async createIndexes(): Promise<void> {
    try {
      // Compound index on farmerId and capturedAt for farmer's scan history
      await this.collection.createIndex(
        { farmerId: 1, capturedAt: -1 },
        { name: 'farmerId_capturedAt_index' }
      );

      // Index on batchId for batch-specific scans
      await this.collection.createIndex(
        { batchId: 1 },
        { name: 'batchId_index' }
      );

      // Compound index on status and capturedAt for pending scans
      await this.collection.createIndex(
        { status: 1, capturedAt: -1 },
        { name: 'status_capturedAt_index' }
      );

      console.log('✓ Health scans collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'HealthScansRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }
}
