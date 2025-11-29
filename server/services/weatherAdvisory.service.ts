/**
 * Weather Advisory Generation Service
 * 
 * Orchestrates automatic generation of weather-based advisories for farmers.
 * Includes duplicate prevention and crop-specific enrichment.
 */

import { ObjectId } from 'mongodb';
import { AdvisoryService } from './advisory.service';
import { getWeatherForFarmer, generateAdvisories } from './weather.service';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { AdvisoriesRepository } from '../db/repositories/advisories.repository';
import { Advisory as WeatherAdvisory } from '@shared/api';
import { Advisory } from '../db/schemas';
import { logError } from '../utils/errors';
import { SmartAlertService } from './smartAlert.service';

/**
 * Weather Advisory Generation Service
 */
export class WeatherAdvisoryService {
  constructor(
    private advisoryService: AdvisoryService,
    private advisoriesRepository: AdvisoriesRepository,
    private farmersRepository: FarmersRepository,
    private cropBatchesRepository: CropBatchesRepository,
    private smartAlertService?: SmartAlertService
  ) {}

  /**
   * Generates weather advisories for a specific farmer
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to array of created advisories
   */
  async generateForFarmer(farmerId: ObjectId): Promise<Advisory[]> {
    try {
      console.log(`Generating weather advisories for farmer ${farmerId}`);

      // Check for duplicate advisories within 24 hours
      const shouldGenerate = await this.shouldGenerateAdvisory(farmerId, 'weather', 24);
      
      if (!shouldGenerate) {
        console.log(`Skipping advisory generation for farmer ${farmerId} - duplicate within 24 hours`);
        return [];
      }

      // Get weather data for farmer's location
      const weather = await getWeatherForFarmer(farmerId.toString());

      // Generate weather-based advisories
      const weatherAdvisories = generateAdvisories(weather);

      if (weatherAdvisories.length === 0) {
        console.log(`No weather advisories needed for farmer ${farmerId}`);
        return [];
      }

      // Get farmer's active crop batches for enrichment
      const cropBatches = await this.cropBatchesRepository.findByFarmerId(farmerId, 'growing');

      // Create advisories with crop enrichment
      const createdAdvisories: Advisory[] = [];

      for (const weatherAdvisory of weatherAdvisories) {
        const enrichedMessage = this.enrichAdvisoryWithCropInfo(
          weatherAdvisory,
          cropBatches.map(b => b.cropType)
        );

        const advisory = await this.advisoryService.createFarmerAdvisory({
          farmerId,
          source: 'weather',
          message: enrichedMessage,
          actions: weatherAdvisory.actions
        });

        createdAdvisories.push(advisory);
      }

      console.log(`✓ Created ${createdAdvisories.length} weather advisories for farmer ${farmerId}`);

      // Generate smart alerts alongside weather advisories
      if (this.smartAlertService) {
        try {
          console.log(`Generating smart alerts for farmer ${farmerId}`);
          
          const smartAlerts = await this.smartAlertService.generateAlertsForFarmer(
            farmerId,
            weather
          );

          // Store smart alerts as advisories
          const smartAlertCount = await this.smartAlertService.storeAlertsAsAdvisories(smartAlerts);
          
          console.log(`✓ Created ${smartAlertCount} smart alert advisories for farmer ${farmerId}`);
        } catch (error) {
          // Log error but don't fail the entire operation
          logError(error as Error, 'WeatherAdvisoryService.generateForFarmer - Smart Alerts');
          console.warn('Smart alert generation failed, continuing with weather advisories');
        }
      }

      return createdAdvisories;
    } catch (error) {
      logError(error as Error, 'WeatherAdvisoryService.generateForFarmer');
      throw error;
    }
  }

  /**
   * Generates advisories for all farmers in a specific location
   * @param division - Division name
   * @param district - Optional district name
   * @returns Promise resolving to count of generated advisories
   */
  async generateForLocation(division: string, district?: string): Promise<number> {
    try {
      console.log(`Generating weather advisories for location: ${division}${district ? `/${district}` : ''}`);

      // Find all farmers in the location
      const filter: any = { division };
      if (district) {
        filter.district = district;
      }

      const farmers = await this.farmersRepository.findMany(filter);
      console.log(`Found ${farmers.length} farmers in ${division}${district ? `/${district}` : ''}`);

      let totalGenerated = 0;

      // Generate advisories for each farmer
      for (const farmer of farmers) {
        try {
          const advisories = await this.generateForFarmer(farmer._id!);
          totalGenerated += advisories.length;
        } catch (error) {
          console.error(`Error generating advisories for farmer ${farmer._id}:`, error);
          // Continue with other farmers
        }
      }

      console.log(`✓ Generated ${totalGenerated} total advisories for ${farmers.length} farmers`);
      return totalGenerated;
    } catch (error) {
      logError(error as Error, 'WeatherAdvisoryService.generateForLocation');
      throw error;
    }
  }

  /**
   * Generates advisories for all active farmers
   * @returns Promise resolving to count of generated advisories
   */
  async generateForAllFarmers(): Promise<number> {
    try {
      console.log('Generating weather advisories for all farmers');

      const farmers = await this.farmersRepository.findMany({});
      console.log(`Found ${farmers.length} total farmers`);

      let totalGenerated = 0;

      // Process in batches of 10 to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < farmers.length; i += batchSize) {
        const batch = farmers.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(farmer => this.generateForFarmer(farmer._id!))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            totalGenerated += result.value.length;
          } else {
            console.error(`Error generating advisories for farmer ${batch[index]._id}:`, result.reason);
          }
        });

        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(farmers.length / batchSize)}`);
      }

      console.log(`✓ Generated ${totalGenerated} total advisories for ${farmers.length} farmers`);
      return totalGenerated;
    } catch (error) {
      logError(error as Error, 'WeatherAdvisoryService.generateForAllFarmers');
      throw error;
    }
  }

  /**
   * Checks if an advisory should be generated (duplicate prevention)
   * @param farmerId - The farmer's ObjectId
   * @param advisoryType - The advisory source type
   * @param hoursWindow - Time window in hours to check for duplicates
   * @returns Promise resolving to true if advisory should be generated
   */
  private async shouldGenerateAdvisory(
    farmerId: ObjectId,
    advisoryType: 'weather' | 'scanner' | 'manual',
    hoursWindow: number
  ): Promise<boolean> {
    try {
      const recentAdvisories = await this.advisoriesRepository.findRecentByFarmerAndType(
        farmerId,
        advisoryType,
        hoursWindow
      );

      return recentAdvisories.length === 0;
    } catch (error) {
      logError(error as Error, 'WeatherAdvisoryService.shouldGenerateAdvisory');
      // On error, allow generation to proceed
      return true;
    }
  }

  /**
   * Enriches advisory message with crop-specific information
   * @param advisory - The weather advisory
   * @param cropTypes - Array of crop types the farmer is growing
   * @returns Enriched message string in Bangla
   */
  private enrichAdvisoryWithCropInfo(
    advisory: WeatherAdvisory,
    cropTypes: string[]
  ): string {
    let message = advisory.message;

    // Add crop-specific guidance if farmer has active crops
    if (cropTypes.length > 0) {
      const uniqueCrops = [...new Set(cropTypes)];
      const cropList = uniqueCrops.join(', ');
      
      // Add Bangla crop-specific message
      message += `\n\nআপনার ${cropList} ফসলের জন্য বিশেষ সতর্কতা অবলম্বন করুন।`;
    } else {
      // General message for farmers without active crops
      message += '\n\nআপনার এলাকার আবহাওয়া পরিস্থিতি সম্পর্কে সতর্ক থাকুন।';
    }

    return message;
  }
}
