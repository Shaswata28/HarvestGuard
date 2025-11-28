import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { DashboardService } from '../services/dashboard.service';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { LossEventsRepository } from '../db/repositories/lossEvents.repository';
import { InterventionsRepository } from '../db/repositories/interventions.repository';
import { getDatabase } from '../db/connection';
import { validateParams } from '../middleware/validation';
import {
  FarmerDashboardResponse,
  AdminDashboardResponse
} from '@shared/api';

/**
 * Validation schemas
 */
const farmerIdParamSchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  })
});

/**
 * GET /api/dashboard/farmer/:farmerId
 * Get dashboard metrics for a specific farmer
 */
export const handleGetFarmerDashboard: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    const cropBatchesRepository = new CropBatchesRepository(db);
    const lossEventsRepository = new LossEventsRepository(db);
    const interventionsRepository = new InterventionsRepository(db);
    
    const dashboardService = new DashboardService(
      farmersRepository,
      cropBatchesRepository,
      lossEventsRepository,
      interventionsRepository
    );

    const farmerId = new ObjectId(req.params.farmerId);
    const metrics = await dashboardService.getFarmerDashboard(farmerId);

    const response: FarmerDashboardResponse = {
      farmerId: metrics.farmerId.toString(),
      totalCrops: metrics.totalCrops,
      totalWeightKg: metrics.totalWeightKg,
      growingCrops: metrics.growingCrops,
      harvestedCrops: metrics.harvestedCrops,
      totalLossWeightKg: metrics.totalLossWeightKg,
      totalLossPercentage: metrics.totalLossPercentage,
      interventionSuccessRate: metrics.interventionSuccessRate,
      badges: metrics.badges
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/admin
 * Get dashboard metrics for administrators
 */
export const handleGetAdminDashboard: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    const cropBatchesRepository = new CropBatchesRepository(db);
    const lossEventsRepository = new LossEventsRepository(db);
    const interventionsRepository = new InterventionsRepository(db);
    
    const dashboardService = new DashboardService(
      farmersRepository,
      cropBatchesRepository,
      lossEventsRepository,
      interventionsRepository
    );

    const metrics = await dashboardService.getAdminDashboard();

    const response: AdminDashboardResponse = {
      totalFarmers: metrics.totalFarmers,
      totalCropBatches: metrics.totalCropBatches,
      totalGrowingBatches: metrics.totalGrowingBatches,
      totalHarvestedBatches: metrics.totalHarvestedBatches,
      totalLossWeightKg: metrics.totalLossWeightKg,
      averageLossPercentage: metrics.averageLossPercentage,
      interventionSuccessRate: metrics.interventionSuccessRate,
      topLossLocations: metrics.topLossLocations
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the dashboard router
 */
export function createDashboardRouter(): Router {
  const router = Router();

  router.get('/farmer/:farmerId', validateParams(farmerIdParamSchema), handleGetFarmerDashboard);
  router.get('/admin', handleGetAdminDashboard);

  return router;
}
