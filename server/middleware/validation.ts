import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { handleZodError } from '../utils/errors';

/**
 * Middleware factory for validating request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = handleZodError(error);
        res.status(validationError.statusCode).json({
          error: {
            type: validationError.type,
            message: validationError.message,
            details: validationError.details,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory for validating request params against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = handleZodError(error);
        res.status(validationError.statusCode).json({
          error: {
            type: validationError.type,
            message: validationError.message,
            details: validationError.details,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory for validating request query against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate query, but don't try to reassign req.query (it's read-only)
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = handleZodError(error);
        res.status(validationError.statusCode).json({
          error: {
            type: validationError.type,
            message: validationError.message,
            details: validationError.details,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        next(error);
      }
    }
  };
}
