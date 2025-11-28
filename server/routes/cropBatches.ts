import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { CropBatchService } from '../services/cropBatch.service';
import { CropBatchesRepository } from '../db/repositories/cropBatches.repository';
import { LossEventsRepository } from '../db/repositories/lossEvents.repository';
import { getDatabase } from '../db/connection';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  CreateCropBatchRequest,
  UpdateCropBatchRequest,
  TransitionStageRequest,
  CropBatchResponse,
  CropBatchListResponse
} from '@shared/api';
import { CropBatch } from '../db/schemas';

/**
 * Validation schemas
 */
const createCropBatchSchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }),
  cropType: z.string().min(1, 'Crop type is required'),
  stage: z.enum(['growing', 'harvested']),
  // Growing stage fields
  estimatedWeightKg: z.number().positive('Estimated weight must be positive').optional(),
  expectedHarvestDate: z.string().datetime('Invalid date format').optional(),
  // Harvested stage fields
  finalWeightKg: z.number().positive('Final weight must be positive').optional(),
  actualHarvestDate: z.string().datetime('Invalid date format').optional(),
  storageLocation: z.enum(['silo', 'jute_bag', 'open_space', 'tin_shed']).optional(),
  storageDivision: z.string().optional(),
  storageDistrict: z.string().optional(),
  notes: z.string().optional(),
  batchNumber: z.string().optional()
}).refine(
  (data) => {
    // If stage is growing, require growing fields
    if (data.stage === 'growing') {
      return data.estimatedWeightKg !== undefined && data.expectedHarvestDate !== undefined;
    }
    return true;
  },
  {
    message: 'Growing stage requires estimatedWeightKg and expectedHarvestDate',
    path: ['stage']
  }
).refine(
  (data) => {
    // If stage is harvested, require harvested fields
    if (data.stage === 'harvested') {
      return (
        data.finalWeightKg !== undefined &&
        data.actualHarvestDate !== undefined &&
        data.storageLocation !== undefined &&
        data.storageDivision !== undefined &&
        data.storageDistrict !== undefined
      );
    }
    return true;
  },
  {
    message: 'Harvested stage requires finalWeightKg, actualHarvestDate, storageLocation, storageDivision, and storageDistrict',
    path: ['stage']
  }
);

const updateCropBatchSchema = z.object({
  cropType: z.string().min(1).optional(),
  estimatedWeightKg: z.number().positive().optional(),
  expectedHarvestDate: z.string().datetime().optional(),
  finalWeightKg: z.number().positive().optional(),
  actualHarvestDate: z.string().datetime().optional(),
  storageLocation: z.enum(['silo', 'jute_bag', 'open_space', 'tin_shed']).optional(),
  storageDivision: z.string().optional(),
  storageDistrict: z.string().optional(),
  lossPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  batchNumber: z.string().optional()
});

const transitionStageSchema = z.object({
  finalWeightKg: z.number().positive('Final weight must be positive'),
  actualHarvestDate: z.string().datetime('Invalid date format'),
  storageLocation: z.enum(['silo', 'jute_bag', 'open_space', 'tin_shed']),
  storageDivision: z.string().min(1, 'Storage division is required'),
  storageDistrict: z.string().min(1, 'Storage district is required')
});

const idParamSchema = z.object({
  id: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid crop batch ID format'
  })
});

const listQuerySchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }).optional(),
  stage: z.enum(['growing', 'harvested']).optional(),
  division: z.string().optional(),
  district: z.string().optional()
});

/**
 * Helper function to convert CropBatch to CropBatchResponse
 */
function toCropBatchResponse(batch: CropBatch): CropBatchResponse {
  return {
    _id: batch._id!.toString(),
    farmerId: batch.farmerId.toString(),
    cropType: batch.cropType,
    stage: batch.stage,
    estimatedWeightKg: batch.estimatedWeightKg,
    expectedHarvestDate: batch.expectedHarvestDate?.toISOString(),
    finalWeightKg: batch.finalWeightKg,
    actualHarvestDate: batch.actualHarvestDate?.toISOString(),
    storageLocation: batch.storageLocation,
    storageDivision: batch.storageDivision,
    storageDistrict: batch.storageDistrict,
    enteredDate: batch.enteredDate.toISOString(),
    lossPercentage: batch.lossPercentage,
    notes: batch.notes,
    batchNumber: batch.batchNumber
  };
}

/**
 * POST /api/crop-batches
 * Create a new crop batch
 */
export const handleCreateCropBatch: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const cropBatchesRepository = new CropBatchesRepository(db);
    const lossEventsRepository = new LossEventsRepository(db);
    const cropBatchService = new CropBatchService(cropBatchesRepository, lossEventsRepository);

    const input: CreateCropBatchRequest = req.body;
    const farmerId = new ObjectId(input.farmerId);

    let batch: CropBatch;

    if (input.stage === 'growing') {
      batch = await cropBatchService.createGrowingBatch({
        farmerId,
        cropType: input.cropType,
        estimatedWeightKg: input.estimatedWeightKg!,
        expectedHarvestDate: new Date(input.expectedHarvestDate!),
        notes: input.notes,
        batchNumber: input.batchNumber
      });
    } else {
      batch = await cropBatchService.createHarvestedBatch({
        farmerId,
        cropType: input.cropType,
        finalWeightKg: input.finalWeightKg!,
        actualHarvestDate: new Date(input.actualHarvestDate!),
        storageLocation: input.storageLocation!,
        storageDivision: input.storageDivision!,
        storageDistrict: input.storageDistrict!,
        notes: input.notes,
        batchNumber: input.batchNumber
      });
    }

    const response: CropBatchResponse = toCropBatchResponse(batch);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/crop-batches
 * Get crop batches with optional filtering
 */
export const handleListCropBatches: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const cropBatchesRepository = new CropBatchesRepository(db);
    const lossEventsRepository = new LossEventsRepository(db);
    const cropBatchService = new CropBatchService(cropBatchesRepository, lossEventsRepository);

    const query = req.query as {
      farmerId?: string;
      stage?: 'growing' | 'harvested';
      division?: string;
      district?: string;
    };

    let batches: CropBatch[];

    if (query.farmerId) {
      // Filter by farmer ID
      const farmerId = new ObjectId(query.farmerId);
      batches = await cropBatchService.getBatchesByFarmerId(farmerId, query.stage);
    } else if (query.division) {
      // Filter by location
      batches = await cropBatchService.getBatchesByLocation(query.division, query.district);
    } else {
      // Get all batches (with optional stage filter)
      const filter: any = {};
      if (query.stage) {
        filter.stage = query.stage;
      }
      batches = await cropBatchesRepository.findMany(filter);
    }

    const response: CropBatchListResponse = {
      batches: batches.map(toCropBatchResponse),
      total: batches.length
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/crop-batches/:id
 * Get a crop batch by ID
 */
export const handleGetCropBatch: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const cropBatchesRepository = new CropBatchesRepository(db);
    const lossEventsRepository = new LossEventsRepository(db);
    const cropBatchService = new CropBatchService(cropBatchesRepository, lossEventsRepository);

    const batchId = new ObjectId(req.params.id);
    const batch = await cropBatchService.getBatchById(batchId);

    const response: CropBatchResponse = toCropBatchResponse(batch);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/crop-batches/:id
 * Update a crop batch
 */
export const handleUpdateCropBatch: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const cropBatchesRepository = new CropBatchesRepository(db);

    const batchId = new ObjectId(req.params.id);
    const input: UpdateCropBatchRequest = req.body;

    // Convert date strings to Date objects
    const updateData: Partial<CropBatch> = {
      ...input,
      expectedHarvestDate: input.expectedHarvestDate ? new Date(input.expectedHarvestDate) : undefined,
      actualHarvestDate: input.actualHarvestDate ? new Date(input.actualHarvestDate) : undefined
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const batch = await cropBatchesRepository.updateById(batchId, updateData);

    if (!batch) {
      res.status(404).json({
        error: {
          type: 'NotFoundError',
          message: 'Crop batch not found',
          details: { batchId: batchId.toString() },
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const response: CropBatchResponse = toCropBatchResponse(batch);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/crop-batches/:id/stage
 * Transition a crop batch from growing to harvested
 */
export const handleTransitionStage: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const cropBatchesRepository = new CropBatchesRepository(db);
    const lossEventsRepository = new LossEventsRepository(db);
    const cropBatchService = new CropBatchService(cropBatchesRepository, lossEventsRepository);

    const batchId = new ObjectId(req.params.id);
    const input: TransitionStageRequest = req.body;

    const batch = await cropBatchService.transitionToHarvested(batchId, {
      finalWeightKg: input.finalWeightKg,
      actualHarvestDate: new Date(input.actualHarvestDate),
      storageLocation: input.storageLocation,
      storageDivision: input.storageDivision,
      storageDistrict: input.storageDistrict
    });

    const response: CropBatchResponse = toCropBatchResponse(batch);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/crop-batches/:id
 * Delete a crop batch
 */
export const handleDeleteCropBatch: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const cropBatchesRepository = new CropBatchesRepository(db);

    const batchId = new ObjectId(req.params.id);
    const deleted = await cropBatchesRepository.deleteById(batchId);

    if (!deleted) {
      res.status(404).json({
        error: {
          type: 'NotFoundError',
          message: 'Crop batch not found',
          details: { batchId: batchId.toString() },
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the crop batches router
 */
export function createCropBatchesRouter(): Router {
  const router = Router();

  router.post('/', validateBody(createCropBatchSchema), handleCreateCropBatch);
  router.get('/', validateQuery(listQuerySchema), handleListCropBatches);
  router.get('/:id', validateParams(idParamSchema), handleGetCropBatch);
  router.put('/:id', validateParams(idParamSchema), validateBody(updateCropBatchSchema), handleUpdateCropBatch);
  router.put('/:id/stage', validateParams(idParamSchema), validateBody(transitionStageSchema), handleTransitionStage);
  router.delete('/:id', validateParams(idParamSchema), handleDeleteCropBatch);

  return router;
}
