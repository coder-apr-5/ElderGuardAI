/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ElderNest AI - Winston Logger Configuration
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Centralized logging with Winston for development and production.
 * Features console and file transports with custom formatting.
 */

import winston from 'winston';
import path from 'path';

// Get environment configuration (avoid circular dependency)
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || './logs';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Custom Log Formats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Color scheme for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
  verbose: 'blue',
  silly: 'grey',
};

winston.addColors(colors);

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Custom format for file output (no colors, JSON-friendly)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Simple format for production console
const productionConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Logger Transports
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const transports: winston.transport[] = [];

// Console transport (always enabled)
if (NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: productionConsoleFormat,
      level: 'info',
    })
  );
}

// File transports (production only)
if (NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_FILE_PATH, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_FILE_PATH, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Create Logger Instance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels: winston.config.npm.levels,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Logger Helper Methods
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Log an API request
 */
export const logRequest = (
  method: string,
  url: string,
  userId?: string,
  duration?: number
) => {
  logger.http(`${method} ${url}`, {
    userId,
    duration: duration ? `${duration}ms` : undefined,
  });
};

/**
 * Log an API error
 */
export const logError = (
  error: Error,
  context?: Record<string, unknown>
) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

/**
 * Log an AI service interaction
 */
export const logAI = (
  provider: string,
  action: string,
  duration?: number,
  tokens?: number
) => {
  logger.info(`AI [${provider}] ${action}`, {
    duration: duration ? `${duration}ms` : undefined,
    tokens,
  });
};

/**
 * Log a Firestore operation
 */
export const logFirestore = (
  operation: string,
  collection: string,
  documentId?: string
) => {
  logger.debug(`Firestore ${operation} on ${collection}`, {
    documentId,
  });
};

/**
 * Log ML service interaction
 */
export const logML = (
  endpoint: string,
  success: boolean,
  duration?: number
) => {
  const level = success ? 'info' : 'warn';
  logger[level](`ML Service: ${endpoint}`, {
    success,
    duration: duration ? `${duration}ms` : undefined,
  });
};

export default logger;
