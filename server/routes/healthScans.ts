import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { HealthScanService } from '../services/healthScan.service';
import { HealthScansRepository } from '../db/repositories/healthScans.repository';
import { getDatabase } from '../db/connection';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  CreateHealthScanRequest,
  UpdateHealthScanStatusRequest,
  UpdateHealthScanOutcomeRequest,
  HealthScanResponse,
  HealthScanListResponse
} from '@shared/api';
import { HealthScan } from '../db/schemas';

/**
 * Validation schemas
 */
const createHealthScanSchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }),
  batchId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid batch ID format'
  }).optional(),
  diseaseLabel: z.string().min(1, 'Disease label is required'),
  confidence: z.number().min(0, 'Confidence must be at least 0').max(100, 'Confidence must be at most 100'),
  remedyText: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL format').optional(),
  immediateFeedback: z.enum(['correct', 'incorrect', 'unsure']).optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'resolved', 'healthy'], {
    errorMap: () => ({ message: 'Status must be one of: pending, resolved, healthy' })
  })
});

const updateOutcomeSchema = z.object({
  outcome: z.enum(['recovered', 'same', 'worse'], {
    errorMap: () => ({ message: 'Outcome must be one of: recovered, same, worse' })
  }),
  immediateFeedback: z.enum(['correct', 'incorrect', 'unsure']).optional()
});

const idParamSchema = z.object({
  id: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid health scan ID format'
  })
});

const listQuerySchema = z.object({
  farmerId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  }).optional(),
  batchId: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid batch ID format'
  }).optional(),
  status: z.enum(['pending', 'resolved', 'healthy']).optional()
});

/**
 * Helper function to convert HealthScan to HealthScanResponse
 */
function toHealthScanResponse(scan: HealthScan): HealthScanResponse {
  return {
    _id: scan._id!.toString(),
    farmerId: scan.farmerId.toString(),
    batchId: scan.batchId?.toString(),
    capturedAt: scan.capturedAt.toISOString(),
    diseaseLabel: scan.diseaseLabel,
    confidence: scan.confidence,
    remedyText: scan.remedyText,
    imageUrl: scan.imageUrl,
    immediateFeedback: scan.immediateFeedback,
    outcome: scan.outcome,
    status: scan.status
  };
}

/**
 * POST /api/health-scans
 * Create a new health scan
 */
export const handleCreateHealthScan: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const healthScansRepository = new HealthScansRepository(db);
    const healthScanService = new HealthScanService(healthScansRepository);

    const input: CreateHealthScanRequest = req.body;

    const scan = await healthScanService.recordScan({
      farmerId: new ObjectId(input.farmerId),
      batchId: input.batchId ? new ObjectId(input.batchId) : undefined,
      diseaseLabel: input.diseaseLabel,
      confidence: input.confidence,
      remedyText: input.remedyText,
      imageUrl: input.imageUrl,
      immediateFeedback: input.immediateFeedback
    });

    const response: HealthScanResponse = toHealthScanResponse(scan);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/health-scans
 * Get health scans with optional filtering
 */
export const handleListHealthScans: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const healthScansRepository = new HealthScansRepository(db);
    const healthScanService = new HealthScanService(healthScansRepository);

    const query = req.query as {
      farmerId?: string;
      batchId?: string;
      status?: 'pending' | 'resolved' | 'healthy';
    };

    let scans: HealthScan[];

    if (query.farmerId) {
      // Filter by farmer ID
      const farmerId = new ObjectId(query.farmerId);
      scans = await healthScanService.getScansByFarmerId(farmerId);
      
      // Apply additional filters if provided
      if (query.status) {
        scans = scans.filter(scan => scan.status === query.status);
      }
    } else if (query.batchId) {
      // Filter by batch ID
      const batchId = new ObjectId(query.batchId);
      scans = await healthScanService.getScansByBatchId(batchId);
      
      // Apply additional filters if provided
      if (query.status) {
        scans = scans.filter(scan => scan.status === query.status);
      }
    } else {
      // Get all scans (with optional status filter)
      const filter: any = {};
      if (query.status) {
        filter.status = query.status;
      }
      scans = await healthScansRepository.findMany(filter);
    }

    const response: HealthScanListResponse = {
      scans: scans.map(toHealthScanResponse),
      total: scans.length
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/health-scans/:id
 * Get a health scan by ID
 */
export const handleGetHealthScan: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const healthScansRepository = new HealthScansRepository(db);
    const healthScanService = new HealthScanService(healthScansRepository);

    const scanId = new ObjectId(req.params.id);
    const scan = await healthScanService.getScanById(scanId);

    const response: HealthScanResponse = toHealthScanResponse(scan);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/health-scans/:id/status
 * Update the status of a health scan
 */
export const handleUpdateHealthScanStatus: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const healthScansRepository = new HealthScansRepository(db);
    const healthScanService = new HealthScanService(healthScansRepository);

    const scanId = new ObjectId(req.params.id);
    const input: UpdateHealthScanStatusRequest = req.body;

    const scan = await healthScanService.updateStatus(scanId, input.status);

    const response: HealthScanResponse = toHealthScanResponse(scan);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/health-scans/:id/outcome
 * Update the outcome of a health scan
 */
export const handleUpdateHealthScanOutcome: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const healthScansRepository = new HealthScansRepository(db);
    const healthScanService = new HealthScanService(healthScansRepository);

    const scanId = new ObjectId(req.params.id);
    const input: UpdateHealthScanOutcomeRequest = req.body;

    const scan = await healthScanService.updateOutcome(scanId, {
      outcome: input.outcome,
      immediateFeedback: input.immediateFeedback
    });

    const response: HealthScanResponse = toHealthScanResponse(scan);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the health scans router
 */
export function createHealthScansRouter(): Router {
  const router = Router();

  router.post('/', validateBody(createHealthScanSchema), handleCreateHealthScan);
  router.get('/', validateQuery(listQuerySchema), handleListHealthScans);
  router.get('/:id', validateParams(idParamSchema), handleGetHealthScan);
  router.put('/:id/status', validateParams(idParamSchema), validateBody(updateStatusSchema), handleUpdateHealthScanStatus);
  router.put('/:id/outcome', validateParams(idParamSchema), validateBody(updateOutcomeSchema), handleUpdateHealthScanOutcome);

  return router;
}
