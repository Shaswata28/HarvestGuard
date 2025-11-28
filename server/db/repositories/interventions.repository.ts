import { Db, ObjectId, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { Intervention, InterventionSchema } from '../schemas';
import { handleDatabaseError, logError } from '../../utils/errors';

/**
 * Repository for managing intervention documents
 */
export class InterventionsRepository extends BaseRepository<Intervention> {
  constructor(db: Db) {
    super(db, 'interventions', InterventionSchema);
  }

  /**
   * Finds all interventions for a specific farmer
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to array of interventions sorted by performed date (newest first)
   */
  async findByFarmerId(farmerId: ObjectId): Promise<Intervention[]> {
    try {
      const filter: Filter<Intervention> = { farmerId } as Filter<Intervention>;
      return await this.findMany(filter, { sort: { performedAt: -1 } });
    } catch (error) {
      logError(error as Error, 'InterventionsRepository.findByFarmerId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds all interventions for a specific crop batch
   * @param batchId - The crop batch's ObjectId
   * @returns Promise resolving to array of interventions sorted by performed date (newest first)
   */
  async findByBatchId(batchId: ObjectId): Promise<Intervention[]> {
    try {
      const filter: Filter<Intervention> = { batchId } as Filter<Intervention>;
      return await this.findMany(filter, { sort: { performedAt: -1 } });
    } catch (error) {
      logError(error as Error, 'InterventionsRepository.findByBatchId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Calculates the success rate of interventions
   * @param farmerId - Optional farmer ID to calculate success rate for a specific farmer
   * @param batchId - Optional batch ID to calculate success rate for a specific batch
   * @returns Promise resolving to success rate object with total, successful, and percentage
   */
  async calculateSuccessRate(
    farmerId?: ObjectId,
    batchId?: ObjectId
  ): Promise<{
    total: number;
    successful: number;
    successRate: number;
  }> {
    try {
      // Build match stage based on provided filters
      const matchStage: any = {};
      if (farmerId) {
        matchStage.farmerId = farmerId;
      }
      if (batchId) {
        matchStage.batchId = batchId;
      }

      const pipeline = [
        // Filter by farmerId or batchId if provided
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        
        // Group and calculate success metrics
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            successful: {
              $sum: {
                $cond: ['$success', 1, 0]
              }
            }
          }
        },
        
        // Calculate success rate percentage
        {
          $project: {
            _id: 0,
            total: 1,
            successful: 1,
            successRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: ['$successful', '$total'] }, 100] }
              ]
            }
          }
        }
      ];

      const results = await this.collection.aggregate(pipeline).toArray();
      
      // Return default values if no interventions found
      if (results.length === 0) {
        return {
          total: 0,
          successful: 0,
          successRate: 0
        };
      }

      return results[0] as {
        total: number;
        successful: number;
        successRate: number;
      };
    } catch (error) {
      logError(error as Error, 'InterventionsRepository.calculateSuccessRate');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the interventions collection
   * - Compound index on (farmerId, performedAt) for farmer's intervention history
   * - Index on batchId for batch-specific interventions
   * - Index on success for success rate calculations
   */
  async createIndexes(): Promise<void> {
    try {
      // Compound index on farmerId and performedAt for farmer's intervention history
      await this.collection.createIndex(
        { farmerId: 1, performedAt: -1 },
        { name: 'farmerId_performedAt_index' }
      );

      // Index on batchId for batch-specific interventions
      await this.collection.createIndex(
        { batchId: 1 },
        { name: 'batchId_index' }
      );

      // Index on success for success rate calculations
      await this.collection.createIndex(
        { success: 1 },
        { name: 'success_index' }
      );

      console.log('✓ Interventions collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'InterventionsRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }
}
