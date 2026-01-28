/**
 * ElderNest AI - Auth Controller
 * Handles authentication flows for Elders and Family members.
 * Includes MOCK implementation for development without Firebase credentials.
 */

import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/responses';
import { logger } from '../utils/logger';
// import { collections } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

// Helper to check if we should use mock auth
const shouldUseMockAuth = () => {
    return config.isDevelopment;
};

// Helper to generate mock token
// Returns a token that our modified auth middleware will accept
const generateMockToken = (user: { uid: string, role: string, email?: string, phone?: string }) => {
    const payload = JSON.stringify(user);
    return `mock_${Buffer.from(payload).toString('base64')}`;
};

// In-memory store for OTPs and Pending Connections (For Mock Mode)
const mockOtpStore: Record<string, string> = {}; // phone -> otp
const mockPendingConnections: Record<string, any> = {}; // connectionId -> data

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Elder Auth Flow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const elderSignupStep1 = async (req: Request, res: Response) => {
    try {
        const { phone, countryCode } = req.body;
        if (!phone) return sendError(res, 'Phone number is required');

        logger.info(`[Auth] Elder Signup Step 1 for ${phone}`);

        if (shouldUseMockAuth()) {
            // Generate mock OTP
            const otp = '123456';
            mockOtpStore[`${countryCode}${phone}`] = otp;
            logger.info(`[MockAuth] Generated OTP for ${phone}: ${otp}`);

            return sendSuccess(res, {
                message: 'OTP sent successfully (Mock: Use 123456)',
                devMessage: 'Mock Mode: OTP is 123456'
            });
        }

        // Real implementation would use SMS provider here
        // Since we don't have one configured, we error out or fallback
        return sendError(res, 'SMS Provider not configured. Please use Mock Mode in development.');
    } catch (error) {
        logger.error('Elder Signup Step 1 Error:', error);
        return sendError(res, 'Failed to process request');
    }
};

export const elderSignupStep2 = async (req: Request, res: Response) => {
    try {
        const { phone, countryCode, otp } = req.body;
        const fullPhone = `${countryCode}${phone}`;

        logger.info(`[Auth] Elder Signup Step 2 for ${fullPhone} with OTP ${otp}`);

        if (shouldUseMockAuth()) {
            const storedOtp = mockOtpStore[fullPhone];
            if (storedOtp === otp || otp === '123456') {
                // Generate a temporary verification token for the next step
                // In a real app, this might be a signed JWT or session ID
                const verificationToken = `verif_${uuidv4()}`;

                return sendSuccess(res, {
                    verificationToken,
                    message: 'Phone verified successfully'
                });
            } else {
                return sendError(res, 'Invalid OTP');
            }
        }

        return sendError(res, 'Not implemented for production yet.');
    } catch (error) {
        logger.error('Elder Signup Step 2 Error:', error);
        return sendError(res, 'Verification failed');
    }
};

export const elderSignupStep3 = async (req: Request, res: Response) => {
    try {
        const { phone, fullName, age, familyPhone, verificationToken } = req.body;

        // Validate verificationToken (skipped for mock)
        if (!verificationToken) return sendError(res, 'Verification token required');

        logger.info(`[Auth] Elder Signup Step 3 for ${fullName}`);

        if (shouldUseMockAuth()) {
            // Generate pending connection ID
            const pendingConnectionId = `pending_${uuidv4()}`;

            // Store data for next step
            mockPendingConnections[pendingConnectionId] = {
                elderPhone: phone,
                elderName: fullName,
                elderAge: age,
                familyPhone: familyPhone,
                status: 'pending_family_verification'
            };

            // Mock sending OTP to family
            logger.info(`[MockAuth] Sending Family OTP to ${familyPhone}: 123456`);

            return sendSuccess(res, {
                pendingConnectionId,
                familyPhoneDisplay: familyPhone,
                message: 'Verification code sent to family member (Mock: 123456)'
            });
        }

        return sendError(res, 'Not implemented for production.');
    } catch (error) {
        logger.error('Elder Signup Step 3 Error:', error);
        return sendError(res, 'Failed to process details');
    }
};

export const elderSignupStep4 = async (req: Request, res: Response) => {
    try {
        const { pendingConnectionId, otp } = req.body;

        if (shouldUseMockAuth()) {
            const pendingData = mockPendingConnections[pendingConnectionId];
            if (!pendingData) return sendError(res, 'Invalid or expired connection request');

            if (otp !== '123456') return sendError(res, 'Invalid OTP');

            // Create user (Mock)
            const uid = `elder_${uuidv4()}`;
            const user = {
                uid,
                role: 'elder',
                phone: pendingData.elderPhone,
                fullName: pendingData.elderName,
                age: pendingData.elderAge,
                accountStatus: 'active',
                connectedFamily: [pendingData.familyPhone]
            };

            // In real app, save to Firestore
            // await collections.users.doc(uid).set(user);

            const accessToken = generateMockToken(user);
            const refreshToken = `refresh_${uid}`;

            return sendSuccess(res, {
                user,
                accessToken,
                refreshToken,
                expiresIn: 3600,
                message: 'Account created successfully!'
            });
        }

        return sendError(res, 'Not implemented for production.');
    } catch (error) {
        logger.error('Elder Signup Step 4 Error:', error);
        return sendError(res, 'Verification failed');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Login Flow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const phoneLoginStep1 = async (req: Request, res: Response) => {
    try {
        const { phone, countryCode: _countryCode } = req.body;
        logger.info(`[Auth] Login Step 1 for ${phone}`);

        if (shouldUseMockAuth()) {
            // Mock OTP
            return sendSuccess(res, {
                message: 'OTP sent (Mock: 123456)',
                devMessage: 'Use 123456'
            });
        }

        return sendError(res, 'Not implemented');
    } catch (e) {
        return sendError(res, 'Login failed');
    }
};

export const phoneLoginStep2 = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;

        if (shouldUseMockAuth()) {
            if (otp !== '123456') return sendError(res, 'Invalid OTP');

            const uid = `mock_user_${phone}`;
            const user = {
                uid,
                role: 'elder', // Default to elder for phone login in mock
                phone,
                fullName: 'Mock User',
                accountStatus: 'active'
            };

            const accessToken = generateMockToken(user);

            return sendSuccess(res, {
                user,
                accessToken,
                refreshToken: `refresh_${uid}`,
                expiresIn: 3600
            });
        }

        return sendError(res, 'Not implemented');
    } catch (e) {
        return sendError(res, 'Verification failed');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Family Auth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const familySignup = async (req: Request, res: Response) => {
    try {
        const { email, password: _password, fullName } = req.body;

        if (shouldUseMockAuth()) {
            const uid = `family_${uuidv4()}`;
            const user = {
                uid,
                role: 'family',
                email,
                fullName,
                accountStatus: 'active'
            };

            const accessToken = generateMockToken(user);

            return sendSuccess(res, {
                user,
                accessToken,
                refreshToken: `refresh_${uid}`,
                expiresIn: 3600
            });
        }
        return sendError(res, 'Not implemented');
    } catch (e) {
        return sendError(res, 'Signup failed');
    }
};
