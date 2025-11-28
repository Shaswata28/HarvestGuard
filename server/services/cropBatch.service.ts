import { ObjectId } from 'mongodb';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { LossEventsRepository } from '../db/repositories/lossEvents.repository';
import { CropBatch } from '../db/schemas';
import {
  ValidationError,
  NotFoundError,
  logError
} from '../utils/errors';

/**
 * Input data for creating a crop batch in growing stage
 */
export interface CreateGrowingBatchInput {
  farmerId: ObjectId;
  cropType: string;
  estimatedWeightKg: number;
  expectedHarvestDate: Date;
  notes?: string;
  batchNumber?: string;
}

/**
 * Input data for creating a crop batch in harvested stage
 */
export interface CreateHarvestedBatchInput {
  farmerId: ObjectId;
  cropType: string;
  finalWeightKg: number;
  actualHarvestDate: Date;
  storageLocation: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
  storageDivision: string;
  storageDistrict: string;
  notes?: string;
  batchNumber?: string;
}

/**
 * Input data for transitioning a batch from growing to harvested
 */
export interface TransitionToHarvestedInput {
  finalWeightKg: number;
  actualHarvestDate: Date;
  storageLocation: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
  storageDivision: string;
  storageDistrict: string;
}

/**
 * Loss tracking statistics for a crop batch
 */
export interface BatchLossStatistics {
  batchId: ObjectId;
  totalLossEvents: number;
  totalLossWeightKg: number;
  totalLossPercentage: number;
  currentBatchLossPercentage: number;
}

/**
 * Service layer for crop batch-related business logic
 */
export class CropBatchService {
  constructor(
    private cropBatchesRepository: CropBatchesRepository,
    private lossEventsRepository: LossEventsRepository
  ) {}

  /**
   * Creates a new crop batch in growing stage
   * @param input - Growing batch creation data
   * @returns Promise resolving to the created crop batch
   * @throws ValidationError if input is invalid
   */
  async createGrowingBatch(input: CreateGrowingBatchInput): Promise<CropBatch> {
    try {
      // Business validation
      this.validateCropType(input.cropType);
      this.validatePositiveWeight(input.estimatedWeightKg, 'estimatedWeightKg');
      this.validateFutureDate(input.expectedHarvestDate, 'expectedHarvestDate');

      // Create crop batch document
      const batchData: Omit<CropBatch, '_id'> = {
        farmerId: input.farmerId,
        cropType: input.cropType.trim(),
        stage: 'growing',
        estimatedWeightKg: input.estimatedWeightKg,
        expectedHarvestDate: input.expectedHarvestDate,
        enteredDate: new Date(),
        notes: input.notes?.trim(),
        batchNumber: input.batchNumber?.trim()
      };

      const batch = await this.cropBatchesRepository.create(batchData);
      
      console.log(`✓ Growing crop batch created successfully: ${batch._id}`);
      return batch;
    } catch (error) {
      logError(error as Error, 'CropBatchService.createGrowingBatch');
      throw error;
    }
  }

  /**
   * Creates a new crop batch in harvested stage
   * @param input - Harvested batch creation data
   * @returns Promise resolving to the created crop batch
   * @throws ValidationError if input is invalid
   */
  async createHarvestedBatch(input: CreateHarvestedBatchInput): Promise<CropBatch> {
    try {
      // Business validation
      this.validateCropType(input.cropType);
      this.validatePositiveWeight(input.finalWeightKg, 'finalWeightKg');
      this.validatePastOrPresentDate(input.actualHarvestDate, 'actualHarvestDate');
      this.validateStorageLocation(input.storageLocation);
      this.validateLocationFields(input.storageDivision, input.storageDistrict);

      // Create crop batch document
      const batchData: Omit<CropBatch, '_id'> = {
        farmerId: input.farmerId,
        cropType: input.cropType.trim(),
        stage: 'harvested',
        finalWeightKg: input.finalWeightKg,
        actualHarvestDate: input.actualHarvestDate,
        storageLocation: input.storageLocation,
        storageDivision: input.storageDivision.trim(),
        storageDistrict: input.storageDistrict.trim(),
        enteredDate: new Date(),
        notes: input.notes?.trim(),
        batchNumber: input.batchNumber?.trim()
      };

      const batch = await this.cropBatchesRepository.create(batchData);
      
      console.log(`✓ Harvested crop batch created successfully: ${batch._id}`);
      return batch;
    } catch (error) {
      logError(error as Error, 'CropBatchService.createHarvestedBatch');
      throw error;
    }
  }

  /**
   * Transitions a crop batch from growing to harvested stage
   * @param batchId - The crop batch ObjectId
   * @param input - Transition data
   * @returns Promise resolving to the updated crop batch
   * @throws NotFoundError if batch doesn't exist
   * @throws ValidationError if batch is not in growing stage or input is invalid
   */
  async transitionToHarvested(
    batchId: ObjectId,
    input: TransitionToHarvestedInput
  ): Promise<CropBatch> {
    try {
      // Get existing batch
      const existingBatch = await this.cropBatchesRepository.findById(batchId);
      
      if (!existingBatch) {
        throw new NotFoundError(
          'Crop batch not found',
          { batchId: batchId.toString() }
        );
      }

      // Business validation: can only transition from growing to harvested
      if (existingBatch.stage !== 'growing') {
        throw new ValidationError(
          'Can only transition crop batches from growing to harvested stage',
          { 
            currentStage: existingBatch.stage,
            batchId: batchId.toString()
          }
        );
      }

      // Validate transition data
      this.validatePositiveWeight(input.finalWeightKg, 'finalWeightKg');
      this.validatePastOrPresentDate(input.actualHarvestDate, 'actualHarvestDate');
      this.validateStorageLocation(input.storageLocation);
      this.validateLocationFields(input.storageDivision, input.storageDistrict);

      // Business validation: actual harvest date should not be before expected harvest date
      if (existingBatch.expectedHarvestDate && 
          input.actualHarvestDate < existingBatch.expectedHarvestDate) {
        const daysDifference = Math.floor(
          (existingBatch.expectedHarvestDate.getTime() - input.actualHarvestDate.getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        console.warn(
          `⚠ Crop batch ${batchId} harvested ${daysDifference} days earlier than expected`
        );
      }

      // Prepare stage transition data
      const stageData: Partial<CropBatch> = {
        finalWeightKg: input.finalWeightKg,
        actualHarvestDate: input.actualHarvestDate,
        storageLocation: input.storageLocation,
        storageDivision: input.storageDivision.trim(),
        storageDistrict: input.storageDistrict.trim()
      };

      // Update the batch
      const updatedBatch = await this.cropBatchesRepository.updateStage(
        batchId,
        'harvested',
        stageData
      );

      if (!updatedBatch) {
        throw new NotFoundError(
          'Crop batch not found after transition',
          { batchId: batchId.toString() }
        );
      }

      console.log(`✓ Crop batch transitioned to harvested: ${batchId}`);
      return updatedBatch;
    } catch (error) {
      logError(error as Error, 'CropBatchService.transitionToHarvested');
      throw error;
    }
  }

  /**
   * Gets a crop batch by ID
   * @param batchId - The crop batch ObjectId
   * @returns Promise resolving to the crop batch
   * @throws NotFoundError if batch doesn't exist
   */
  async getBatchById(batchId: ObjectId): Promise<CropBatch> {
    try {
      const batch = await this.cropBatchesRepository.findById(batchId);
      
      if (!batch) {
        throw new NotFoundError(
          'Crop batch not found',
          { batchId: batchId.toString() }
        );
      }

      return batch;
    } catch (error) {
      logError(error as Error, 'CropBatchService.getBatchById');
      throw error;
    }
  }

  /**
   * Gets all crop batches for a farmer
   * @param farmerId - The farmer's ObjectId
   * @param stage - Optional stage filter
   * @returns Promise resolving to array of crop batches
   */
  async getBatchesByFarmerId(
    farmerId: ObjectId,
    stage?: 'growing' | 'harvested'
  ): Promise<CropBatch[]> {
    try {
      return await this.cropBatchesRepository.findByFarmerId(farmerId, stage);
    } catch (error) {
      logError(error as Error, 'CropBatchService.getBatchesByFarmerId');
      throw error;
    }
  }

  /**
   * Gets crop batches by storage location
   * @param division - Storage division
   * @param district - Optional storage district
   * @returns Promise resolving to array of crop batches
   */
  async getBatchesByLocation(
    division: string,
    district?: string
  ): Promise<CropBatch[]> {
    try {
      return await this.cropBatchesRepository.findByLocation(division, district);
    } catch (error) {
      logError(error as Error, 'CropBatchService.getBatchesByLocation');
      throw error;
    }
  }

  /**
   * Calculates loss statistics for a crop batch
   * @param batchId - The crop batch ObjectId
   * @returns Promise resolving to loss statistics
   * @throws NotFoundError if batch doesn't exist
   */
  async calculateBatchLoss(batchId: ObjectId): Promise<BatchLossStatistics> {
    try {
      // Verify batch exists
      const batch = await this.getBatchById(batchId);

      // Get all loss events for this batch
      const lossEvents = await this.lossEventsRepository.findByBatchId(batchId);

      // Calculate totals
      const totalLossEvents = lossEvents.length;
      const totalLossWeightKg = lossEvents.reduce(
        (sum, event) => sum + event.lossWeightKg,
        0
      );
      const totalLossPercentage = lossEvents.reduce(
        (sum, event) => sum + event.lossPercentage,
        0
      );

      // Calculate current batch loss percentage based on weight
      let currentBatchLossPercentage = 0;
      
      if (batch.stage === 'growing' && batch.estimatedWeightKg) {
        // For growing batches, calculate loss as percentage of estimated weight
        currentBatchLossPercentage = (totalLossWeightKg / batch.estimatedWeightKg) * 100;
      } else if (batch.stage === 'harvested' && batch.finalWeightKg) {
        // For harvested batches, use stored loss percentage or calculate from weight
        if (batch.lossPercentage !== undefined) {
          currentBatchLossPercentage = batch.lossPercentage;
        } else {
          // If we have estimated weight, calculate loss from that
          if (batch.estimatedWeightKg) {
            const expectedWeight = batch.estimatedWeightKg;
            const actualWeight = batch.finalWeightKg;
            currentBatchLossPercentage = 
              ((expectedWeight - actualWeight) / expectedWeight) * 100;
          }
        }
      }

      // Ensure percentage is within valid range
      currentBatchLossPercentage = Math.max(0, Math.min(100, currentBatchLossPercentage));

      return {
        batchId,
        totalLossEvents,
        totalLossWeightKg,
        totalLossPercentage,
        currentBatchLossPercentage
      };
    } catch (error) {
      logError(error as Error, 'CropBatchService.calculateBatchLoss');
      throw error;
    }
  }

  /**
   * Updates the loss percentage on a crop batch
   * @param batchId - The crop batch ObjectId
   * @param lossPercentage - The loss percentage (0-100)
   * @returns Promise resolving to the updated crop batch
   * @throws NotFoundError if batch doesn't exist
   * @throws ValidationError if loss percentage is invalid
   */
  async updateBatchLossPercentage(
    batchId: ObjectId,
    lossPercentage: number
  ): Promise<CropBatch> {
    try {
      // Validate loss percentage
      if (lossPercentage < 0 || lossPercentage > 100) {
        throw new ValidationError(
          'Loss percentage must be between 0 and 100',
          { lossPercentage }
        );
      }

      // Update the batch
      const updatedBatch = await this.cropBatchesRepository.updateById(batchId, {
        lossPercentage
      });

      if (!updatedBatch) {
        throw new NotFoundError(
          'Crop batch not found',
          { batchId: batchId.toString() }
        );
      }

      console.log(`✓ Crop batch loss percentage updated: ${batchId}`);
      return updatedBatch;
    } catch (error) {
      logError(error as Error, 'CropBatchService.updateBatchLossPercentage');
      throw error;
    }
  }

  /**
   * Validates crop type is not empty
   * @param cropType - Crop type to validate
   * @throws ValidationError if crop type is invalid
   */
  private validateCropType(cropType: string): void {
    if (cropType.trim().length === 0) {
      throw new ValidationError(
        'Crop type cannot be empty',
        { field: 'cropType' }
      );
    }
  }

  /**
   * Validates weight is positive
   * @param weight - Weight to validate
   * @param fieldName - Name of the field for error messages
   * @throws ValidationError if weight is not positive
   */
  private validatePositiveWeight(weight: number, fieldName: string): void {
    if (weight <= 0) {
      throw new ValidationError(
        `${fieldName} must be a positive number`,
        { field: fieldName, value: weight }
      );
    }
  }

  /**
   * Validates date is in the future
   * @param date - Date to validate
   * @param fieldName - Name of the field for error messages
   * @throws ValidationError if date is not in the future
   */
  private validateFutureDate(date: Date, fieldName: string): void {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    
    if (inputDate < now) {
      throw new ValidationError(
        `${fieldName} must be in the future`,
        { field: fieldName, value: date.toISOString() }
      );
    }
  }

  /**
   * Validates date is in the past or present
   * @param date - Date to validate
   * @param fieldName - Name of the field for error messages
   * @throws ValidationError if date is in the future
   */
  private validatePastOrPresentDate(date: Date, fieldName: string): void {
    const now = new Date();
    
    if (date > now) {
      throw new ValidationError(
        `${fieldName} cannot be in the future`,
        { field: fieldName, value: date.toISOString() }
      );
    }
  }

  /**
   * Validates storage location is valid
   * @param location - Storage location to validate
   * @throws ValidationError if location is invalid
   */
  private validateStorageLocation(
    location: 'silo' | 'jute_bag' | 'open_space' | 'tin_shed'
  ): void {
    const validLocations = ['silo', 'jute_bag', 'open_space', 'tin_shed'];
    if (!validLocations.includes(location)) {
      throw new ValidationError(
        'Invalid storage location',
        { field: 'storageLocation', value: location }
      );
    }
  }

  /**
   * Validates location fields are not empty
   * @param division - Division name
   * @param district - District name
   * @throws ValidationError if any field is empty
   */
  private validateLocationFields(division: string, district: string): void {
    if (division.trim().length === 0) {
      throw new ValidationError(
        'Storage division cannot be empty',
        { field: 'storageDivision' }
      );
    }
    if (district.trim().length === 0) {
      throw new ValidationError(
        'Storage district cannot be empty',
        { field: 'storageDistrict' }
      );
    }
  }
}
