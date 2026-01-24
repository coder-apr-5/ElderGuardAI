// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Routine Scheduler Service
// Manages medication, meal, exercise reminders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import cron from 'node-cron';
import dayjs from 'dayjs';
import { Server as SocketIOServer } from 'socket.io';
import type { Routine, ElderProfile, ConversationContext, RoutineReminder } from './types';
import { generateProactiveMessage } from './ai-service';

interface ScheduledReminder {
    routineId: string;
    elderId: string;
    cronExpression: string;
    task: cron.ScheduledTask;
}

// Store active scheduled tasks
const scheduledReminders: Map<string, ScheduledReminder> = new Map();

// Mock routines for demonstration (in production, fetch from database)
const mockRoutines: Routine[] = [
    {
        id: 'routine-1',
        elderId: 'elder-demo',
        type: 'medication',
        title: 'Morning Medicine',
        description: 'Blood pressure and vitamins',
        time: '08:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        enabled: true,
        reminderMinutesBefore: 15,
        importance: 'critical',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'routine-2',
        elderId: 'elder-demo',
        type: 'meal',
        title: 'Lunch Time',
        description: 'Remember to have a nutritious lunch',
        time: '12:30',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        enabled: true,
        reminderMinutesBefore: 15,
        importance: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'routine-3',
        elderId: 'elder-demo',
        type: 'exercise',
        title: 'Afternoon Walk',
        description: '15-minute gentle walk',
        time: '17:00',
        days: ['mon', 'wed', 'fri'],
        enabled: true,
        reminderMinutesBefore: 15,
        importance: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'routine-4',
        elderId: 'elder-demo',
        type: 'medication',
        title: 'Evening Medicine',
        description: 'Nighttime medications',
        time: '20:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        enabled: true,
        reminderMinutesBefore: 15,
        importance: 'critical',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

// Map day names to cron format (0-6, Sunday = 0)
const dayToCron: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

/**
 * Convert routine to cron expression
 */
function routineToCron(routine: Routine): string {
    const [hour, minute] = routine.time.split(':').map(Number);

    // Subtract reminder minutes
    let reminderMinute = minute - routine.reminderMinutesBefore;
    let reminderHour = hour;

    if (reminderMinute < 0) {
        reminderMinute += 60;
        reminderHour -= 1;
        if (reminderHour < 0) reminderHour = 23;
    }

    // Convert days to cron format
    const cronDays = routine.days.map(d => dayToCron[d]).join(',');

    // Cron: minute hour * * days
    return `${reminderMinute} ${reminderHour} * * ${cronDays}`;
}

/**
 * Initialize routine scheduler for all elders
 */
export async function initializeRoutineScheduler(
    io: SocketIOServer,
    getElderProfile: (elderId: string) => Promise<ElderProfile | null>
): Promise<void> {
    console.log('🕐 Initializing routine scheduler...');

    // In production, fetch routines from database
    // For now, use mock data
    const routines = mockRoutines;

    for (const routine of routines) {
        if (!routine.enabled) continue;

        await scheduleRoutineReminder(routine, io, getElderProfile);
    }

    // Set up daily greeting cron job (9:00 AM)
    cron.schedule('0 9 * * *', async () => {
        console.log('☀️ Sending morning greetings...');
        await sendMorningGreetings(io, getElderProfile);
    });

    // Set up evening wind-down (8:00 PM)
    cron.schedule('0 20 * * *', async () => {
        console.log('🌙 Sending evening messages...');
        await sendEveningMessages(io, getElderProfile);
    });

    // Loneliness check every 2 hours during daytime (10 AM - 8 PM)
    cron.schedule('0 10,12,14,16,18 * * *', async () => {
        console.log('💝 Running loneliness check...');
        await runLonelinessCheck(io, getElderProfile);
    });

    console.log(`✅ Scheduled ${routines.length} routine reminders`);
}

/**
 * Schedule a single routine reminder
 */
async function scheduleRoutineReminder(
    routine: Routine,
    io: SocketIOServer,
    getElderProfile: (elderId: string) => Promise<ElderProfile | null>
): Promise<void> {
    const cronExpression = routineToCron(routine);
    const key = `${routine.elderId}:${routine.id}`;

    // Cancel existing if any
    cancelRoutineReminder(routine.id, routine.elderId);

    const task = cron.schedule(cronExpression, async () => {
        console.log(`⏰ Routine reminder triggered: ${routine.title} for elder ${routine.elderId}`);

        const profile = await getElderProfile(routine.elderId);
        if (!profile) return;

        const context: ConversationContext = {
            elderId: routine.elderId,
            elderProfile: profile,
            recentMessages: [],
            activeRoutines: [routine],
            pendingReminders: [],
        };

        // Generate AI reminder message
        const aiResponse = await generateProactiveMessage(context, 'routine_reminder', routine);

        // Create reminder object
        const reminder: RoutineReminder = {
            routine,
            reminderMessage: aiResponse.message,
            sentAt: new Date(),
            acknowledged: false,
        };

        // Send to elder's socket room
        io.to(`elder:${routine.elderId}`).emit('routine:reminder', reminder);
        io.to(`elder:${routine.elderId}`).emit('companion:proactive', {
            id: `reminder-${routine.id}-${Date.now()}`,
            elderId: routine.elderId,
            role: 'assistant',
            content: aiResponse.message,
            timestamp: new Date(),
            metadata: {
                routineRelated: true,
                routineId: routine.id,
                isProactive: true,
            },
        });

        console.log(`✅ Sent reminder for ${routine.title}`);
    });

    scheduledReminders.set(key, {
        routineId: routine.id,
        elderId: routine.elderId,
        cronExpression,
        task,
    });
}

/**
 * Cancel a scheduled routine reminder
 */
function cancelRoutineReminder(routineId: string, elderId: string): void {
    const key = `${elderId}:${routineId}`;
    const scheduled = scheduledReminders.get(key);

    if (scheduled) {
        scheduled.task.stop();
        scheduledReminders.delete(key);
    }
}

/**
 * Send morning greetings to all active elders
 */
async function sendMorningGreetings(
    io: SocketIOServer,
    getElderProfile: (elderId: string) => Promise<ElderProfile | null>
): Promise<void> {
    // In production, get list of active elders from database
    const activeElders = ['elder-demo'];

    for (const elderId of activeElders) {
        const profile = await getElderProfile(elderId);
        if (!profile) continue;

        const context: ConversationContext = {
            elderId,
            elderProfile: profile,
            recentMessages: [],
            activeRoutines: [],
            pendingReminders: [],
        };

        const aiResponse = await generateProactiveMessage(context, 'morning_greeting');

        io.to(`elder:${elderId}`).emit('companion:proactive', {
            id: `greeting-${Date.now()}`,
            elderId,
            role: 'assistant',
            content: aiResponse.message,
            timestamp: new Date(),
            metadata: { isProactive: true },
        });
    }
}

/**
 * Send evening wind-down messages
 */
async function sendEveningMessages(
    io: SocketIOServer,
    getElderProfile: (elderId: string) => Promise<ElderProfile | null>
): Promise<void> {
    const activeElders = ['elder-demo'];

    for (const elderId of activeElders) {
        const profile = await getElderProfile(elderId);
        if (!profile) continue;

        const context: ConversationContext = {
            elderId,
            elderProfile: profile,
            recentMessages: [],
            activeRoutines: [],
            pendingReminders: [],
        };

        const aiResponse = await generateProactiveMessage(context, 'evening_wind_down');

        io.to(`elder:${elderId}`).emit('companion:proactive', {
            id: `evening-${Date.now()}`,
            elderId,
            role: 'assistant',
            content: aiResponse.message,
            timestamp: new Date(),
            metadata: { isProactive: true },
        });
    }
}

/**
 * Check for potentially lonely elders and reach out
 */
async function runLonelinessCheck(
    io: SocketIOServer,
    getElderProfile: (elderId: string) => Promise<ElderProfile | null>
): Promise<void> {
    // In production, check:
    // 1. Last interaction time
    // 2. Detected mood from recent messages
    // 3. Time of day
    // 4. Any concerning patterns

    const activeElders = ['elder-demo'];

    for (const elderId of activeElders) {
        // For demo, just do random check-ins
        // In production, add real loneliness detection logic
        const shouldCheckIn = Math.random() > 0.7;

        if (!shouldCheckIn) continue;

        const profile = await getElderProfile(elderId);
        if (!profile) continue;

        const context: ConversationContext = {
            elderId,
            elderProfile: profile,
            recentMessages: [],
            activeRoutines: [],
            pendingReminders: [],
        };

        const aiResponse = await generateProactiveMessage(context, 'check_in');

        io.to(`elder:${elderId}`).emit('companion:proactive', {
            id: `checkin-${Date.now()}`,
            elderId,
            role: 'assistant',
            content: aiResponse.message,
            timestamp: new Date(),
            metadata: { isProactive: true },
        });
    }
}

/**
 * Get upcoming routines for an elder
 */
export function getUpcomingRoutines(elderId: string, withinMinutes: number = 60): Routine[] {
    const now = dayjs();
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.day()];

    return mockRoutines.filter(routine => {
        if (routine.elderId !== elderId || !routine.enabled) return false;
        if (!routine.days.includes(dayOfWeek as any)) return false;

        const [hour, minute] = routine.time.split(':').map(Number);
        const routineTime = now.hour(hour).minute(minute);
        const diffMinutes = routineTime.diff(now, 'minute');

        return diffMinutes > 0 && diffMinutes <= withinMinutes;
    });
}

/**
 * Add a new routine and schedule it
 */
export async function addRoutine(
    routine: Routine,
    io: SocketIOServer,
    getElderProfile: (elderId: string) => Promise<ElderProfile | null>
): Promise<void> {
    mockRoutines.push(routine);

    if (routine.enabled) {
        await scheduleRoutineReminder(routine, io, getElderProfile);
    }
}

/**
 * Get all routines for an elder
 */
export function getRoutinesForElder(elderId: string): Routine[] {
    return mockRoutines.filter(r => r.elderId === elderId);
}

export default {
    initializeRoutineScheduler,
    getUpcomingRoutines,
    addRoutine,
    getRoutinesForElder,
};
