// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ElderNest AI Mood Service - Server Entry Point
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { createApp } from './app';
import { config, validateConfig } from './config/env';
import { initializeGroq } from './config/groq';
import { initializeGemini } from './config/gemini';
import { logger } from './utils/logger';

/**
 * Start the server
 */
async function startServer(): Promise<void> {
    try {
        // Validate configuration
        validateConfig(config);

        // Initialize AI providers
        logger.info('Initializing AI providers...');

        if (config.aiProvider === 'groq' || config.groqApiKey) {
            initializeGroq();
        }

        if (config.aiProvider === 'gemini' || config.geminiApiKey) {
            initializeGemini();
        }

        // Create Express app
        const app = createApp();

        // Start server
        const server = app.listen(config.port, () => {
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info('🚀 ElderNest AI Mood Service Started');
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info(`📍 Environment: ${config.nodeEnv}`);
            logger.info(`🌐 Server: http://localhost:${config.port}`);
            logger.info(`🤖 AI Provider: ${config.aiProvider}`);
            logger.info(`❤️  Health: http://localhost:${config.port}/health`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info('');
            logger.info('API Endpoints:');
            logger.info(`  POST /api/chat           - AI conversation`);
            logger.info(`  GET  /api/chat/context/:userId - Get context`);
            logger.info(`  POST /api/analyze/sentiment    - Sentiment analysis`);
            logger.info(`  POST /api/analyze/mood         - Mood detection`);
            logger.info(`  POST /api/analyze/risk         - Risk calculation`);
            logger.info(`  POST /api/analyze/patterns     - Pattern analysis`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });

        // Graceful shutdown handling
        const gracefulShutdown = (signal: string) => {
            logger.info(`\n${signal} received. Shutting down gracefully...`);

            server.close(() => {
                logger.info('HTTP server closed.');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason: unknown) => {
            logger.error('Unhandled Rejection', { reason });
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
}

// Start the server
startServer();
