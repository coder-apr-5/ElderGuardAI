// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ElderNest AI Chat Service - Main Server
// 24/7 Caring AI Companion for Elders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeAI } from './ai-service';
import { initializeChatHandler, getElderProfile } from './chat-handler';
import { initializeRoutineScheduler, getRoutinesForElder, getUpcomingRoutines } from './routine-scheduler';

const app = express();
const httpServer = createServer(app);

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',');

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REST API Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'ai-chat-service',
        companion: process.env.COMPANION_NAME || 'Mira',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Get routines for an elder
app.get('/api/routines/:elderId', async (req, res) => {
    try {
        const { elderId } = req.params;
        const routines = getRoutinesForElder(elderId);

        res.json({
            success: true,
            routines,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch routines',
        });
    }
});

// Get upcoming routines
app.get('/api/routines/:elderId/upcoming', async (req, res) => {
    try {
        const { elderId } = req.params;
        const minutes = parseInt(req.query.minutes as string) || 60;
        const routines = getUpcomingRoutines(elderId, minutes);

        res.json({
            success: true,
            routines,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch upcoming routines',
        });
    }
});

// Get elder profile
app.get('/api/elder/:elderId/profile', async (req, res) => {
    try {
        const { elderId } = req.params;
        const profile = await getElderProfile(elderId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        res.json({
            success: true,
            profile,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
        });
    }
});

// Companion info
app.get('/api/companion', (_req, res) => {
    res.json({
        success: true,
        companion: {
            name: process.env.COMPANION_NAME || 'Mira',
            description: 'Your caring AI companion, available 24/7',
            capabilities: [
                'Friendly conversation',
                'Medication reminders',
                'Meal time alerts',
                'Exercise encouragement',
                'Emotional support',
                'Memory games',
                'Story sharing',
            ],
            personality: [
                'Warm and caring',
                'Patient and understanding',
                'Encouraging but not pushy',
                'Respectful of your wisdom',
                'Always here to listen',
            ],
        },
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Server Startup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PORT = parseInt(process.env.PORT || '5001', 10);

async function startServer(): Promise<void> {
    console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏠 ElderNest AI Chat Service
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

    // Initialize AI service
    console.log('🤖 Initializing AI service...');
    initializeAI();

    // Initialize WebSocket chat handler
    console.log('💬 Initializing chat handler...');
    initializeChatHandler(io);

    // Initialize routine scheduler
    console.log('⏰ Initializing routine scheduler...');
    await initializeRoutineScheduler(io, getElderProfile);

    // Start HTTP server
    httpServer.listen(PORT, () => {
        console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Server started successfully!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  🌐 HTTP:      http://localhost:${PORT}
  🔌 WebSocket: ws://localhost:${PORT}
  💖 Companion: ${process.env.COMPANION_NAME || 'Mira'}
  
  Ready to care for elders 24/7! 💝
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    httpServer.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    httpServer.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
});

// Start the server
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
