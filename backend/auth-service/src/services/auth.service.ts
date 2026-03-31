// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth Service - Main Authentication Logic
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb, getFirebaseAuth, Collections } from '../config/firebase';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpirySeconds, jwtConfig } from '../config/jwt';
import { sendOTP, verifyOTP } from './otp.service';
import { validatePhoneNumber, getUserByPhone } from './phone.service';
import { validateEmailAddress, isEmailRegistered, getUserByEmail, normalize as normalizeEmail } from './email.service';
import { createPendingConnection, verifyFamilyConnection, getPendingConnection } from './family-connection.service';
import { logger, logAuthEvent, logSecurityEvent } from '../utils/logger';
import type { User, UserRole, JWTPayload, FamilyRelation, AuthResponse } from '../types';
import admin from 'firebase-admin';
const { Timestamp, FieldValue } = admin.firestore;

const BCRYPT_ROUNDS = 12;

/**
 * Hash password with bcrypt
 */
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Create auth tokens for user
 */
function createAuthTokens(user: Partial<User>): { accessToken: string; refreshToken: string; expiresIn: number } {
    const payload: JWTPayload = {
        uid: user.uid!,
        role: user.role!,
        phone: user.phone,
        email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const expiresIn = getTokenExpirySeconds(jwtConfig.accessTokenExpiry);

    return { accessToken, refreshToken, expiresIn };
}

/**
 * Store refresh token
 */
async function storeRefreshToken(userId: string, token: string, metadata: { userAgent?: string; ipAddress?: string }): Promise<void> {
    const db = getDb();
    const id = uuidv4();

    const expiresIn = getTokenExpirySeconds(jwtConfig.refreshTokenExpiry);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await db.collection(Collections.REFRESH_TOKENS).doc(id).set({
        id,
        userId,
        token,
        createdAt: Timestamp.fromDate(new Date()),
        expiresAt: Timestamp.fromDate(expiresAt),
        revoked: false,
        ...metadata,
    });
}

/**
 * Check account lockout
 */
async function checkAccountLockout(userId: string): Promise<{ locked: boolean; unlockTime?: Date }> {
    const db = getDb();
    const userDoc = await db.collection(Collections.USERS).doc(userId).get();

    if (!userDoc.exists) {
        return { locked: false };
    }

    const userData = userDoc.data()!;

    if (userData.accountStatus === 'locked' && userData.lockedUntil) {
        const lockedUntil = userData.lockedUntil.toDate();
        if (lockedUntil > new Date()) {
            return { locked: true, unlockTime: lockedUntil };
        }

        // Unlock the account
        await userDoc.ref.update({
            accountStatus: 'active',
            failedLoginAttempts: 0,
            lockedUntil: FieldValue.delete(),
        });
    }

    return { locked: false };
}

/**
 * Record failed login attempt
 */
async function recordFailedLogin(userId: string): Promise<void> {
    const db = getDb();
    const userRef = db.collection(Collections.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const failedAttempts = (userData.failedLoginAttempts || 0) + 1;
    const maxAttempts = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);

    const updates: Record<string, unknown> = {
        failedLoginAttempts: failedAttempts,
    };

    if (failedAttempts >= maxAttempts) {
        const lockoutDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '1800000', 10); // 30 minutes
        updates.accountStatus = 'locked';
        updates.lockedUntil = Timestamp.fromDate(new Date(Date.now() + lockoutDuration));

        logSecurityEvent('ACCOUNT_LOCKED', { userId, failedAttempts });
    }

    await userRef.update(updates);
}

/**
 * Reset failed login attempts
 */
async function resetFailedLogins(userId: string): Promise<void> {
    const db = getDb();
    await db.collection(Collections.USERS).doc(userId).update({
        failedLoginAttempts: 0,
        lastLogin: Timestamp.fromDate(new Date()),
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Elder Signup (Controlled Flow)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Initiate family verification via email
 */
export async function initiateFamilyVerification(
    elderName: string,
    familyEmail: string,
    familyRelation: FamilyRelation,
    metadata: any = {}
): Promise<{ success: boolean; message: string; pendingId?: string }> {
    const result = await createPendingConnection(
        '', // No elder phone in initial step
        elderName,
        undefined,
        familyEmail,
        familyRelation,
        metadata
    );

    if (!result.success) {
        return { success: false, message: result.error || 'Failed to initiate verification' };
    }

    return {
        success: true,
        message: 'Verification code sent to family email',
        pendingId: result.pendingId,
    };
}

/**
 * Complete elder signup after family verification
 */
export async function completeElderSignup(
    pendingId: string,
    otp: string,
    elderData: any,
    metadata: any = {}
): Promise<AuthResponse | { success: boolean; message: string }> {
    const db = getDb();

    // 1. Verify family connection
    const verificationResult = await verifyFamilyConnection(pendingId, otp);
    if (!verificationResult.success) {
        return { success: false, message: verificationResult.error || 'Verification failed' };
    }

    // 2. Get pending connection details
    const pendingConnection = await getPendingConnection(pendingId);
    if (!pendingConnection) {
        return { success: false, message: 'Connection request not found' };
    }

    // 3. Create Firebase Auth user for the elder
    try {
        const authRef = getFirebaseAuth();
        const userRecord = await authRef.createUser({
            email: elderData.email,
            password: elderData.password,
            displayName: elderData.fullName,
        });

        // 4. Create User doc in Firestore
        const now = Timestamp.now();
        const user: any = {
            uid: userRecord.uid,
            role: 'elder',
            email: elderData.email,
            fullName: elderData.fullName,
            createdAt: now,
            updatedAt: now,
            lastLogin: now,
            accountStatus: 'active',
            failedLoginAttempts: 0,
            authProvider: 'email',
            emailVerified: false,
            phoneVerified: false,
            notificationsEnabled: true,
            connectedFamily: [],
        };

        // Add optional fields only if they exist (Firestore doesn't allow undefined)
        if (elderData.dateOfBirth) user.dateOfBirth = elderData.dateOfBirth;
        if (elderData.age) user.age = elderData.age;

        await db.collection(Collections.USERS).doc(userRecord.uid).set(user);

        // 5. Link family member if they are already registered
        const familyUser = await getUserByEmail(pendingConnection.familyEmail);
        if (familyUser) {
            // Need to link them
            await db.collection(Collections.USERS).doc(userRecord.uid).update({
                connectedFamily: admin.firestore.FieldValue.arrayUnion(familyUser.uid)
            });
            await db.collection(Collections.USERS).doc(familyUser.uid).update({
                connectedElders: admin.firestore.FieldValue.arrayUnion(userRecord.uid)
            });
        }

        // 6. Generate tokens
        const tokens = createAuthTokens(user);
        await storeRefreshToken(user.uid, tokens.refreshToken, metadata);

        // 7. Update pending connection status
        await db.collection(Collections.PENDING_CONNECTIONS).doc(pendingId).update({
            status: 'verified',
            elderUid: userRecord.uid,
            familyUid: familyUser?.uid,
        });

        logger.info('Elder signup completed successfully', { elderUid: userRecord.uid, familyEmail: pendingConnection.familyEmail });

        return {
            success: true,
            user: {
                uid: user.uid,
                role: user.role,
                email: user.email,
                fullName: user.fullName,
                accountStatus: user.accountStatus,
            },
            ...tokens
        };
    } catch (error: any) {
        logger.error('Error completing elder signup', { error });
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: 'This email is already registered' };
        }
        return { success: false, message: 'Failed to create account. Please try again later.' };
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Family Signup Flow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Family signup with email/password
 */
export async function familySignup(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    countryCode?: string,
    metadata: { userAgent?: string; ipAddress?: string } = {}
): Promise<AuthResponse & { success: boolean; message?: string }> {
    // Validate email
    const emailValidation = await validateEmailAddress(email);
    if (!emailValidation.isValid) {
        return { success: false, message: emailValidation.error, user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Check if email registered
    if (await isEmailRegistered(email)) {
        return { success: false, message: 'This email is already registered. Please login instead.', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Validate password strength
    if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Validate phone if provided
    let e164Phone: string | undefined;
    if (phone && countryCode) {
        const phoneValidation = validatePhoneNumber(phone, countryCode);
        if (!phoneValidation.isValid) {
            return { success: false, message: phoneValidation.error, user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
        }
        e164Phone = phoneValidation.e164Format;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create account
    const db = getDb();
    const familyUid = uuidv4();
    const now = new Date();

    const familyUser: User = {
        uid: familyUid,
        role: 'family',
        email: normalizeEmail(email),
        passwordHash,
        phone: e164Phone,
        fullName,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        lastLogin: Timestamp.fromDate(now),
        accountStatus: 'active',
        failedLoginAttempts: 0,
        connectedElders: [],
        authProvider: 'email',
        emailVerified: false,
        phoneVerified: false,
        notificationsEnabled: true,
    };

    await db.collection(Collections.USERS).doc(familyUid).set(familyUser);

    // Create auth tokens
    const tokens = createAuthTokens(familyUser);
    await storeRefreshToken(familyUid, tokens.refreshToken, metadata);

    logAuthEvent('FAMILY_ACCOUNT_CREATED', { uid: familyUid, email });

    return {
        success: true,
        user: {
            uid: familyUser.uid,
            role: familyUser.role,
            email: familyUser.email,
            fullName: familyUser.fullName,
            accountStatus: familyUser.accountStatus,
        },
        ...tokens,
    };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Login Flows
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Phone login - Step 1: Send OTP
 */
export async function phoneLoginStep1(
    phone: string,
    countryCode: string,
    metadata: { userAgent?: string; ipAddress?: string }
): Promise<{ success: boolean; message: string }> {
    const validation = validatePhoneNumber(phone, countryCode);
    if (!validation.isValid) {
        return { success: false, message: validation.error || 'Invalid phone number' };
    }

    const e164Phone = validation.e164Format!;

    // Check if registered
    const user = await getUserByPhone(e164Phone);
    if (!user) {
        return { success: false, message: 'No account found with this phone number' };
    }

    // Check lockout
    const lockout = await checkAccountLockout(user.uid);
    if (lockout.locked) {
        return { success: false, message: `Account is locked. Try again after ${lockout.unlockTime?.toLocaleTimeString()}` };
    }

    // Send OTP
    const otpResult = await sendOTP(e164Phone, 'login', metadata);

    if (!otpResult.success) {
        return { success: false, message: otpResult.message };
    }

    return { success: true, message: 'Verification code sent to your phone' };
}

/**
 * Phone login - Step 2: Verify OTP
 */
export async function phoneLoginStep2(
    phone: string,
    countryCode: string,
    otp: string,
    metadata: { userAgent?: string; ipAddress?: string }
): Promise<AuthResponse & { success: boolean; message?: string }> {
    const validation = validatePhoneNumber(phone, countryCode);
    if (!validation.isValid) {
        return { success: false, message: 'Invalid phone number', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    const e164Phone = validation.e164Format!;

    // Get user
    const user = await getUserByPhone(e164Phone);
    if (!user) {
        return { success: false, message: 'No account found', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Check lockout
    const lockout = await checkAccountLockout(user.uid);
    if (lockout.locked) {
        return { success: false, message: 'Account is locked', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Verify OTP
    const verifyResult = await verifyOTP(e164Phone, otp, 'login');

    if (!verifyResult.success) {
        await recordFailedLogin(user.uid);
        return { success: false, message: verifyResult.message, user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Reset failed attempts
    await resetFailedLogins(user.uid);

    // Create tokens
    const tokens = createAuthTokens(user);
    await storeRefreshToken(user.uid, tokens.refreshToken, metadata);

    logAuthEvent('PHONE_LOGIN_SUCCESS', { uid: user.uid, phone: e164Phone });

    return {
        success: true,
        user: {
            uid: user.uid,
            role: user.role,
            phone: user.phone,
            fullName: user.fullName,
            accountStatus: user.accountStatus,
        },
        ...tokens,
    };
}

/**
 * Email/password login
 */
export async function emailLogin(
    email: string,
    password: string,
    metadata: { userAgent?: string; ipAddress?: string }
): Promise<AuthResponse & { success: boolean; message?: string }> {
    const user = await getUserByEmail(email);

    if (!user) {
        return { success: false, message: 'Invalid email or password', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Check lockout
    const lockout = await checkAccountLockout(user.uid);
    if (lockout.locked) {
        return { success: false, message: 'Account is locked. Try again later.', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Verify password
    if (!user.passwordHash || !await verifyPassword(password, user.passwordHash)) {
        await recordFailedLogin(user.uid);
        return { success: false, message: 'Invalid email or password', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }

    // Reset failed attempts
    await resetFailedLogins(user.uid);

    // Create tokens
    const tokens = createAuthTokens(user);
    await storeRefreshToken(user.uid, tokens.refreshToken, metadata);

    logAuthEvent('EMAIL_LOGIN_SUCCESS', { uid: user.uid, email });

    return {
        success: true,
        user: {
            uid: user.uid,
            role: user.role,
            email: user.email,
            fullName: user.fullName,
            accountStatus: user.accountStatus,
        },
        ...tokens,
    };
}

/**
 * Google OAuth login/signup
 */
export async function googleAuth(
    idToken: string,
    role: UserRole,
    metadata: { userAgent?: string; ipAddress?: string }
): Promise<AuthResponse & { success: boolean; message?: string; isNewUser?: boolean }> {
    try {
        const auth = getFirebaseAuth();
        logger.info(`🔍 [GOOGLE_AUTH] Verifying ID token (Length: ${idToken?.length || 0})...`);
        const decodedToken = await auth.verifyIdToken(idToken);
        logger.info(`✅ [GOOGLE_AUTH] Token verified for: ${decodedToken.email}`);

        const { uid: googleUid, email, name, picture } = decodedToken;

        if (!email) {
            return { success: false, message: 'Email is required for Google login', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
        }

        const db = getDb();

        // Check if user exists by Google ID
        let userQuery = await db
            .collection(Collections.USERS)
            .where('googleId', '==', googleUid)
            .limit(1)
            .get();

        let user: Partial<User>;
        let isNewUser = false;

        if (userQuery.empty) {
            // Check by email
            userQuery = await db
                .collection(Collections.USERS)
                .where('email', '==', normalizeEmail(email))
                .limit(1)
                .get();

            if (userQuery.empty) {
                // Create new user
                isNewUser = true;
                const userUid = uuidv4();
                const now = new Date();

                const newUser: User = {
                    uid: userUid,
                    role,
                    email: normalizeEmail(email),
                    fullName: name || 'User',
                    profilePicture: picture,
                    googleId: googleUid,
                    createdAt: Timestamp.fromDate(now),
                    updatedAt: Timestamp.fromDate(now),
                    lastLogin: Timestamp.fromDate(now),
                    accountStatus: 'active',
                    failedLoginAttempts: 0,
                    connectedElders: role === 'family' ? [] : undefined,
                    connectedFamily: role === 'elder' ? [] : undefined,
                    authProvider: 'google',
                    emailVerified: true,
                    phoneVerified: false,
                    notificationsEnabled: true,
                };

                await db.collection(Collections.USERS).doc(userUid).set(newUser);
                user = newUser;

                logAuthEvent('GOOGLE_SIGNUP', { uid: userUid, email, role });
            } else {
                // Link Google to existing email account
                const existingUser = userQuery.docs[0];
                await existingUser.ref.update({
                    googleId: googleUid,
                    profilePicture: picture || existingUser.data().profilePicture,
                    emailVerified: true,
                    lastLogin: Timestamp.fromDate(new Date()),
                });

                user = { uid: existingUser.id, ...existingUser.data() };

                logAuthEvent('GOOGLE_LINKED', { uid: existingUser.id, email });
            }
        } else {
            // Existing user with Google
            const existingUser = userQuery.docs[0];
            await existingUser.ref.update({
                lastLogin: Timestamp.fromDate(new Date()),
            });

            user = { uid: existingUser.id, ...existingUser.data() };

            logAuthEvent('GOOGLE_LOGIN', { uid: existingUser.id, email });
        }

        // Create tokens
        const tokens = createAuthTokens(user);
        await storeRefreshToken(user.uid!, tokens.refreshToken, metadata);

        return {
            success: true,
            isNewUser,
            user: {
                uid: user.uid,
                role: user.role,
                email: user.email,
                fullName: user.fullName,
                profilePicture: user.profilePicture,
                accountStatus: user.accountStatus,
            },
            ...tokens,
        };
    } catch (error: any) {
        logger.error('Google auth error', { 
            message: error?.message, 
            stack: error?.stack,
            code: error?.code
        });
        return { success: false, message: 'Failed to authenticate with Google', user: {}, accessToken: '', refreshToken: '', expiresIn: 0 };
    }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<{ success: boolean; accessToken?: string; expiresIn?: number; message?: string }> {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
        return { success: false, message: 'Invalid refresh token' };
    }

    const db = getDb();

    // Check if refresh token exists and not revoked
    const tokenQuery = await db
        .collection(Collections.REFRESH_TOKENS)
        .where('userId', '==', decoded.uid)
        .where('token', '==', refreshToken)
        .where('revoked', '==', false)
        .limit(1)
        .get();

    if (tokenQuery.empty) {
        return { success: false, message: 'Refresh token not found or revoked' };
    }

    const tokenDoc = tokenQuery.docs[0];
    const tokenData = tokenDoc.data();

    // Check expiry
    if (tokenData.expiresAt.toDate() < new Date()) {
        await tokenDoc.ref.update({ revoked: true });
        return { success: false, message: 'Refresh token expired' };
    }

    // Get user
    const userDoc = await db.collection(Collections.USERS).doc(decoded.uid).get();
    if (!userDoc.exists) {
        return { success: false, message: 'User not found' };
    }

    const user = userDoc.data() as User;

    // Generate new access token
    const payload: JWTPayload = {
        uid: user.uid,
        role: user.role,
        phone: user.phone,
        email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const expiresIn = getTokenExpirySeconds(jwtConfig.accessTokenExpiry);

    return { success: true, accessToken, expiresIn };
}

/**
 * Logout - Revoke refresh token
 */
export async function logout(userId: string, refreshToken?: string): Promise<void> {
    const db = getDb();

    if (refreshToken) {
        // Revoke specific token
        const tokenQuery = await db
            .collection(Collections.REFRESH_TOKENS)
            .where('userId', '==', userId)
            .where('token', '==', refreshToken)
            .get();

        const batch = db.batch();
        tokenQuery.docs.forEach(doc => {
            batch.update(doc.ref, { revoked: true });
        });
        await batch.commit();
    } else {
        // Revoke all tokens for user
        const tokensQuery = await db
            .collection(Collections.REFRESH_TOKENS)
            .where('userId', '==', userId)
            .where('revoked', '==', false)
            .get();

        const batch = db.batch();
        tokensQuery.docs.forEach(doc => {
            batch.update(doc.ref, { revoked: true });
        });
        await batch.commit();
    }

    logAuthEvent('LOGOUT', { userId });
}

export default {
    // Elder signup
    initiateFamilyVerification,
    completeElderSignup,
    // Family signup
    familySignup,
    // Login
    phoneLoginStep1,
    phoneLoginStep2,
    emailLogin,
    googleAuth,
    // Token management
    refreshAccessToken,
    logout,
};
