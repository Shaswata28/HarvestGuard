import { RequestHandler } from "express";
import { getDatabase } from "../db/connection";

/**
 * Health check endpoint that verifies database connectivity
 */
export const handleHealthCheck: RequestHandler = async (_req, res) => {
  try {
    const db = getDatabase();
    
    // Ping the database to verify connection
    await db.admin().ping();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};
