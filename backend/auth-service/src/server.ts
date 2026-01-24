// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ElderNest Auth Service - Server Entry Point
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initializeFirebase } from './config/firebase';
import { initializeTwilio } from './config/twilio';
import { logger } from './utils/logger';
import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import connectionRoutes from './routes/connection.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Middleware
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// General rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent']?.slice(0, 50),
  });
  next();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'eldernest-auth',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);

// Countries route (alias)
app.use('/api', connectionRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'INTERNAL_ERROR',
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Initialize and Start Server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startServer() {
  try {
    // Initialize Firebase
    logger.info('Initializing Firebase...');
    initializeFirebase();

    // Initialize Twilio
    logger.info('Initializing Twilio...');
    initializeTwilio();

    // Start server
    app.listen(PORT, () => {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('🔐 ElderNest Auth Service Started');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Server: http://localhost:${PORT}`);
      logger.info(`❤️  Health: http://localhost:${PORT}/health`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('');
      logger.info('Auth Endpoints:');
      logger.info('  POST /api/auth/elder/signup/step1-4  - Elder signup flow');
      logger.info('  POST /api/auth/family/signup         - Family signup');
      logger.info('  POST /api/auth/login/phone           - Phone login (OTP)');
      logger.info('  POST /api/auth/login/email           - Email login');
      logger.info('  POST /api/auth/login/google          - Google OAuth');
      logger.info('  POST /api/auth/refresh               - Refresh token');
      logger.info('  POST /api/auth/logout                - Logout');
      logger.info('  GET  /api/auth/me                    - Current user');
      logger.info('');
      logger.info('Connection Endpoints:');
      logger.info('  GET  /api/connections/elders         - Get connected elders');
      logger.info('  GET  /api/connections/family         - Get connected family');
      logger.info('  GET  /api/countries                  - Get supported countries');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down...');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server', error instanceof Error ? { message: error.message, stack: error.stack } : { error });
    process.exit(1);
  }
}

startServer();
