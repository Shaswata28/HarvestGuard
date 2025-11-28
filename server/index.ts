import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleHealthCheck } from "./routes/health";

// Debug: Check if environment variables are loaded
console.log('=== Environment Variables Check ===');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length);
console.log('GEMINI_API_KEY preview:', process.env.GEMINI_API_KEY?.substring(0, 15) + '...');
console.log('===================================');
import { createFarmersRouter } from "./routes/farmers";
import { createCropBatchesRouter } from "./routes/cropBatches";
import { createHealthScansRouter } from "./routes/healthScans";
import { createLossEventsRouter } from "./routes/lossEvents";
import { createInterventionsRouter } from "./routes/interventions";
import { createAdvisoriesRouter } from "./routes/advisories";
import { createDashboardRouter } from "./routes/dashboard";
import { createWeatherRouter } from "./routes/weather";
import { createScannerRouter } from "./routes/scanner";
import { connectToDatabase } from "./db/connection";
import { initializeIndexes } from "./db/initialize";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createServer() {
  const app = express();

  // CORS configuration - supports both development and production
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.use(cors({
    origin: corsOrigin,
    credentials: true
  }));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health", handleHealthCheck);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Farmers API routes
  app.use("/api/farmers", createFarmersRouter());

  // Crop Batches API routes
  app.use("/api/crop-batches", createCropBatchesRouter());

  // Health Scans API routes
  app.use("/api/health-scans", createHealthScansRouter());

  // Loss Events API routes
  app.use("/api/loss-events", createLossEventsRouter());

  // Interventions API routes
  app.use("/api/interventions", createInterventionsRouter());

  // Advisories API routes
  app.use("/api/advisories", createAdvisoriesRouter());

  // Dashboard API routes
  app.use("/api/dashboard", createDashboardRouter());

  // Weather API routes
  app.use("/api/weather", createWeatherRouter());

  // Scanner API routes
  app.use("/api/scanner", createScannerRouter());

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Initializes the server with database connection
 */
export async function initializeServer() {
  try {
    // Connect to MongoDB before starting the server
    await connectToDatabase();
    console.log('[Server] Database connection established');
    
    // Create all database indexes
    await initializeIndexes();
    
    const app = createServer();
    return app;
  } catch (error) {
    console.error('[Server] Failed to initialize server:', error);
    throw error;
  }
}
