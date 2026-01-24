// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OTP Service - Core OTP Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb, Collections } from '../config/firebase';
import { sendSMS, formatOTPMessage } from '../config/twilio';
import { logger, logSecurityEvent } from '../utils/logger';
import type { OTPDocument, OTPSendResult, OTPVerifyResult, OTPPurpose, OTPMetadata } from '../types';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateOTP(): string {
    // Generate a random number between 100000 and 999999
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0) % 900000 + 100000;
    return randomNumber.toString();
}

/**
 * Hash OTP for storage (we don't store plain OTPs)
 */
export function hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Get OTP expiry time (5 minutes from now)
 */
function getOTPExpiry(): Date {
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
    return new Date(Date.now() + expiryMinutes * 60 * 1000);
}

/**
 * Check rate limit for OTP requests
 */
async function checkRateLimit(phone: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const db = getDb();
    const rateLimitRef = db.collection(Collections.OTP_RATE_LIMITS).doc(phone);
    const rateDoc = await rateLimitRef.get();

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
    const windowMs = parseInt(process.env.OTP_RATE_LIMIT_WINDOW || '3600000', 10); // 1 hour
    const now = new Date();

    if (!rateDoc.exists) {
        // First request, create rate limit doc
        await rateLimitRef.set({
            phone,
            requestCount: 1,
            windowStart: Timestamp.fromDate(now),
            windowEnd: Timestamp.fromDate(new Date(now.getTime() + windowMs)),
            blocked: false,
        });
        return { allowed: true };
    }

    const rateData = rateDoc.data()!;
    const windowEnd = rateData.windowEnd.toDate();

    // Check if window has expired
    if (now > windowEnd) {
        // Reset the window
        await rateLimitRef.set({
            phone,
            requestCount: 1,
            windowStart: Timestamp.fromDate(now),
            windowEnd: Timestamp.fromDate(new Date(now.getTime() + windowMs)),
            blocked: false,
        });
        return { allowed: true };
    }

    // Check if blocked
    if (rateData.blocked) {
        const retryAfter = Math.ceil((windowEnd.getTime() - now.getTime()) / 1000);
        return { allowed: false, retryAfter };
    }

    // Check if limit reached
    if (rateData.requestCount >= maxAttempts) {
        await rateLimitRef.update({ blocked: true });
        const retryAfter = Math.ceil((windowEnd.getTime() - now.getTime()) / 1000);

        logSecurityEvent('OTP_RATE_LIMIT_EXCEEDED', { phone });

        return { allowed: false, retryAfter };
    }

    // Increment counter
    await rateLimitRef.update({
        requestCount: FieldValue.increment(1),
    });

    return { allowed: true };
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(
    phone: string,
    purpose: OTPPurpose,
    metadata: OTPMetadata = {},
    elderName?: string
): Promise<OTPSendResult> {
    // Check rate limit
    const rateCheck = await checkRateLimit(phone);
    if (!rateCheck.allowed) {
        return {
            success: false,
            message: `Too many OTP requests. Please try again in ${Math.ceil(rateCheck.retryAfter! / 60)} minutes.`,
            retryAfter: rateCheck.retryAfter,
        };
    }

    const db = getDb();
    const otp = generateOTP();
    const otpId = uuidv4();
    const now = new Date();
    const expiresAt = getOTPExpiry();

    // Store OTP (hashed)
    const otpDoc: OTPDocument = {
        id: otpId,
        phone,
        otp: hashOTP(otp),
        purpose,
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
        verified: false,
        attempts: 0,
        maxAttempts: 3,
        metadata: {
            ...metadata,
        },
    };

    await db.collection(Collections.OTPS).doc(otpId).set(otpDoc);

    // Send SMS
    const message = formatOTPMessage(otp, purpose, elderName);
    const smsResult = await sendSMS(phone, message);

    if (!smsResult.success) {
        // Delete the OTP doc if SMS failed
        await db.collection(Collections.OTPS).doc(otpId).delete();

        logger.error('Failed to send OTP SMS', { phone, error: smsResult.error });

        return {
            success: false,
            message: 'Failed to send verification code. Please try again.',
        };
    }

    logger.info('OTP sent successfully', { phone, purpose, otpId });

    return {
        success: true,
        message: 'Verification code sent successfully',
        otpId,
        expiresAt,
        remainingAttempts: 3,
    };
}

/**
 * Verify OTP
 */
export async function verifyOTP(
    phone: string,
    otp: string,
    purpose: OTPPurpose
): Promise<OTPVerifyResult> {
    const db = getDb();
    const now = new Date();

    // Find the latest unexpired, unverified OTP for this phone and purpose
    const otpsQuery = await db
        .collection(Collections.OTPS)
        .where('phone', '==', phone)
        .where('purpose', '==', purpose)
        .where('verified', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

    if (otpsQuery.empty) {
        return {
            success: false,
            message: 'No verification code found. Please request a new one.',
        };
    }

    const otpDoc = otpsQuery.docs[0];
    const otpData = otpDoc.data() as OTPDocument;

    // Check expiry
    if (otpData.expiresAt.toDate() < now) {
        return {
            success: false,
            message: 'Verification code has expired. Please request a new one.',
        };
    }

    // Check max attempts
    if (otpData.attempts >= otpData.maxAttempts) {
        logSecurityEvent('OTP_MAX_ATTEMPTS_EXCEEDED', { phone, otpId: otpData.id });

        return {
            success: false,
            message: 'Too many failed attempts. Please request a new code.',
            remainingAttempts: 0,
        };
    }

    // Verify OTP (compare hashes)
    const hashedInput = hashOTP(otp.trim());

    if (hashedInput !== otpData.otp) {
        // Increment attempts
        const newAttempts = otpData.attempts + 1;
        await otpDoc.ref.update({ attempts: newAttempts });

        const remainingAttempts = otpData.maxAttempts - newAttempts;

        logger.warn('OTP verification failed', { phone, attempts: newAttempts });

        return {
            success: false,
            message: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
            remainingAttempts,
        };
    }

    // Mark as verified
    await otpDoc.ref.update({
        verified: true,
        verifiedAt: Timestamp.fromDate(now),
    });

    logger.info('OTP verified successfully', { phone, purpose, otpId: otpData.id });

    return {
        success: true,
        message: 'Verification successful',
        otpId: otpData.id,
        phone,
        purpose,
    };
}

/**
 * Invalidate all OTPs for a phone number
 */
export async function invalidateOTPs(phone: string, purpose?: OTPPurpose): Promise<void> {
    const db = getDb();

    let query = db.collection(Collections.OTPS)
        .where('phone', '==', phone)
        .where('verified', '==', false);

    if (purpose) {
        query = query.where('purpose', '==', purpose);
    }

    const otps = await query.get();

    const batch = db.batch();
    otps.docs.forEach(doc => {
        batch.update(doc.ref, { verified: true });
    });

    await batch.commit();

    logger.info('OTPs invalidated', { phone, purpose, count: otps.size });
}

/**
 * Clean up expired OTPs (run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
    const db = getDb();
    const now = Timestamp.fromDate(new Date());

    const expiredOTPs = await db
        .collection(Collections.OTPS)
        .where('expiresAt', '<', now)
        .limit(500)
        .get();

    if (expiredOTPs.empty) {
        return 0;
    }

    const batch = db.batch();
    expiredOTPs.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info('Expired OTPs cleaned up', { count: expiredOTPs.size });

    return expiredOTPs.size;
}

export default {
    generateOTP,
    hashOTP,
    sendOTP,
    verifyOTP,
    invalidateOTPs,
    cleanupExpiredOTPs,
};
