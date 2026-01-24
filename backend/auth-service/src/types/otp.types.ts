// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OTP Type Definitions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { firestore } from 'firebase-admin';

// Re-export Timestamp type for convenience
export type Timestamp = firestore.Timestamp;

/** Purpose of the OTP */
export type OTPPurpose = 'login' | 'signup' | 'family-verification' | 'password-reset';

/**
 * OTP document stored in Firestore
 */
export interface OTPDocument {
    id: string;
    phone: string;              // E.164 format
    otp: string;                // 6-digit code (hashed)
    purpose: OTPPurpose;
    createdAt: Timestamp;
    expiresAt: Timestamp;       // createdAt + 5 minutes
    verified: boolean;
    attempts: number;           // Failed verification attempts
    maxAttempts: number;        // Default 3
    metadata: OTPMetadata;
}

/**
 * Metadata for OTP tracking
 */
export interface OTPMetadata {
    userAgent?: string;
    ipAddress?: string;
    country?: string;
    pendingConnectionId?: string;  // For family verification
}

/**
 * OTP rate limit tracking
 */
export interface OTPRateLimit {
    phone: string;
    requestCount: number;
    windowStart: Timestamp;
    windowEnd: Timestamp;
    blocked: boolean;
    blockedUntil?: Timestamp;
}

/**
 * Result of OTP send operation
 */
export interface OTPSendResult {
    success: boolean;
    message: string;
    otpId?: string;
    expiresAt?: Date;
    remainingAttempts?: number;
    retryAfter?: number;        // Seconds until can retry
}

/**
 * Result of OTP verification
 */
export interface OTPVerifyResult {
    success: boolean;
    message: string;
    otpId?: string;
    remainingAttempts?: number;
    phone?: string;
    purpose?: OTPPurpose;
}

/**
 * Phone validation result
 */
export interface PhoneValidationResult {
    isValid: boolean;
    error?: string;
    e164Format?: string;        // +[country][number]
    nationalFormat?: string;    // (XXX) XXX-XXXX
    countryCode?: string;       // US, IN, etc.
    countryCallingCode?: string; // +1, +91, etc.
    isMobile?: boolean;
    carrier?: string;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
    isValid: boolean;
    error?: string;
    email?: string;
    isDisposable: boolean;
    hasMxRecord: boolean;
    isSyntaxValid: boolean;
    suggestion?: string;        // For typos like gmial.com -> gmail.com
}

/**
 * Country configuration for phone validation
 */
export interface CountryConfig {
    code: string;               // ISO 3166-1 alpha-2 (US, IN, GB)
    name: string;
    callingCode: string;        // +1, +91, +44
    phoneFormat: string;        // Display format
    minLength: number;
    maxLength: number;
    flag: string;               // Emoji flag
}
