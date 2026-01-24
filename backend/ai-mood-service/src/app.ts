// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Express Application Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { logger } from './utils/logger';
import { sendError, ErrorCode } from './utils/responses';

// Routes
import chatRoutes from './routes/chat.routes';
import analysisRoutes from './routes/analysis.routes';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
    const app = express();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Security Middleware
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Helmet for security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, etc.)
            if (!origin) {
                callback(null, true);
                return;
            }

            if (config.allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn('CORS blocked origin', { origin });
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400, // 24 hours
    }));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Rate Limiting
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const limiter = rateLimit({
        windowMs: config.rateLimitWindowMinutes * 60 * 1000,
        max: config.rateLimitMax,
        message: {
            success: false,
            error: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', { ip: req.ip });
            res.status(429).json({
                success: false,
                error: 'Too many requests. Please wait a moment before trying again.',
                code: ErrorCode.RATE_LIMIT_EXCEEDED,
                statusCode: 429,
            });
        },
    });

    app.use(limiter);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Body Parsing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Request Logging
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.http(`${req.method} ${req.path}`, {
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
            });
        });

        next();
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Health Check Endpoint
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                service: 'eldernest-ai-mood-service',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: config.nodeEnv,
            },
        });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // API Routes
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    app.use('/api/chat', chatRoutes);
    app.use('/api/analyze', analysisRoutes);

    // Legacy routes for backwards compatibility
    app.use('/api', chatRoutes);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 404 Handler
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    app.use((req: Request, res: Response) => {
        sendError(res, `Route ${req.method} ${req.path} not found`, ErrorCode.NOT_FOUND, 404);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Global Error Handler
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
        logger.error('Unhandled error', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });

        // Don't expose internal errors in production
        const message = config.nodeEnv === 'production'
            ? 'An unexpected error occurred. Please try again later.'
            : err.message;

        sendError(res, message, ErrorCode.INTERNAL_ERROR, 500);
    });

    return app;
}

export default createApp;
