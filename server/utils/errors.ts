import { ZodError } from 'zod';
import { MongoError } from 'mongodb';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public type: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for schema validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('ValidationError', message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error for missing documents
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('NotFoundError', message, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error for unique constraint violations
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('ConflictError', message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Database error for general database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('DatabaseError', message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('AuthenticationError', message, 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

/**
 * Handles Zod validation errors and converts them to ValidationError
 */
export function handleZodError(error: ZodError): ValidationError {
  const details: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });

  return new ValidationError('Validation failed', { fields: details });
}

/**
 * Handles MongoDB errors and converts them to appropriate AppError
 */
export function handleDatabaseError(error: any): AppError {
  // Handle duplicate key errors (unique constraint violations)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'unknown';
    return new ConflictError(
      `Duplicate value for field: ${field}`,
      { field, value: error.keyValue?.[field] }
    );
  }

  // Handle MongoDB errors
  if (error instanceof MongoError) {
    return new DatabaseError(
      `Database operation failed: ${error.message}`,
      { code: error.code }
    );
  }

  // Handle generic errors
  return new DatabaseError(
    error.message || 'Unknown database error',
    { originalError: error.name }
  );
}

/**
 * Formats an AppError into a standardized error response
 */
export function formatErrorResponse(error: AppError): ErrorResponse {
  return {
    error: {
      type: error.type,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Logs error with appropriate level
 */
export function logError(error: Error | AppError, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(`${prefix} ${error.type}:`, error.message, error.details);
    } else {
      console.warn(`${prefix} ${error.type}:`, error.message);
    }
  } else {
    console.error(`${prefix} Unexpected error:`, error);
  }
}
