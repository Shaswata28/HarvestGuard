import { ObjectId } from 'mongodb';
import { HealthScansRepository } from '../db/repositories/healthScans.repository';
import { HealthScan } from '../db/schemas';
import {
  ValidationError,
  NotFoundError,
  logError
} from '../utils/errors';

/**
 * Input data for recording a health scan
 */
export interface RecordHealthScanInput {
  farmerId: ObjectId;
  batchId?: ObjectId;
  diseaseLabel: string;
  confidence: number;
  remedyText?: string;
  imageUrl?: string;
  immediateFeedback?: 'correct' | 'incorrect' | 'unsure';
}

/**
 * Input data for updating scan outcome
 */
export interface UpdateScanOutcomeInput {
  outcome: 'recovered' | 'same' | 'worse';
  immediateFeedback?: 'correct' | 'incorrect' | 'unsure';
}

/**
 * Service layer for health scan-related business logic
 */
export class HealthScanService {
  constructor(private healthScansRepository: HealthScansRepository) {}

  /**
   * Records a new health scan
   * @param input - Health scan recording data
   * @returns Promise resolving to the created health scan
   * @throws ValidationError if input is invalid
   */
  async recordScan(input: RecordHealthScanInput): Promise<HealthScan> {
    try {
      // Business validation
      this.validateDiseaseLabel(input.diseaseLabel);
      this.validateConfidence(input.confidence);
      
      if (input.imageUrl) {
        this.validateImageUrl(input.imageUrl);
      }

      // Create health scan document
      const scanData: Omit<HealthScan, '_id'> = {
        farmerId: input.farmerId,
        batchId: input.batchId,
        capturedAt: new Date(),
        diseaseLabel: input.diseaseLabel.trim(),
        confidence: input.confidence,
        remedyText: input.remedyText?.trim(),
        imageUrl: input.imageUrl,
        immediateFeedback: input.immediateFeedback,
        status: 'pending'
      };

      const scan = await this.healthScansRepository.create(scanData);
      
      console.log(`✓ Health scan recorded successfully: ${scan._id}`);
      return scan;
    } catch (error) {
      logError(error as Error, 'HealthScanService.recordScan');
      throw error;
    }
  }

  /**
   * Gets a health scan by ID
   * @param scanId - The health scan ObjectId
   * @returns Promise resolving to the health scan
   * @throws NotFoundError if scan doesn't exist
   */
  async getScanById(scanId: ObjectId): Promise<HealthScan> {
    try {
      const scan = await this.healthScansRepository.findById(scanId);
      
      if (!scan) {
        throw new NotFoundError(
          'Health scan not found',
          { scanId: scanId.toString() }
        );
      }

      return scan;
    } catch (error) {
      logError(error as Error, 'HealthScanService.getScanById');
      throw error;
    }
  }

  /**
   * Gets all health scans for a farmer
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to array of health scans
   */
  async getScansByFarmerId(farmerId: ObjectId): Promise<HealthScan[]> {
    try {
      return await this.healthScansRepository.findByFarmerId(farmerId);
    } catch (error) {
      logError(error as Error, 'HealthScanService.getScansByFarmerId');
      throw error;
    }
  }

  /**
   * Gets all health scans for a crop batch
   * @param batchId - The crop batch ObjectId
   * @returns Promise resolving to array of health scans
   */
  async getScansByBatchId(batchId: ObjectId): Promise<HealthScan[]> {
    try {
      return await this.healthScansRepository.findByBatchId(batchId);
    } catch (error) {
      logError(error as Error, 'HealthScanService.getScansByBatchId');
      throw error;
    }
  }

  /**
   * Updates the status of a health scan
   * @param scanId - The health scan ObjectId
   * @param status - The new status
   * @returns Promise resolving to the updated health scan
   * @throws NotFoundError if scan doesn't exist
   * @throws ValidationError if status transition is invalid
   */
  async updateStatus(
    scanId: ObjectId,
    status: 'pending' | 'resolved' | 'healthy'
  ): Promise<HealthScan> {
    try {
      // Get existing scan to validate transition
      const existingScan = await this.getScanById(scanId);

      // Business validation: status transition rules
      this.validateStatusTransition(existingScan.status, status);

      // Update the status
      const updatedScan = await this.healthScansRepository.updateStatus(scanId, status);

      if (!updatedScan) {
        throw new NotFoundError(
          'Health scan not found after status update',
          { scanId: scanId.toString() }
        );
      }

      console.log(`✓ Health scan status updated to ${status}: ${scanId}`);
      return updatedScan;
    } catch (error) {
      logError(error as Error, 'HealthScanService.updateStatus');
      throw error;
    }
  }

  /**
   * Updates the outcome of a health scan
   * @param scanId - The health scan ObjectId
   * @param input - Outcome update data
   * @returns Promise resolving to the updated health scan
   * @throws NotFoundError if scan doesn't exist
   * @throws ValidationError if outcome update is invalid
   */
  async updateOutcome(
    scanId: ObjectId,
    input: UpdateScanOutcomeInput
  ): Promise<HealthScan> {
    try {
      // Verify scan exists
      const existingScan = await this.getScanById(scanId);

      // Business validation: can only update outcome for scans that have been acted upon
      if (existingScan.status === 'pending') {
        console.warn(
          `⚠ Updating outcome for pending scan ${scanId}. Consider updating status first.`
        );
      }

      // Prepare update data
      const updateData: Partial<HealthScan> = {
        outcome: input.outcome
      };

      if (input.immediateFeedback !== undefined) {
        updateData.immediateFeedback = input.immediateFeedback;
      }

      // Automatically update status based on outcome
      if (input.outcome === 'recovered') {
        updateData.status = 'resolved';
      } else if (input.outcome === 'worse' && existingScan.status === 'pending') {
        // Keep as pending if getting worse and not yet resolved
        updateData.status = 'pending';
      }

      const updatedScan = await this.healthScansRepository.updateById(scanId, updateData);

      if (!updatedScan) {
        throw new NotFoundError(
          'Health scan not found after outcome update',
          { scanId: scanId.toString() }
        );
      }

      console.log(`✓ Health scan outcome updated to ${input.outcome}: ${scanId}`);
      return updatedScan;
    } catch (error) {
      logError(error as Error, 'HealthScanService.updateOutcome');
      throw error;
    }
  }

  /**
   * Updates immediate feedback for a health scan
   * @param scanId - The health scan ObjectId
   * @param feedback - The immediate feedback
   * @returns Promise resolving to the updated health scan
   * @throws NotFoundError if scan doesn't exist
   */
  async updateImmediateFeedback(
    scanId: ObjectId,
    feedback: 'correct' | 'incorrect' | 'unsure'
  ): Promise<HealthScan> {
    try {
      // Verify scan exists
      await this.getScanById(scanId);

      const updatedScan = await this.healthScansRepository.updateById(scanId, {
        immediateFeedback: feedback
      });

      if (!updatedScan) {
        throw new NotFoundError(
          'Health scan not found after feedback update',
          { scanId: scanId.toString() }
        );
      }

      console.log(`✓ Health scan feedback updated to ${feedback}: ${scanId}`);
      return updatedScan;
    } catch (error) {
      logError(error as Error, 'HealthScanService.updateImmediateFeedback');
      throw error;
    }
  }

  /**
   * Validates disease label is not empty
   * @param diseaseLabel - Disease label to validate
   * @throws ValidationError if disease label is invalid
   */
  private validateDiseaseLabel(diseaseLabel: string): void {
    if (diseaseLabel.trim().length === 0) {
      throw new ValidationError(
        'Disease label cannot be empty',
        { field: 'diseaseLabel' }
      );
    }
  }

  /**
   * Validates confidence is within valid range (0-100)
   * @param confidence - Confidence value to validate
   * @throws ValidationError if confidence is invalid
   */
  private validateConfidence(confidence: number): void {
    if (confidence < 0 || confidence > 100) {
      throw new ValidationError(
        'Confidence must be between 0 and 100',
        { field: 'confidence', value: confidence }
      );
    }
  }

  /**
   * Validates image URL format
   * @param imageUrl - Image URL to validate
   * @throws ValidationError if URL is invalid
   */
  private validateImageUrl(imageUrl: string): void {
    try {
      new URL(imageUrl);
    } catch {
      throw new ValidationError(
        'Invalid image URL format',
        { field: 'imageUrl', value: imageUrl }
      );
    }
  }

  /**
   * Validates status transition is allowed
   * @param currentStatus - Current status
   * @param newStatus - New status
   * @throws ValidationError if transition is not allowed
   */
  private validateStatusTransition(
    currentStatus: 'pending' | 'resolved' | 'healthy',
    newStatus: 'pending' | 'resolved' | 'healthy'
  ): void {
    // Business rule: once resolved or healthy, cannot go back to pending
    if ((currentStatus === 'resolved' || currentStatus === 'healthy') && 
        newStatus === 'pending') {
      throw new ValidationError(
        'Cannot change status from resolved/healthy back to pending',
        { 
          currentStatus,
          newStatus,
          field: 'status'
        }
      );
    }

    // Business rule: healthy scans should not transition to resolved
    if (currentStatus === 'healthy' && newStatus === 'resolved') {
      throw new ValidationError(
        'Cannot change status from healthy to resolved',
        { 
          currentStatus,
          newStatus,
          field: 'status'
        }
      );
    }
  }
}
