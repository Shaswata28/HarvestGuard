import { ObjectId } from 'mongodb';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { LossEventsRepository } from '../db/repositories/lossEvents.repository';
import { InterventionsRepository } from '../db/repositories/interventions.repository';
import { logError } from '../utils/errors';

/**
 * Farmer dashboard metrics
 */
export interface FarmerDashboardMetrics {
  farmerId: ObjectId;
  totalCrops: number;
  totalWeightKg: number;
  growingCrops: number;
  harvestedCrops: number;
  totalLossWeightKg: number;
  totalLossPercentage: number;
  interventionSuccessRate: number;
  advisoryCount: number;
  badges: string[];
}

/**
 * Admin dashboard metrics
 */
export interface AdminDashboardMetrics {
  totalFarmers: number;
  totalCropBatches: number;
  totalGrowingBatches: number;
  totalHarvestedBatches: number;
  totalLossWeightKg: number;
  averageLossPercentage: number;
  interventionSuccessRate: number;
  topLossLocations: Array<{
    location: string;
    totalLossWeightKg: number;
    totalEvents: number;
  }>;
}

/**
 * Service layer for dashboard aggregations and analytics
 */
export class DashboardService {
  constructor(
    private farmersRepository: FarmersRepository,
    private cropBatchesRepository: CropBatchesRepository,
    private lossEventsRepository: LossEventsRepository,
    private interventionsRepository: InterventionsRepository,
    private advisoriesRepository?: any
  ) {}

  /**
   * Gets dashboard metrics for a specific farmer
   * @param farmerId - The farmer's ObjectId
   * @returns Promise resolving to farmer dashboard metrics
   */
  async getFarmerDashboard(farmerId: ObjectId): Promise<FarmerDashboardMetrics> {
    try {
      // Get all crop batches for the farmer
      const allBatches = await this.cropBatchesRepository.findByFarmerId(farmerId);
      const growingBatches = allBatches.filter(b => b.stage === 'growing');
      const harvestedBatches = allBatches.filter(b => b.stage === 'harvested');

      // Calculate total weight (sum of final weights for harvested batches)
      const totalWeightKg = harvestedBatches.reduce(
        (sum, batch) => sum + (batch.finalWeightKg || 0),
        0
      );

      // Get all loss events for the farmer
      const lossEvents = await this.lossEventsRepository.findByFarmerId(farmerId);
      
      const totalLossWeightKg = lossEvents.reduce(
        (sum, event) => sum + event.lossWeightKg,
        0
      );

      const totalLossPercentage = lossEvents.length > 0
        ? lossEvents.reduce((sum, event) => sum + event.lossPercentage, 0) / lossEvents.length
        : 0;

      // Get intervention success rate for the farmer
      const interventionStats = await this.interventionsRepository.calculateSuccessRate(farmerId);

      // Get advisory count
      let advisoryCount = 0;
      if (this.advisoriesRepository) {
        const advisories = await this.advisoriesRepository.findByFarmerId(farmerId);
        advisoryCount = advisories.length;
      }

      // Calculate badges based on achievements
      const badges = this.calculateBadges({
        totalCrops: allBatches.length,
        harvestedCrops: harvestedBatches.length,
        totalWeightKg,
        interventionSuccessRate: interventionStats.successRate
      });

      return {
        farmerId,
        totalCrops: allBatches.length,
        totalWeightKg,
        growingCrops: growingBatches.length,
        harvestedCrops: harvestedBatches.length,
        totalLossWeightKg,
        totalLossPercentage,
        interventionSuccessRate: interventionStats.successRate,
        advisoryCount,
        badges
      };
    } catch (error) {
      logError(error as Error, 'DashboardService.getFarmerDashboard');
      throw error;
    }
  }

  /**
   * Gets dashboard metrics for administrators
   * @returns Promise resolving to admin dashboard metrics
   */
  async getAdminDashboard(): Promise<AdminDashboardMetrics> {
    try {
      // Get total farmers count
      const totalFarmers = await this.farmersRepository.count({});

      // Get all crop batches
      const allBatches = await this.cropBatchesRepository.findMany({});
      const growingBatches = allBatches.filter(b => b.stage === 'growing');
      const harvestedBatches = allBatches.filter(b => b.stage === 'harvested');

      // Get all loss events
      const allLossEvents = await this.lossEventsRepository.findMany({});
      
      const totalLossWeightKg = allLossEvents.reduce(
        (sum, event) => sum + event.lossWeightKg,
        0
      );

      const averageLossPercentage = allLossEvents.length > 0
        ? allLossEvents.reduce((sum, event) => sum + event.lossPercentage, 0) / allLossEvents.length
        : 0;

      // Get intervention success rate across all farmers
      const interventionStats = await this.interventionsRepository.calculateSuccessRate();

      // Get top loss locations
      const locationStats = await this.lossEventsRepository.aggregateLossByLocation();
      const topLossLocations = locationStats.slice(0, 5).map(stat => ({
        location: stat.location,
        totalLossWeightKg: stat.totalLossWeightKg,
        totalEvents: stat.totalEvents
      }));

      return {
        totalFarmers,
        totalCropBatches: allBatches.length,
        totalGrowingBatches: growingBatches.length,
        totalHarvestedBatches: harvestedBatches.length,
        totalLossWeightKg,
        averageLossPercentage,
        interventionSuccessRate: interventionStats.successRate,
        topLossLocations
      };
    } catch (error) {
      logError(error as Error, 'DashboardService.getAdminDashboard');
      throw error;
    }
  }

  /**
   * Calculates badges for a farmer based on their achievements
   * @param metrics - Farmer metrics for badge calculation
   * @returns Array of badge names
   */
  private calculateBadges(metrics: {
    totalCrops: number;
    harvestedCrops: number;
    totalWeightKg: number;
    interventionSuccessRate: number;
  }): string[] {
    const badges: string[] = [];

    // First Harvest badge
    if (metrics.harvestedCrops >= 1) {
      badges.push('first_harvest');
    }

    // Experienced Farmer badge (10+ crops)
    if (metrics.totalCrops >= 10) {
      badges.push('experienced_farmer');
    }

    // High Yield badge (1000+ kg harvested)
    if (metrics.totalWeightKg >= 1000) {
      badges.push('high_yield');
    }

    // Master Farmer badge (5000+ kg harvested)
    if (metrics.totalWeightKg >= 5000) {
      badges.push('master_farmer');
    }

    // Intervention Expert badge (80%+ success rate with at least 5 interventions)
    if (metrics.interventionSuccessRate >= 80) {
      badges.push('intervention_expert');
    }

    return badges;
  }
}
