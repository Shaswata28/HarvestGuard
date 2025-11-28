import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { InterventionsRepository } from '../db/repositories/interventions.repository';
import { getDatabase } from '../db/connection';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  CreateInterventionRequest,
  InterventionResponse,
  InterventionListResponse
} from '@shared/api';
import { Intervention } from '../db/schemas';

/**
 * Validation schemas
 */
const createInterventionSchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }),
  batchId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid batch ID format'
  }),
  interventionType: z.string().min(1, 'Intervention type is required'),
  success: z.boolean({
    required_error: 'Success status is required',
    invalid_type_error: 'Success must be a boolean'
  }),
  notes: z.string().optional()
});

const idParamSchema = z.object({
  id: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid intervention ID format'
  })
});

const listQuerySchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }).optional(),
  batchId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid batch ID format'
  }).optional()
});

/**
 * Helper function to convert Intervention to InterventionResponse
 */
function toInterventionResponse(intervention: Intervention): InterventionResponse {
  return {
    _id: intervention._id!.toString(),
    farmerId: intervention.farmerId.toString(),
    batchId: intervention.batchId.toString(),
    interventionType: intervention.interventionType,
    success: intervention.success,
    notes: intervention.notes,
    performedAt: intervention.performedAt.toISOString()
  };
}

/**
 * POST /api/interventions
 * Create a new intervention
 */
export const handleCreateIntervention: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const interventionsRepository = new InterventionsRepository(db);

    const input: CreateInterventionRequest = req.body;

    const intervention = await interventionsRepository.create({
      farmerId: new ObjectId(input.farmerId),
      batchId: new ObjectId(input.batchId),
      interventionType: input.interventionType,
      success: input.success,
      notes: input.notes,
      performedAt: new Date()
    });

    const response: InterventionResponse = toInterventionResponse(intervention);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interventions
 * Get interventions with optional filtering
 */
export const handleListInterventions: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const interventionsRepository = new InterventionsRepository(db);

    const query = req.query as {
      farmerId?: string;
      batchId?: string;
    };

    let interventions: Intervention[];

    if (query.farmerId) {
      // Filter by farmer ID
      const farmerId = new ObjectId(query.farmerId);
      interventions = await interventionsRepository.findByFarmerId(farmerId);
    } else if (query.batchId) {
      // Filter by batch ID
      const batchId = new ObjectId(query.batchId);
      interventions = await interventionsRepository.findByBatchId(batchId);
    } else {
      // Get all interventions
      interventions = await interventionsRepository.findMany({});
    }

    const response: InterventionListResponse = {
      interventions: interventions.map(toInterventionResponse),
      total: interventions.length
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interventions/:id
 * Get an intervention by ID
 */
export const handleGetIntervention: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const interventionsRepository = new InterventionsRepository(db);

    const interventionId = new ObjectId(req.params.id);
    const intervention = await interventionsRepository.findById(interventionId);

    if (!intervention) {
      res.status(404).json({
        error: {
          type: 'NotFoundError',
          message: 'Intervention not found',
          details: { interventionId: interventionId.toString() },
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const response: InterventionResponse = toInterventionResponse(intervention);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the interventions router
 */
export function createInterventionsRouter(): Router {
  const router = Router();

  router.post('/', validateBody(createInterventionSchema), handleCreateIntervention);
  router.get('/', validateQuery(listQuerySchema), handleListInterventions);
  router.get('/:id', validateParams(idParamSchema), handleGetIntervention);

  return router;
}
