import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, logError } from '../utils/errors';

/**
 * Global error handling middleware
 * Catches all errors and formats them into consistent error responses
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logError(error, `${req.method} ${req.path}`);

  // Handle AppError instances
  if (error instanceof AppError) {
    const errorResponse = formatErrorResponse(error);
    return res.status(error.statusCode).json(errorResponse);
  }

  // Handle unexpected errors
  const unexpectedError = new AppError(
    'InternalServerError',
    'An unexpected error occurred',
    500,
    { message: error.message }
  );

  const errorResponse = formatErrorResponse(unexpectedError);
  return res.status(500).json(errorResponse);
}

/**
 * Middleware to handle 404 Not Found for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      type: 'NotFoundError',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
    }
  });
}
