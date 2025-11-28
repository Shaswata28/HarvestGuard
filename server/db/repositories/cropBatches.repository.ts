import { Db, ObjectId, Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { CropBatch, CropBatchSchema } from '../schemas';
import { handleDatabaseError, logError, NotFoundError } from '../../utils/errors';

/**
 * Repository for managing crop batch documents
 */
export class CropBatchesRepository extends BaseRepository<CropBatch> {
  constructor(db: Db) {
    super(db, 'crop_batches', CropBatchSchema);
  }

  /**
   * Finds all crop batches for a specific farmer
   * @param farmerId - The farmer's ObjectId
   * @param stage - Optional stage filter ('growing' or 'harvested')
   * @returns Promise resolving to array of crop batches
   */
  async findByFarmerId(farmerId: ObjectId, stage?: 'growing' | 'harvested'): Promise<CropBatch[]> {
    try {
      const filter: Filter<CropBatch> = { farmerId } as Filter<CropBatch>;
      
      if (stage) {
        (filter as any).stage = stage;
      }

      return await this.findMany(filter, { sort: { enteredDate: -1 } });
    } catch (error) {
      logError(error as Error, 'CropBatchesRepository.findByFarmerId');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Finds crop batches by storage location
   * @param division - Storage division
   * @param district - Optional storage district
   * @returns Promise resolving to array of crop batches
   */
  async findByLocation(division: string, district?: string): Promise<CropBatch[]> {
    try {
      const filter: Filter<CropBatch> = { storageDivision: division } as Filter<CropBatch>;
      
      if (district) {
        (filter as any).storageDistrict = district;
      }

      return await this.findMany(filter, { sort: { enteredDate: -1 } });
    } catch (error) {
      logError(error as Error, 'CropBatchesRepository.findByLocation');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Updates the stage of a crop batch and related fields
   * @param id - The crop batch ObjectId
   * @param stage - The new stage ('growing' or 'harvested')
   * @param stageData - Stage-specific data to update
   * @returns Promise resolving to the updated crop batch
   */
  async updateStage(
    id: ObjectId,
    stage: 'growing' | 'harvested',
    stageData: Partial<CropBatch>
  ): Promise<CropBatch | null> {
    try {
      // Verify the crop batch exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundError('Crop batch not found', { id: id.toString() });
      }

      // Build the update object with stage and stage-specific data
      const updateData: any = {
        stage,
        ...stageData
      };

      // Remove _id if present to prevent modification
      delete updateData._id;

      // Perform the update directly without full validation
      // since we're doing a partial update
      const result = await this.collection.findOneAndUpdate(
        { _id: id } as Filter<CropBatch>,
        { $set: updateData },
        { returnDocument: 'after' }
      );

      return result as CropBatch | null;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logError(error as Error, 'CropBatchesRepository.updateStage');
      throw handleDatabaseError(error);
    }
  }

  /**
   * Creates indexes for the crop_batches collection
   * - Compound index on (farmerId, stage) for farmer's active/harvested crops
   * - Compound index on (storageDivision, storageDistrict) for location-based analytics
   * - Index on (farmerId, enteredDate) for recent batches
   */
  async createIndexes(): Promise<void> {
    try {
      // Compound index on farmerId and stage
      await this.collection.createIndex(
        { farmerId: 1, stage: 1 },
        { name: 'farmerId_stage_index' }
      );

      // Compound index on storage location
      await this.collection.createIndex(
        { storageDivision: 1, storageDistrict: 1 },
        { name: 'storage_location_index' }
      );

      // Index on farmerId and enteredDate for recent batches
      await this.collection.createIndex(
        { farmerId: 1, enteredDate: -1 },
        { name: 'farmerId_enteredDate_index' }
      );

      console.log('✓ Crop batches collection indexes created successfully');
    } catch (error) {
      logError(error as Error, 'CropBatchesRepository.createIndexes');
      throw handleDatabaseError(error);
    }
  }
}
