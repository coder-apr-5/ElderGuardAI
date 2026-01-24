/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ElderNest AI - API Response Helpers
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Standardized response utilities for consistent API responses.
 */

import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Success Response Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Send a successful response with data
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a successful response with just a message (no data)
 */
export const sendMessage = (
  res: Response,
  message: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse = {
    success: true,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a successful response for created resources
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    message,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  };

  return res.status(200).json(response);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Response Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a 400 Bad Request error
 */
export const sendBadRequest = (
  res: Response,
  error: string = 'Bad Request'
): Response => {
  return sendError(res, error, 400);
};

/**
 * Send a 401 Unauthorized error
 */
export const sendUnauthorized = (
  res: Response,
  error: string = 'Unauthorized'
): Response => {
  return sendError(res, error, 401);
};

/**
 * Send a 403 Forbidden error
 */
export const sendForbidden = (
  res: Response,
  error: string = 'Forbidden'
): Response => {
  return sendError(res, error, 403);
};

/**
 * Send a 404 Not Found error
 */
export const sendNotFound = (
  res: Response,
  error: string = 'Resource not found'
): Response => {
  return sendError(res, error, 404);
};

/**
 * Send a 409 Conflict error
 */
export const sendConflict = (
  res: Response,
  error: string = 'Resource already exists'
): Response => {
  return sendError(res, error, 409);
};

/**
 * Send a 422 Validation error
 */
export const sendValidationError = (
  res: Response,
  errors: string | string[]
): Response => {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
  return sendError(res, `Validation error: ${errorMessage}`, 422);
};

/**
 * Send a 429 Too Many Requests error
 */
export const sendRateLimited = (
  res: Response,
  error: string = 'Too many requests. Please try again later.'
): Response => {
  return sendError(res, error, 429);
};

/**
 * Send a 500 Internal Server Error
 */
export const sendServerError = (
  res: Response,
  error: string = 'Internal server error'
): Response => {
  return sendError(res, error, 500);
};

/**
 * Send a 503 Service Unavailable error
 */
export const sendServiceUnavailable = (
  res: Response,
  error: string = 'Service temporarily unavailable'
): Response => {
  return sendError(res, error, 503);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Type Guard Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if a response is successful
 */
export const isSuccessResponse = <T>(response: ApiResponse<T>): boolean => {
  return response.success && response.statusCode >= 200 && response.statusCode < 300;
};

/**
 * Check if a response is an error
 */
export const isErrorResponse = <T>(response: ApiResponse<T>): boolean => {
  return !response.success || response.statusCode >= 400;
};
