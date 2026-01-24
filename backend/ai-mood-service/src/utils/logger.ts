// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Winston Logger Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import winston from 'winston';
import path from 'path';

// Determine if running in production
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Custom log format with timestamp and colorization
 */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

/**
 * Console format with colors for development
 */
const consoleFormat = winston.format.combine(
    logFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message, timestamp, metadata }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (metadata && typeof metadata === 'object' && Object.keys(metadata as object).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
        }
        return log;
    })
);

/**
 * JSON format for file logging
 */
const fileFormat = winston.format.combine(
    logFormat,
    winston.format.json()
);

/**
 * Create transports array based on environment
 */
const transports: winston.transport[] = [
    // Console transport for all environments
    new winston.transports.Console({
        format: consoleFormat,
    }),
];

// Add file transports in production
if (isProduction) {
    // Error log file
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );

    // Combined log file
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        })
    );
}

/**
 * Winston logger instance
 */
export const logger = winston.createLogger({
    level: logLevel,
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: isProduction
        ? [
            new winston.transports.File({
                filename: path.join('logs', 'exceptions.log'),
            }),
        ]
        : undefined,
    // Handle unhandled promise rejections
    rejectionHandlers: isProduction
        ? [
            new winston.transports.File({
                filename: path.join('logs', 'rejections.log'),
            }),
        ]
        : undefined,
});

/**
 * Stream for Morgan HTTP logging
 */
export const loggerStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

/**
 * Log request details for debugging
 */
export function logRequest(
    method: string,
    path: string,
    body: Record<string, unknown>,
    userId?: string
): void {
    logger.info(`${method} ${path}`, {
        userId,
        bodyKeys: Object.keys(body),
    });
}

/**
 * Log AI API calls
 */
export function logAICall(
    provider: string,
    action: string,
    success: boolean,
    duration?: number
): void {
    logger.info(`AI API Call: ${provider} - ${action}`, {
        success,
        duration: duration ? `${duration}ms` : undefined,
    });
}

export default logger;
