// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// User Type Definitions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Timestamp } from 'firebase-admin/firestore';

/** User roles in the ElderNest system */
export type UserRole = 'elder' | 'family';

/** Authentication provider used */
export type AuthProvider = 'phone' | 'email' | 'google';

/** Account status */
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'locked';

/** Family relation types */
export type FamilyRelation = 'son' | 'daughter' | 'spouse' | 'caregiver' | 'sibling' | 'grandchild' | 'other';

/**
 * User document stored in Firestore
 */
export interface User {
    uid: string;
    role: UserRole;
    phone?: string;           // E.164 format
    email?: string;
    passwordHash?: string;    // Only for email auth
    fullName: string;
    age?: number;             // For elders
    dateOfBirth?: string;
    emergencyContact?: string;
    profilePicture?: string;

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLogin?: Timestamp;

    // Account status
    accountStatus: AccountStatus;
    lockedUntil?: Timestamp;
    failedLoginAttempts: number;

    // Relationships
    connectedElders?: string[];   // UIDs of connected elders (for family)
    connectedFamily?: string[];   // UIDs of connected family (for elders)

    // Auth metadata
    authProvider: AuthProvider;
    emailVerified: boolean;
    phoneVerified: boolean;

    // Google OAuth specific
    googleId?: string;

    // Preferences
    language?: string;
    timezone?: string;
    notificationsEnabled: boolean;
}

/**
 * Pending connection between elder and family
 */
export interface PendingConnection {
    id: string;
    elderPhone: string;         // E.164 format
    elderName: string;
    elderAge?: number;
    familyPhone: string;        // E.164 format
    familyRelation: FamilyRelation;
    otpId?: string;             // Reference to OTP document
    status: 'pending' | 'verified' | 'expired' | 'cancelled';
    createdAt: Timestamp;
    expiresAt: Timestamp;       // 24 hours from creation
    verifiedAt?: Timestamp;
    elderUid?: string;          // Set after elder account created
    familyUid?: string;         // Set after family verifies
}

/**
 * Signup request for elders
 */
export interface ElderSignupRequest {
    phone: string;
    countryCode: string;
    fullName: string;
    age: number;
    dateOfBirth?: string;
    emergencyContact?: string;
    familyPhone: string;
    familyCountryCode: string;
    familyRelation: FamilyRelation;
}

/**
 * Signup request for family members
 */
export interface FamilySignupRequest {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    countryCode?: string;
}

/**
 * Login request with phone
 */
export interface PhoneLoginRequest {
    phone: string;
    countryCode: string;
}

/**
 * Login request with email
 */
export interface EmailLoginRequest {
    email: string;
    password: string;
}

/**
 * Google OAuth login request
 */
export interface GoogleAuthRequest {
    idToken: string;
    role: UserRole;
}

/**
 * Auth response after successful login/signup
 */
export interface AuthResponse {
    success: boolean;
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
    uid: string;
    role: UserRole;
    phone?: string;
    email?: string;
    iat?: number;
    exp?: number;
}

/**
 * Refresh token document
 */
export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    revoked: boolean;
    userAgent?: string;
    ipAddress?: string;
}
