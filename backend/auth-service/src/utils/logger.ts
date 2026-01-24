// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Winston Logger Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, ...metadata }) => {
    let log = `${ts} ${level}: ${message}`;
    if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
        log += ` ${JSON.stringify(metadata)}`;
    }
    return log;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    defaultMeta: { service: 'auth-service' },
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            ),
        }),
    ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log'
    }));
}

/**
 * Log HTTP request
 */
export function logRequest(req: { method: string; path: string; ip?: string }, statusCode: number, duration: number): void {
    logger.http(`${req.method} ${req.path}`, {
        statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
    });
}

/**
 * Log authentication event
 */
export function logAuthEvent(event: string, details: Record<string, unknown>): void {
    logger.info(`[AUTH] ${event}`, details);
}

/**
 * Log security event
 */
export function logSecurityEvent(event: string, details: Record<string, unknown>): void {
    logger.warn(`[SECURITY] ${event}`, details);
}

export default logger;
