/**
 * Smart Alert Service
 * 
 * This service implements the decision engine that generates contextual,
 * actionable farming advisories by combining weather data, crop information,
 * and risk assessment logic.
 */

import { ObjectId } from 'mongodb';
import type { CropBatch } from '../db/schemas';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { AdvisoryService } from './advisory.service';
import {
  calculateStorageRisk,
  calculateGrowingRisk,
  determineOverallRisk,
  type WeatherData,
  type RiskLevel,
  type RiskAssessment
} from '../utils/riskCalculator';
import {
  formatStorageAdvisory,
  formatGrowingAdvisory,
  type AdvisoryMessage
} from '../utils/banglaMessageFormatter';
import { simulateSMS } from '../utils/smsSimulator';
import { logError } from '../utils/errors';

/**
 * Smart alert structure
 */
export interface SmartAlert {
  farmerId: ObjectId;
  cropId: ObjectId;
  cropType: string;
  stage: 'growing' | 'harvested';
  riskLevel: RiskLevel;
  message: string;
  actions: string[];
  weatherConditions: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  storageInfo?: {
    location: string;
    division: string;
    district: string;
  };
  generatedAt: Date;
}

/**
 * Service for generating smart alerts based on weather and crop data
 */
export class SmartAlertService {
  constructor(
    private cropBatchesRepository: CropBatchesRepository,
    private farmersRepository: FarmersRepository,
    private advisoryService: AdvisoryService
  ) {}

  /**
   * Generates smart alerts for a farmer based on current weather
   * 
   * @param farmerId - The farmer's ObjectId
   * @param weather - Current weather data
   * @returns Promise resolving to array of generated smart alerts
   */
  async generateAlertsForFarmer(
    farmerId: ObjectId,
    weather: WeatherData
  ): Promise<SmartAlert[]> {
    try {
      console.log('[SmartAlertService] Generating alerts for farmer:', farmerId.toString());

      // Retrieve all active crop batches for the farmer
      const cropBatches = await this.cropBatchesRepository.findByFarmerId(farmerId);

      if (cropBatches.length === 0) {
        console.log('[SmartAlertService] No crop batches found for farmer');
        return [];
      }

      console.log(`[SmartAlertService] Found ${cropBatches.length} crop batches to evaluate`);

      const alerts: SmartAlert[] = [];

      // Generate advisory for each crop
      for (const crop of cropBatches) {
        try {
          const alert = await this.generateAlertForCrop(crop, weather);
          
          if (alert) {
            alerts.push(alert);
          }
        } catch (error) {
          logError(
            error as Error,
            `SmartAlertService.generateAlertForCrop - Crop ${crop._id?.toString()}`
          );
          // Continue processing other crops even if one fails
        }
      }

      console.log(`[SmartAlertService] Generated ${alerts.length} alerts`);

      return alerts;
    } catch (error) {
      logError(error as Error, 'SmartAlertService.generateAlertsForFarmer');
      throw error;
    }
  }

  /**
   * Generates an alert for a specific crop based on weather conditions
   * 
   * @param crop - Crop batch information
   * @param weather - Current weather data
   * @returns Smart alert or null if no alert needed
   */
  private async generateAlertForCrop(
    crop: CropBatch,
    weather: WeatherData
  ): Promise<SmartAlert | null> {
    // Calculate risk based on crop stage
    let riskAssessment: RiskAssessment;
    let advisoryMessage: AdvisoryMessage;

    if (crop.stage === 'harvested') {
      riskAssessment = calculateStorageRisk(crop, weather);
      advisoryMessage = formatStorageAdvisory(crop, weather, riskAssessment.level);
    } else {
      riskAssessment = calculateGrowingRisk(crop, weather);
      advisoryMessage = formatGrowingAdvisory(crop, weather, riskAssessment.level);
    }

    // Only generate alerts for Medium risk and above
    if (riskAssessment.level === 'Low') {
      console.log(`[SmartAlertService] Skipping low risk alert for crop ${crop._id?.toString()}`);
      return null;
    }

    // Build storage info if applicable
    let storageInfo: SmartAlert['storageInfo'];
    if (crop.stage === 'harvested' && crop.storageLocation) {
      storageInfo = {
        location: crop.storageLocation,
        division: crop.storageDivision || '',
        district: crop.storageDistrict || ''
      };
    }

    const alert: SmartAlert = {
      farmerId: crop.farmerId,
      cropId: crop._id!,
      cropType: crop.cropType,
      stage: crop.stage,
      riskLevel: riskAssessment.level,
      message: advisoryMessage.message,
      actions: advisoryMessage.actions,
      weatherConditions: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        windSpeed: weather.windSpeed
      },
      storageInfo,
      generatedAt: new Date()
    };

    console.log(`[SmartAlertService] Generated ${riskAssessment.level} risk alert for crop ${crop._id?.toString()}`);

    return alert;
  }

  /**
   * Stores generated alerts as advisories and triggers SMS simulation for critical alerts
   * 
   * @param alerts - Array of smart alerts to store
   * @returns Promise resolving to count of stored advisories
   */
  async storeAlertsAsAdvisories(alerts: SmartAlert[]): Promise<number> {
    try {
      let storedCount = 0;

      for (const alert of alerts) {
        // Store advisory
        await this.advisoryService.createFarmerAdvisory({
          farmerId: alert.farmerId,
          source: 'weather',
          message: alert.message,
          actions: alert.actions
        });

        storedCount++;

        // Simulate SMS for Critical risk alerts
        if (alert.riskLevel === 'Critical') {
          await this.sendCriticalAlertSMS(alert);
        }
      }

      console.log(`[SmartAlertService] Stored ${storedCount} advisories`);
      return storedCount;
    } catch (error) {
      logError(error as Error, 'SmartAlertService.storeAlertsAsAdvisories');
      throw error;
    }
  }

  /**
   * Simulates SMS notification for critical alerts
   * 
   * @param alert - The critical alert to send
   */
  private async sendCriticalAlertSMS(alert: SmartAlert): Promise<void> {
    try {
      // Retrieve farmer's phone number
      const farmer = await this.farmersRepository.findById(alert.farmerId);

      if (!farmer) {
        console.warn(`[SmartAlertService] Farmer not found for SMS: ${alert.farmerId.toString()}`);
        return;
      }

      // Simulate SMS
      simulateSMS(farmer.phone, alert.message, alert.generatedAt);

      console.log(`[SmartAlertService] SMS simulated for farmer ${farmer.phone}`);
    } catch (error) {
      logError(error as Error, 'SmartAlertService.sendCriticalAlertSMS');
      // Don't throw - SMS simulation failure shouldn't break the flow
    }
  }
}
