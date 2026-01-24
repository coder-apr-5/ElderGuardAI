/**
 * ElderNest AI - Express Application Setup
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import chatRoutes from './routes/chat.routes';
import elderRoutes from './routes/elder.routes';
import familyRoutes from './routes/family.routes';
import healthRoutes from './routes/health.routes';

// Create Express app
const app: Application = express();

// ━━━ SECURITY MIDDLEWARE ━━━
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ━━━ CORS CONFIGURATION ━━━
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (config.security.allowedOrigins.includes(origin) || config.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ━━━ COMPRESSION ━━━
app.use(compression());

// ━━━ BODY PARSING ━━━
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ━━━ RATE LIMITING ━━━
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ━━━ REQUEST LOGGING ━━━
app.use((req: Request, _res: Response, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// ━━━ SWAGGER DOCUMENTATION ━━━
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ElderNest AI API',
      version: '1.0.0',
      description: 'Backend API for ElderNest AI - Elderly Care Platform',
    },
    servers: [
      { url: `http://localhost:${config.server.port}/api/v1`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ━━━ HEALTH CHECK ━━━
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ElderNest API is running',
    version: config.server.apiVersion,
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// ━━━ API ROUTES ━━━
const apiPrefix = `/api/${config.server.apiVersion}`;

app.use(`${apiPrefix}/chat`, chatRoutes);
app.use(`${apiPrefix}/elder`, elderRoutes);
app.use(`${apiPrefix}/family`, familyRoutes);
app.use(`${apiPrefix}/health`, healthRoutes);

// ━━━ ROOT ENDPOINT ━━━
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'ElderNest AI API',
    version: '1.0.0',
    description: 'Backend API for ElderNest AI elderly care platform',
    docs: '/api-docs',
    health: '/health',
    api: `/api/${config.server.apiVersion}`,
  });
});

// ━━━ ERROR HANDLING ━━━
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
