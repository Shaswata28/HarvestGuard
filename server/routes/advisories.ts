import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { AdvisoriesRepository } from '../db/repositories/advisories.repository';
import { AdvisoryService } from '../services/advisory.service';
import { getDatabase } from '../db/connection';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  CreateAdvisoryRequest,
  AdvisoryResponse,
  AdvisoryListResponse
} from '@shared/api';
import { Advisory } from '../db/schemas';

/**
 * Validation schemas
 */
const createAdvisorySchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }).optional(),
  source: z.enum(['weather', 'scanner', 'manual'], {
    required_error: 'Source is required',
    invalid_type_error: 'Source must be one of: weather, scanner, manual'
  }),
  message: z.string().min(1, 'Message is required'),
  actions: z.array(z.string()).optional()
});

const idParamSchema = z.object({
  id: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid advisory ID format'
  })
});

const listQuerySchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }).optional(),
  status: z.enum(['delivered', 'read']).optional()
});



/**
 * Helper function to convert Advisory to AdvisoryResponse
 */
function toAdvisoryResponse(advisory: Advisory): AdvisoryResponse {
  return {
    _id: advisory._id!.toString(),
    farmerId: advisory.farmerId?.toString(),
    source: advisory.source,
    payload: {
      message: advisory.payload.message,
      actions: advisory.payload.actions
    },
    status: advisory.status,
    createdAt: advisory.createdAt.toISOString()
  };
}

/**
 * POST /api/advisories
 * Create a new advisory (farmer-specific or broadcast)
 */
export const handleCreateAdvisory: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const advisoriesRepository = new AdvisoriesRepository(db);
    const advisoryService = new AdvisoryService(advisoriesRepository);

    const input: CreateAdvisoryRequest = req.body;

    let advisory: Advisory;

    if (input.farmerId) {
      // Create farmer-specific advisory
      advisory = await advisoryService.createFarmerAdvisory({
        farmerId: new ObjectId(input.farmerId),
        source: input.source,
        message: input.message,
        actions: input.actions
      });
    } else {
      // Create broadcast advisory
      advisory = await advisoryService.createBroadcastAdvisory({
        source: input.source,
        message: input.message,
        actions: input.actions
      });
    }

    const response: AdvisoryResponse = toAdvisoryResponse(advisory);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/advisories
 * Get advisories with optional filtering
 */
export const handleListAdvisories: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const advisoriesRepository = new AdvisoriesRepository(db);
    const advisoryService = new AdvisoryService(advisoriesRepository);

    const query = req.query as {
      farmerId?: string;
      status?: 'delivered' | 'read';
    };

    let advisories: Advisory[];

    if (query.farmerId) {
      // Get all advisories for a specific farmer (including broadcast)
      const farmerId = new ObjectId(query.farmerId);
      advisories = await advisoryService.getAdvisoriesForFarmer(farmerId);
    } else if (query.status) {
      // Filter by status only
      advisories = await advisoriesRepository.findMany({ status: query.status });
    } else {
      // Get all advisories
      advisories = await advisoriesRepository.findMany({});
    }

    const response: AdvisoryListResponse = {
      advisories: advisories.map(toAdvisoryResponse),
      total: advisories.length
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/advisories/:id
 * Get an advisory by ID
 */
export const handleGetAdvisory: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const advisoriesRepository = new AdvisoriesRepository(db);
    const advisoryService = new AdvisoryService(advisoriesRepository);

    const advisoryId = new ObjectId(req.params.id);
    const advisory = await advisoryService.getAdvisoryById(advisoryId);

    const response: AdvisoryResponse = toAdvisoryResponse(advisory);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};



/**
 * POST /api/advisories/generate
 * Manually trigger weather advisory generation
 */
export const handleGenerateAdvisories: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const advisoriesRepository = new AdvisoriesRepository(db);
    const farmersRepository = new (await import('../db/repositories/farmers.repository')).FarmersRepository(db);
    const cropBatchesRepository = new (await import('../db/repositories/cropBatches.repository')).CropBatchesRepository(db);
    const advisoryService = new AdvisoryService(advisoriesRepository);
    
    // Instantiate SmartAlertService
    const { SmartAlertService } = await import('../services/smartAlert.service');
    const smartAlertService = new SmartAlertService(
      cropBatchesRepository,
      farmersRepository,
      advisoryService
    );
    
    const weatherAdvisoryService = new (await import('../services/weatherAdvisory.service')).WeatherAdvisoryService(
      advisoryService,
      advisoriesRepository,
      farmersRepository,
      cropBatchesRepository,
      smartAlertService
    );

    const { farmerId, division, district } = req.body;

    let count: number;
    let message: string;

    if (farmerId) {
      // Generate for specific farmer
      const advisories = await weatherAdvisoryService.generateForFarmer(new ObjectId(farmerId));
      count = advisories.length;
      message = `Generated ${count} advisories for farmer ${farmerId}`;
    } else if (division) {
      // Generate for location
      count = await weatherAdvisoryService.generateForLocation(division, district);
      message = `Generated ${count} advisories for ${division}${district ? `/${district}` : ''}`;
    } else {
      // Generate for all farmers
      count = await weatherAdvisoryService.generateForAllFarmers();
      message = `Generated ${count} advisories for all farmers`;
    }

    res.status(200).json({
      success: true,
      message,
      count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the advisories router
 */
export function createAdvisoriesRouter(): Router {
  const router = Router();

  router.post('/', validateBody(createAdvisorySchema), handleCreateAdvisory);
  router.post('/generate', handleGenerateAdvisories);
  router.get('/', validateQuery(listQuerySchema), handleListAdvisories);
  router.get('/:id', validateParams(idParamSchema), handleGetAdvisory);

  return router;
}
