import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { LossEventsRepository } from '../db/repositories/lossEvents.repository';
import { getDatabase } from '../db/connection';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  CreateLossEventRequest,
  LossEventResponse,
  LossEventListResponse
} from '@shared/api';
import { LossEvent } from '../db/schemas';

/**
 * Validation schemas
 */
const createLossEventSchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }),
  batchId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid batch ID format'
  }),
  eventType: z.string().min(1, 'Event type is required'),
  lossPercentage: z.number().min(0, 'Loss percentage must be at least 0').max(100, 'Loss percentage must be at most 100'),
  lossWeightKg: z.number().positive('Loss weight must be positive'),
  location: z.string().min(1, 'Location is required')
});

const idParamSchema = z.object({
  id: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid loss event ID format'
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
 * Helper function to convert LossEvent to LossEventResponse
 */
function toLossEventResponse(lossEvent: LossEvent): LossEventResponse {
  return {
    _id: lossEvent._id!.toString(),
    farmerId: lossEvent.farmerId.toString(),
    batchId: lossEvent.batchId.toString(),
    eventType: lossEvent.eventType,
    lossPercentage: lossEvent.lossPercentage,
    lossWeightKg: lossEvent.lossWeightKg,
    reportedAt: lossEvent.reportedAt.toISOString(),
    location: lossEvent.location
  };
}

/**
 * POST /api/loss-events
 * Create a new loss event
 */
export const handleCreateLossEvent: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const lossEventsRepository = new LossEventsRepository(db);

    const input: CreateLossEventRequest = req.body;

    const lossEvent = await lossEventsRepository.create({
      farmerId: new ObjectId(input.farmerId),
      batchId: new ObjectId(input.batchId),
      eventType: input.eventType,
      lossPercentage: input.lossPercentage,
      lossWeightKg: input.lossWeightKg,
      location: input.location,
      reportedAt: new Date()
    });

    const response: LossEventResponse = toLossEventResponse(lossEvent);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/loss-events
 * Get loss events with optional filtering
 */
export const handleListLossEvents: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const lossEventsRepository = new LossEventsRepository(db);

    const query = req.query as {
      farmerId?: string;
      batchId?: string;
    };

    let lossEvents: LossEvent[];

    if (query.farmerId) {
      // Filter by farmer ID
      const farmerId = new ObjectId(query.farmerId);
      lossEvents = await lossEventsRepository.findByFarmerId(farmerId);
    } else if (query.batchId) {
      // Filter by batch ID
      const batchId = new ObjectId(query.batchId);
      lossEvents = await lossEventsRepository.findByBatchId(batchId);
    } else {
      // Get all loss events
      lossEvents = await lossEventsRepository.findMany({});
    }

    const response: LossEventListResponse = {
      lossEvents: lossEvents.map(toLossEventResponse),
      total: lossEvents.length
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/loss-events/:id
 * Get a loss event by ID
 */
export const handleGetLossEvent: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const lossEventsRepository = new LossEventsRepository(db);

    const lossEventId = new ObjectId(req.params.id);
    const lossEvent = await lossEventsRepository.findById(lossEventId);

    if (!lossEvent) {
      res.status(404).json({
        error: {
          type: 'NotFoundError',
          message: 'Loss event not found',
          details: { lossEventId: lossEventId.toString() },
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const response: LossEventResponse = toLossEventResponse(lossEvent);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the loss events router
 */
export function createLossEventsRouter(): Router {
  const router = Router();

  router.post('/', validateBody(createLossEventSchema), handleCreateLossEvent);
  router.get('/', validateQuery(listQuerySchema), handleListLossEvents);
  router.get('/:id', validateParams(idParamSchema), handleGetLossEvent);

  return router;
}
