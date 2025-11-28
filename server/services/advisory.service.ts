import { ObjectId } from 'mongodb';
import { AdvisoriesRepository } from '../db/repositories/advisories.repository';
import { Advisory } from '../db/schemas';
import {
  ValidationError,
  NotFoundError,
  logError
} from '../utils/errors';

/**
 * Input data for creating a farmer-specific advisory
 */
export interface CreateFarmerAdvisoryInput {
  farmerId: ObjectId;
  source: 'weather' | 'scanner' | 'manual';
  message: string;
  actions?: string[];
}

/**
 * Input data for creating a broadcast advisory
 */
export interface CreateBroadcastAdvisoryInput {
  source: 'weather' | 'scanner' | 'manual';
  message: string;
  actions?: string[];
}

/**
 * Advisory delivery result
 */
export interface AdvisoryDeliveryResult {
  advisory: Advisory;
  isBroadcast: boolean;
  targetFarmerId?: ObjectId;
}

/**
 * Service layer for advisory-related business logic
 */
export class AdvisoryService {
  constructor(private advisoriesRepository: AdvisoriesRepository) {}

  /**
   * Creates a farmer-specific advisory
   * @param input - Farmer-specific advisory creation data
   * @returns Promise resolving to the created advisory
   * @throws ValidationError if input is invalid
   */
  async createFarmerAdvisory(input: CreateFarmerAdvisoryInput): Promise<Advisory> {
    try {
      // Business validation
      this.validateMessage(input.message);
      this.validateSource(input.source);
      
      if (input.actions) {
        this.validateActions(input.actions);
      }

      // Create advisory document
      const advisoryData: Omit<Advisory, '_id'> = {
        farmerId: input.farmerId,
        source: input.source,
        payload: {
          message: input.message.trim(),
          actions: input.actions?.map(action => action.trim()).filter(a => a.length > 0)
        },
        status: 'delivered',
        createdAt: new Date()
      };

      const advisory = await this.advisoriesRepository.create(advisoryData);
      
      console.log(`✓ Farmer-specific advisory created successfully: ${advisory._id} for farmer ${input.farmerId}`);
      return advisory;
    } catch (error) {
      logError(error as Error, 'AdvisoryService.createFarmerAdvisory');
      throw error;
    }
  }

  /**
   * Creates a broadcast advisory (sent to all farmers)
   * @param input - Broadcast advisory creation data
   * @returns Promise resolving to the created advisory
   * @throws ValidationError if input is invalid
   */
  async createBroadcastAdvisory(input: CreateBroadcastAdvisoryInput): Promise<Advisory> {
    try {
      // Business validation
      this.validateMessage(input.message);
      this.validateSource(input.source);
      
      if (input.actions) {
        this.validateActions(input.actions);
      }

      // Create advisory document with no farmerId (broadcast)
      const advisoryData: Omit<Advisory, '_id'> = {
        farmerId: undefined, // Explicitly undefined for broadcast
        source: input.source,
        payload: {
          message: input.message.trim(),
          actions: input.actions?.map(action => action.trim()).filter(a => a.length > 0)
        },
        status: 'delivered',
        createdAt: new Date()
      };

      const advisory = await this.advisoriesRepository.create(advisoryData);
      
      console.log(`✓ Broadcast advisory created successfully: ${advisory._id}`);
      return advisory;
    } catch (error) {
      logError(error as Error, 'AdvisoryService.createBroadcastAdvisory');
      throw error;
    }
  }

  /**
   * Delivers an advisory (wrapper for creation with delivery result)
   * @param input - Advisory creation data (farmer-specific or broadcast)
   * @returns Promise resolving to delivery result
   */
  async deliverAdvisory(
    input: CreateFarmerAdvisoryInput | CreateBroadcastAdvisoryInput
  ): Promise<AdvisoryDeliveryResult> {
    try {
      let advisory: Advisory;
      let isBroadcast: boolean;
      let targetFarmerId: ObjectId | undefined;

      // Check if this is a farmer-specific advisory
      if ('farmerId' in input && input.farmerId) {
        advisory = await this.createFarmerAdvisory(input);
        isBroadcast = false;
        targetFarmerId = input.farmerId;
      } else {
        advisory = await this.createBroadcastAdvisory(input);
        isBroadcast = true;
      }

      return {
        advisory,
        isBroadcast,
        targetFarmerId
      };
    } catch (error) {
      logError(error as Error, 'AdvisoryService.deliverAdvisory');
      throw error;
    }
  }

  /**
   * Gets all advisories for a farmer (including broadcast advisories)
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to array of advisories
   */
  async getAdvisoriesForFarmer(farmerId: ObjectId): Promise<Advisory[]> {
    try {
      return await this.advisoriesRepository.findByFarmerId(farmerId);
    } catch (error) {
      logError(error as Error, 'AdvisoryService.getAdvisoriesForFarmer');
      throw error;
    }
  }



  /**
   * Gets an advisory by ID
   * @param advisoryId - The advisory's ObjectId
   * @returns Promise resolving to the advisory
   * @throws NotFoundError if advisory doesn't exist
   */
  async getAdvisoryById(advisoryId: ObjectId): Promise<Advisory> {
    try {
      const advisory = await this.advisoriesRepository.findById(advisoryId);
      
      if (!advisory) {
        throw new NotFoundError(
          'Advisory not found',
          { advisoryId: advisoryId.toString() }
        );
      }

      return advisory;
    } catch (error) {
      logError(error as Error, 'AdvisoryService.getAdvisoryById');
      throw error;
    }
  }



  /**
   * Validates message is not empty
   * @param message - Message to validate
   * @throws ValidationError if message is invalid
   */
  private validateMessage(message: string): void {
    if (message.trim().length === 0) {
      throw new ValidationError(
        'Advisory message cannot be empty',
        { field: 'message' }
      );
    }

    // Business rule: message should have reasonable length
    if (message.length > 5000) {
      throw new ValidationError(
        'Advisory message is too long (maximum 5000 characters)',
        { field: 'message', length: message.length }
      );
    }
  }

  /**
   * Validates source is valid
   * @param source - Source to validate
   * @throws ValidationError if source is invalid
   */
  private validateSource(source: string): void {
    const validSources = ['weather', 'scanner', 'manual'];
    if (!validSources.includes(source)) {
      throw new ValidationError(
        'Invalid advisory source',
        { field: 'source', value: source, validSources }
      );
    }
  }

  /**
   * Validates actions array
   * @param actions - Actions to validate
   * @throws ValidationError if actions are invalid
   */
  private validateActions(actions: string[]): void {
    if (actions.length === 0) {
      throw new ValidationError(
        'Actions array cannot be empty if provided',
        { field: 'actions' }
      );
    }

    // Business rule: each action should not be empty
    const emptyActions = actions.filter(action => action.trim().length === 0);
    if (emptyActions.length > 0) {
      throw new ValidationError(
        'Actions cannot contain empty strings',
        { field: 'actions', emptyCount: emptyActions.length }
      );
    }

    // Business rule: reasonable number of actions
    if (actions.length > 20) {
      throw new ValidationError(
        'Too many actions (maximum 20)',
        { field: 'actions', count: actions.length }
      );
    }
  }
}
