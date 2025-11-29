/**
 * Weather Advisory Generation Service
 * 
 * Orchestrates automatic generation of weather-based advisories for farmers.
 * Includes duplicate prevention and crop-specific enrichment.
 */

import { ObjectId } from 'mongodb';
import { AdvisoryService } from './advisory.service';
import { getWeatherForFarmer } from './weather.service';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { AdvisoriesRepository } from '../db/repositories/advisories.repository';
import { Advisory } from '../db/schemas';
import { logError } from '../utils/errors';
import { 
  generateBanglaAdvisory, 
  calculateDaysUntilHarvest, 
  determineMostUrgentRisk,
  WeatherCondition,
  CropContext,
  WeatherRiskData
} from '../utils/banglaAdvisoryGenerator';
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

      // Get farmer's active crop batches
      const cropBatches = await this.cropBatchesRepository.findByFarmerId(farmerId, 'growing');

      // Determine the most urgent weather risk
      const weatherRiskData: WeatherRiskData = {
        temperature: weather.temperature,
        rainfall: weather.rainfall,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed
      };

      const mostUrgentRisk = determineMostUrgentRisk(weatherRiskData);

      // Generate context-aware advisory (even if no risk, provide favorable weather message)
      const advisory = this.generateContextAwareAdvisory(mostUrgentRisk, cropBatches, weather);

      if (!advisory) {
        console.log(`No advisory generated for farmer ${farmerId}`);
        return [];
      }

      // Create the advisory
      const createdAdvisory = await this.advisoryService.createFarmerAdvisory({
        farmerId,
        source: 'weather',
        message: advisory.message,
        actions: [] // Actions are embedded in the Bangla message
      });

      console.log(`✓ Created weather advisory for farmer ${farmerId}`);

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

      return [createdAdvisory];
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
   * Generates context-aware advisory by combining weather risk with crop data
   * @param weatherRisk - The most urgent weather risk (null if no risk)
   * @param cropBatches - Array of active crop batches
   * @param weather - Current weather data
   * @returns Advisory object with message and severity
   */
  private generateContextAwareAdvisory(
    weatherRisk: WeatherCondition | null,
    cropBatches: any[],
    weather?: any
  ): { message: string; severity: 'low' | 'medium' | 'high' } | null {
    // If no weather risk, generate favorable weather message
    if (!weatherRisk) {
      return this.generateFavorableWeatherMessage(cropBatches, weather);
    }

    // If no active crops, generate general weather warning
    if (cropBatches.length === 0) {
      return this.generateGeneralWeatherWarning(weatherRisk);
    }

    // Find the crop with the most urgent harvest date (harvest advisory prioritization)
    let mostUrgentCrop: CropContext | null = null;
    let minDaysUntilHarvest = Infinity;

    for (const batch of cropBatches) {
      const daysUntilHarvest = calculateDaysUntilHarvest(batch.expectedHarvestDate);
      
      const cropContext: CropContext = {
        cropType: batch.cropType,
        daysUntilHarvest,
        stage: batch.stage
      };

      // Prioritize crops approaching harvest (within 7 days)
      if (daysUntilHarvest !== null && daysUntilHarvest <= 7) {
        if (daysUntilHarvest < minDaysUntilHarvest) {
          minDaysUntilHarvest = daysUntilHarvest;
          mostUrgentCrop = cropContext;
        }
      } else if (!mostUrgentCrop) {
        // If no harvest-urgent crop found yet, use the first growing crop
        mostUrgentCrop = cropContext;
      }
    }

    // Generate advisory using the most urgent crop context
    if (mostUrgentCrop) {
      return generateBanglaAdvisory(weatherRisk, mostUrgentCrop);
    }

    return null;
  }

  /**
   * Generates a general weather warning when farmer has no active crops
   * @param weatherRisk - The weather risk condition
   * @returns Advisory object with general warning message
   */
  private generateGeneralWeatherWarning(
    weatherRisk: WeatherCondition
  ): { message: string; severity: 'low' | 'medium' | 'high' } {
    const value = Math.round(weatherRisk.value);
    
    switch (weatherRisk.type) {
      case 'rain':
        return {
          message: `বৃষ্টির সম্ভাবনা ${value}% → আপনার এলাকায় বৃষ্টি হতে পারে, সতর্ক থাকুন`,
          severity: weatherRisk.severity
        };
      
      case 'heat':
        return {
          message: `তাপমাত্রা ${value}°C উঠবে → গরমের জন্য সতর্ক থাকুন`,
          severity: weatherRisk.severity
        };
      
      case 'wind':
        return {
          message: `ঝড়ো হাওয়া ${value} মি/সে → আপনার এলাকায় ঝড় হতে পারে, সতর্ক থাকুন`,
          severity: weatherRisk.severity
        };
      
      case 'humidity':
        return {
          message: `আর্দ্রতা ${value}% → আবহাওয়া স্যাঁতসেঁতে থাকবে, সতর্ক থাকুন`,
          severity: weatherRisk.severity
        };
      
      default:
        return {
          message: 'আবহাওয়া পরিবর্তন হতে পারে → সতর্ক থাকুন',
          severity: 'low'
        };
    }
  }

  /**
   * Generates a favorable weather message when there are no significant risks
   * @param cropBatches - Array of active crop batches
   * @param weather - Current weather data
   * @returns Advisory object with favorable weather message
   */
  private generateFavorableWeatherMessage(
    cropBatches: any[],
    weather?: any
  ): { message: string; severity: 'low' | 'medium' | 'high' } {
    const temp = weather ? Math.round(weather.temperature) : null;
    
    if (cropBatches.length > 0) {
      // Check if any crops are approaching harvest
      const harvestSoonCrops = cropBatches.filter(batch => {
        const days = calculateDaysUntilHarvest(batch.expectedHarvestDate);
        return days !== null && days <= 7;
      });

      if (harvestSoonCrops.length > 0) {
        const cropType = harvestSoonCrops[0].cropType;
        return {
          message: `আবহাওয়া ভালো আছে ${temp ? `(${temp}°C)` : ''} → ${cropType} কাটার জন্য উপযুক্ত সময়`,
          severity: 'low'
        };
      }

      // General favorable message for growing crops
      const cropType = cropBatches[0].cropType;
      return {
        message: `আবহাওয়া ভালো আছে ${temp ? `(${temp}°C)` : ''} → ${cropType} ভালোভাবে বাড়ছে`,
        severity: 'low'
      };
    }

    // No crops - general favorable message
    return {
      message: `আবহাওয়া ভালো আছে ${temp ? `(${temp}°C)` : ''} → কৃষিকাজের জন্য উপযুক্ত সময়`,
      severity: 'low'
    };
  }
}
