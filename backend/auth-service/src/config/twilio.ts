// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Twilio SMS Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import twilio from 'twilio';
import { logger } from '../utils/logger';

let twilioClient: twilio.Twilio | null = null;

/**
 * Initialize Twilio client
 */
export function initializeTwilio(): twilio.Twilio | null {
    if (twilioClient) {
        return twilioClient;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
        logger.warn('Twilio credentials not configured. SMS functionality will be disabled.');
        return null;
    }

    try {
        twilioClient = twilio(accountSid, authToken);
        logger.info('Twilio client initialized successfully');
        return twilioClient;
    } catch (error) {
        logger.error('Failed to initialize Twilio', { error });
        return null;
    }
}

/**
 * Get Twilio client instance
 */
export function getTwilioClient(): twilio.Twilio | null {
    if (!twilioClient) {
        return initializeTwilio();
    }
    return twilioClient;
}

/**
 * Get Twilio phone number for sending SMS
 */
export function getTwilioPhoneNumber(): string {
    return process.env.TWILIO_PHONE_NUMBER || '';
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const client = getTwilioClient();
    const from = getTwilioPhoneNumber();

    if (!client || !from) {
        // In development, log the message instead of sending
        if (process.env.NODE_ENV === 'development') {
            logger.info('📱 SMS (DEV MODE - not sent)', { to, body });
            return { success: true, messageId: 'dev-mode-' + Date.now() };
        }
        return { success: false, error: 'SMS service not configured' };
    }

    try {
        const message = await client.messages.create({
            body,
            from,
            to,
        });

        logger.info('SMS sent successfully', {
            to,
            messageId: message.sid,
            status: message.status
        });

        return { success: true, messageId: message.sid };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to send SMS', { to, error: errorMessage });
        return { success: false, error: errorMessage };
    }
}

/**
 * Format OTP message for different purposes
 */
export function formatOTPMessage(otp: string, purpose: string, elderName?: string): string {
    switch (purpose) {
        case 'login':
            return `Your ElderNest login code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;

        case 'signup':
            return `Welcome to ElderNest! Your verification code is: ${otp}. This code expires in 5 minutes.`;

        case 'family-verification':
            return `Your family member${elderName ? ` (${elderName})` : ''} is signing up for ElderNest and needs your verification. Code: ${otp}. Expires in 5 minutes.`;

        case 'password-reset':
            return `Your ElderNest password reset code is: ${otp}. This code expires in 5 minutes. If you didn't request this, please ignore.`;

        default:
            return `Your ElderNest verification code is: ${otp}. This code expires in 5 minutes.`;
    }
}

export default {
    initializeTwilio,
    getTwilioClient,
    getTwilioPhoneNumber,
    sendSMS,
    formatOTPMessage,
};
