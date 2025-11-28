import { Db, ObjectId, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { LossEvent, LossEventSchema } from '../schemas';
import { handleDatabaseError, logError } from '../../utils/errors';

/**
 * Repository for managing loss event documents
 */
export class LossEventsRepository extends BaseRepository<LossEvent> {
  constructor(db: Db) {
    super(db, 'loss_events', LossEventSchema);
  }

  /**
   * Finds all loss events for a specific farmer
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to array of loss events sorted by report date (newest first)
   */
  async findByFarmerId(farmerId: ObjectId): Promise<LossEvent[]> {
    try {
      const filter: Filter<LossEvent> = { farmerId } as Filter<LossEvent>;
      return await this.findMany(filter, { sort: { reportedAt: -1 } });
    } catch (error) {
      logError(error as Error, 'LossEventsRepository.findByFarmerId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds all loss events for a specific crop batch
   * @param batchId - The crop batch's ObjectId
   * @returns Promise resolving to array of loss events sorted by report date (newest first)
   */
  async findByBatchId(batchId: ObjectId): Promise<LossEvent[]> {
    try {
      const filter: Filter<LossEvent> = { batchId } as Filter<LossEvent>;
      return await this.findMany(filter, { sort: { reportedAt: -1 } });
    } catch (error) {
      logError(error as Error, 'LossEventsRepository.findByBatchId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Aggregates loss data by location
   * @param division - Optional division filter
   * @param district - Optional district filter
   * @returns Promise resolving to aggregated loss statistics by location
   */
  async aggregateLossByLocation(
    division?: string,
    district?: string
  ): Promise<Array<{
    location: string;
    totalEvents: number;
    totalLossWeightKg: number;
    averageLossPercentage: number;
  }>> {
    try {
      // Build match stage based on provided filters
      const matchStage: any = {};
      if (division) {
        matchStage.location = new RegExp(division, 'i');
      }
      if (district) {
        matchStage.location = new RegExp(district, 'i');
      }

      const pipeline = [
        // Filter by location if provided
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        
        // Group by location
        {
          $group: {
            _id: '$location',
            totalEvents: { $sum: 1 },
            totalLossWeightKg: { $sum: '$lossWeightKg' },
            averageLossPercentage: { $avg: '$lossPercentage' }
          }
        },
        
        // Project to desired format
        {
          $project: {
            _id: 0,
            location: '$_id',
            totalEvents: 1,
            totalLossWeightKg: 1,
            averageLossPercentage: 1
          }
        },
        
        // Sort by total loss weight descending
        {
          $sort: { totalLossWeightKg: -1 }
        }
      ];

      const results = await this.collection.aggregate(pipeline).toArray();
      return results as Array<{
        location: string;
        totalEvents: number;
        totalLossWeightKg: number;
        averageLossPercentage: number;
      }>;
    } catch (error) {
      logError(error as Error, 'LossEventsRepository.aggregateLossByLocation');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the loss_events collection
   * - Compound index on (farmerId, reportedAt) for farmer's loss history
   * - Index on batchId for batch-specific losses
   */
  async createIndexes(): Promise<void> {
    try {
      // Compound index on farmerId and reportedAt for farmer's loss history
      await this.collection.createIndex(
        { farmerId: 1, reportedAt: -1 },
        { name: 'farmerId_reportedAt_index' }
      );

      // Index on batchId for batch-specific losses
      await this.collection.createIndex(
        { batchId: 1 },
        { name: 'batchId_index' }
      );

      console.log('✓ Loss events collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'LossEventsRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }
}
