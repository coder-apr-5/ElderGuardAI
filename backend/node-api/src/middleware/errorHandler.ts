/**
 * ElderNest AI - Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/responses';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Firebase error code mapping
const firebaseErrorMap: Record<string, { message: string; statusCode: number }> = {
  'auth/user-not-found': { message: 'User not found', statusCode: 404 },
  'auth/wrong-password': { message: 'Invalid credentials', statusCode: 401 },
  'auth/email-already-in-use': { message: 'Email already registered', statusCode: 409 },
  'auth/weak-password': { message: 'Password is too weak', statusCode: 400 },
  'auth/invalid-email': { message: 'Invalid email address', statusCode: 400 },
  'auth/id-token-expired': { message: 'Session expired. Please log in again', statusCode: 401 },
  'auth/id-token-revoked': { message: 'Session revoked. Please log in again', statusCode: 401 },
  'permission-denied': { message: 'Permission denied', statusCode: 403 },
  'not-found': { message: 'Resource not found', statusCode: 404 },
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Check for Firebase errors
  const errorCode = (err as { code?: string }).code;
  if (errorCode && firebaseErrorMap[errorCode]) {
    const mapped = firebaseErrorMap[errorCode];
    statusCode = mapped.statusCode;
    message = mapped.message;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  sendError(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
