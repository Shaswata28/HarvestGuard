import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Custom Zod type for MongoDB ObjectId
const objectIdSchema = z.custom<ObjectId>(
  (val) => val instanceof ObjectId,
  { message: 'Invalid ObjectId' }
);

// Farmers Schema
export const FarmerSchema = z.object({
  _id: objectIdSchema.optional(),
  phone: z.string().regex(/^\+880\d{10}$/, 'Phone must be in format +880XXXXXXXXXX'),
  passwordHash: z.string().min(1, 'Password hash is required'),
  name: z.string().min(1, 'Name is required'),
  division: z.string().min(1, 'Division is required'),
  district: z.string().min(1, 'District is required'),
  upazila: z.string().min(1, 'Upazila is required'),
  language: z.enum(['bn', 'en']).default('bn'),
  roles: z.array(z.enum(['farmer', 'admin'])).default(['farmer']),
  registeredAt: z.date().default(() => new Date()),
  // Optional dashboard caches
  totalCrops: z.number().optional(),
  totalWeight: z.number().optional(),
  badges: z.array(z.string()).optional()
});

export type Farmer = z.infer<typeof FarmerSchema>;

// Crop Batches Schema
export const CropBatchSchema = z.object({
  _id: objectIdSchema.optional(),
  farmerId: objectIdSchema,
  cropType: z.string().min(1, 'Crop type is required'),
  stage: z.enum(['growing', 'harvested']),
  // Growing stage fields
  estimatedWeightKg: z.number().positive('Estimated weight must be positive').optional(),
  expectedHarvestDate: z.date().optional(),
  // Harvested stage fields
  finalWeightKg: z.number().positive('Final weight must be positive').optional(),
  actualHarvestDate: z.date().optional(),
  storageLocation: z.enum(['silo', 'jute_bag', 'open_space', 'tin_shed']).optional(),
  storageDivision: z.string().optional(),
  storageDistrict: z.string().optional(),
  enteredDate: z.date().default(() => new Date()),
  lossPercentage: z.number().min(0).max(100, 'Loss percentage must be between 0 and 100').optional(),
  notes: z.string().optional(),
  batchNumber: z.string().optional()
});

export type CropBatch = z.infer<typeof CropBatchSchema>;

// Health Scans Schema
export const HealthScanSchema = z.object({
  _id: objectIdSchema.optional(),
  farmerId: objectIdSchema,
  batchId: objectIdSchema.optional(),
  capturedAt: z.date().default(() => new Date()),
  diseaseLabel: z.string().min(1, 'Disease label is required'),
  confidence: z.number().min(0).max(100, 'Confidence must be between 0 and 100'),
  remedyText: z.string().optional(),
  immediateFeedback: z.enum(['correct', 'incorrect', 'unsure']).optional(),
  outcome: z.enum(['recovered', 'same', 'worse']).optional(),
  status: z.enum(['pending', 'resolved', 'healthy']).default('pending'),
  imageUrl: z.string().url('Invalid image URL').optional()
});

export type HealthScan = z.infer<typeof HealthScanSchema>;

// Loss Events Schema
export const LossEventSchema = z.object({
  _id: objectIdSchema.optional(),
  farmerId: objectIdSchema,
  batchId: objectIdSchema,
  eventType: z.string().min(1, 'Event type is required'),
  lossPercentage: z.number().min(0).max(100, 'Loss percentage must be between 0 and 100'),
  lossWeightKg: z.number().positive('Loss weight must be positive'),
  reportedAt: z.date().default(() => new Date()),
  location: z.string().min(1, 'Location is required')
});

export type LossEvent = z.infer<typeof LossEventSchema>;

// Interventions Schema
export const InterventionSchema = z.object({
  _id: objectIdSchema.optional(),
  farmerId: objectIdSchema,
  batchId: objectIdSchema,
  interventionType: z.string().min(1, 'Intervention type is required'),
  success: z.boolean(),
  notes: z.string().optional(),
  performedAt: z.date().default(() => new Date())
});

export type Intervention = z.infer<typeof InterventionSchema>;

// Advisories Schema
export const AdvisorySchema = z.object({
  _id: objectIdSchema.optional(),
  farmerId: objectIdSchema.optional(), // null for broadcast
  source: z.enum(['weather', 'scanner', 'manual']),
  payload: z.object({
    message: z.string().min(1, 'Message is required'),
    actions: z.array(z.string()).optional()
  }),
  status: z.enum(['delivered', 'read']).default('delivered'),
  createdAt: z.date().default(() => new Date())
});

export type Advisory = z.infer<typeof AdvisorySchema>;

// Sessions Schema
export const SessionSchema = z.object({
  _id: objectIdSchema.optional(),
  farmerId: objectIdSchema,
  authType: z.enum(['otp', 'password']),
  expiresAt: z.date(),
  deviceMeta: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional()
  }).optional(),
  createdAt: z.date().default(() => new Date())
});

export type Session = z.infer<typeof SessionSchema>;

// Weather Snapshots Schema
export const WeatherSnapshotSchema = z.object({
  _id: objectIdSchema.optional(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]) // [longitude, latitude]
  }),
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  windSpeed: z.number(),
  windDirection: z.number(),
  rainfall: z.number(),
  weatherCondition: z.string(),
  weatherDescription: z.string(),
  weatherIcon: z.string(),
  visibility: z.number(),
  cloudiness: z.number(),
  sunrise: z.date(),
  sunset: z.date(),
  fetchedAt: z.date().default(() => new Date()),
  expiresAt: z.date(),
  source: z.string().default('openweathermap'),
  apiCallCount: z.number().default(1)
});

export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;

// Export all schemas as a collection
export const schemas = {
  FarmerSchema,
  CropBatchSchema,
  HealthScanSchema,
  LossEventSchema,
  InterventionSchema,
  AdvisorySchema,
  SessionSchema,
  WeatherSnapshotSchema
};
