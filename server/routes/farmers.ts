import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { FarmerService } from '../services/farmer.service';
import { FarmersRepository } from '../db/repositories/farmers.repository';
import { getDatabase } from '../db/connection';
import { validateBody, validateParams } from '../middleware/validation';
import {
  RegisterFarmerRequest,
  LoginFarmerRequest,
  UpdateFarmerRequest,
  FarmerResponse,
  LoginFarmerResponse
} from '@shared/api';
import { Farmer } from '../db/schemas';

/**
 * Validation schemas
 */
const registerSchema = z.object({
  phone: z.string().regex(/^\+880\d{10}$/, 'Phone number must be in format +880XXXXXXXXXX'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  division: z.string().min(1, 'Division is required'),
  district: z.string().min(1, 'District is required'),
  upazila: z.string().min(1, 'Upazila is required'),
  language: z.enum(['bn', 'en']).optional(),
  roles: z.array(z.enum(['farmer', 'admin'])).optional()
});

const loginSchema = z.object({
  phone: z.string().regex(/^\+880\d{10}$/, 'Phone number must be in format +880XXXXXXXXXX'),
  password: z.string().min(1, 'Password is required')
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  division: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  upazila: z.string().min(1).optional(),
  language: z.enum(['bn', 'en']).optional()
});

const idParamSchema = z.object({
  id: z.string().refine((val) => ObjectId.isValid(val), {
    message: 'Invalid farmer ID format'
  })
});

/**
 * Helper function to convert Farmer to FarmerResponse
 */
function toFarmerResponse(farmer: Farmer): FarmerResponse {
  return {
    _id: farmer._id!.toString(),
    phone: farmer.phone,
    name: farmer.name,
    division: farmer.division,
    district: farmer.district,
    upazila: farmer.upazila,
    language: farmer.language,
    roles: farmer.roles,
    registeredAt: farmer.registeredAt.toISOString(),
    totalCrops: farmer.totalCrops,
    totalWeight: farmer.totalWeight,
    badges: farmer.badges
  };
}

/**
 * POST /api/farmers/register
 * Register a new farmer
 */
export const handleRegister: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    const farmerService = new FarmerService(farmersRepository);

    const input: RegisterFarmerRequest = req.body;
    const farmer = await farmerService.register(input);

    const response: FarmerResponse = toFarmerResponse(farmer);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/farmers/login
 * Authenticate a farmer
 */
export const handleLogin: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    const farmerService = new FarmerService(farmersRepository);

    const input: LoginFarmerRequest = req.body;
    const result = await farmerService.authenticate(input);

    const response: LoginFarmerResponse = {
      farmer: toFarmerResponse(result.farmer),
      message: 'Login successful'
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/farmers/:id
 * Get a farmer by ID
 */
export const handleGetFarmer: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    const farmerService = new FarmerService(farmersRepository);

    const farmerId = new ObjectId(req.params.id);
    const farmer = await farmerService.getFarmerById(farmerId);

    const response: FarmerResponse = toFarmerResponse(farmer);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/farmers/:id
 * Update a farmer's profile
 */
export const handleUpdateFarmer: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    const farmerService = new FarmerService(farmersRepository);

    const farmerId = new ObjectId(req.params.id);
    const input: UpdateFarmerRequest = req.body;
    
    const farmer = await farmerService.updateProfile(farmerId, input);

    const response: FarmerResponse = toFarmerResponse(farmer);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/farmers/check/:phone
 * Check if a farmer exists by phone (for debugging)
 */
export const handleCheckFarmer: RequestHandler = async (req, res, next) => {
  try {
    const db = getDatabase();
    const farmersRepository = new FarmersRepository(db);
    
    const phone = req.params.phone;
    const farmer = await farmersRepository.findByPhone(phone);
    
    if (farmer) {
      res.status(200).json({
        exists: true,
        phone: farmer.phone,
        name: farmer.name,
        registeredAt: farmer.registeredAt
      });
    } else {
      res.status(404).json({
        exists: false,
        message: 'Farmer not found'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Create and configure the farmers router
 */
export function createFarmersRouter(): Router {
  const router = Router();

  router.post('/register', validateBody(registerSchema), handleRegister);
  router.post('/login', validateBody(loginSchema), handleLogin);
  router.get('/check/:phone', handleCheckFarmer);
  router.get('/:id', validateParams(idParamSchema), handleGetFarmer);
  router.put('/:id', validateParams(idParamSchema), validateBody(updateSchema), handleUpdateFarmer);

  return router;
}
