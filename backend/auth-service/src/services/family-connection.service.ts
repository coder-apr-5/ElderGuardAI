// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Family Connection Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { v4 as uuidv4 } from 'uuid';
import { getDb, Collections } from '../config/firebase';
import { sendOTP, verifyOTP } from './otp.service';
import { validatePhoneNumber, isPhoneRegistered } from './phone.service';
import { logger } from '../utils/logger';
import type { PendingConnection, FamilyRelation, OTPMetadata } from '../types';
import admin from 'firebase-admin';
const { Timestamp, FieldValue } = admin.firestore;

/**
 * Create a pending connection for elder signup
 */
export async function createPendingConnection(
    elderPhone: string,
    elderName: string,
    elderAge: number | undefined,
    familyPhone: string,
    familyRelation: FamilyRelation,
    metadata: OTPMetadata = {}
): Promise<{ success: boolean; pendingId?: string; error?: string }> {
    const db = getDb();

    // Validate elder phone (should already be validated, but double-check)
    const elderValidation = validatePhoneNumber(elderPhone);
    if (!elderValidation.isValid) {
        return { success: false, error: 'Invalid elder phone number' };
    }

    // Validate family phone
    const familyValidation = validatePhoneNumber(familyPhone);
    if (!familyValidation.isValid) {
        return { success: false, error: familyValidation.error || 'Invalid family phone number' };
    }

    const elderE164 = elderValidation.e164Format!;
    const familyE164 = familyValidation.e164Format!;

    // Cannot be same number
    if (elderE164 === familyE164) {
        return { success: false, error: 'Elder and family phone numbers must be different' };
    }

    // Check if elder already registered
    if (await isPhoneRegistered(elderE164)) {
        return { success: false, error: 'This elder is already registered' };
    }

    // Check for existing pending connection
    const existingPending = await db
        .collection(Collections.PENDING_CONNECTIONS)
        .where('elderPhone', '==', elderE164)
        .where('status', '==', 'pending')
        .get();

    // Cancel any existing pending connections
    const batch = db.batch();
    existingPending.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'cancelled' });
    });
    await batch.commit();

    // Create new pending connection
    const pendingId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const pendingConnection: PendingConnection = {
        id: pendingId,
        elderPhone: elderE164,
        elderName,
        elderAge,
        familyPhone: familyE164,
        familyRelation,
        status: 'pending',
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
    };

    await db.collection(Collections.PENDING_CONNECTIONS).doc(pendingId).set(pendingConnection);

    // Send OTP to family member
    const otpResult = await sendOTP(familyE164, 'family-verification', {
        ...metadata,
        pendingConnectionId: pendingId,
    }, elderName);

    if (!otpResult.success) {
        // Mark as failed
        await db.collection(Collections.PENDING_CONNECTIONS).doc(pendingId).update({
            status: 'cancelled',
        });
        return { success: false, error: otpResult.message };
    }

    logger.info('Pending connection created', { pendingId, elderPhone: elderE164, familyPhone: familyE164 });

    return { success: true, pendingId };
}

/**
 * Verify family member and complete connection
 */
export async function verifyFamilyConnection(
    pendingId: string,
    otp: string
): Promise<{ success: boolean; error?: string; elderUid?: string }> {
    const db = getDb();

    // Get pending connection
    const pendingRef = db.collection(Collections.PENDING_CONNECTIONS).doc(pendingId);
    const pendingDoc = await pendingRef.get();

    if (!pendingDoc.exists) {
        return { success: false, error: 'Connection request not found' };
    }

    const pending = pendingDoc.data() as PendingConnection;

    // Check status
    if (pending.status !== 'pending') {
        return { success: false, error: 'This connection request is no longer valid' };
    }

    // Check expiry
    if (pending.expiresAt.toDate() < new Date()) {
        await pendingRef.update({ status: 'expired' });
        return { success: false, error: 'This connection request has expired' };
    }

    // Verify OTP
    const otpResult = await verifyOTP(pending.familyPhone, otp, 'family-verification');

    if (!otpResult.success) {
        return { success: false, error: otpResult.message };
    }

    // Mark as verified
    await pendingRef.update({
        status: 'verified',
        verifiedAt: Timestamp.fromDate(new Date()),
        otpId: otpResult.otpId,
    });

    logger.info('Family connection verified', { pendingId });

    return { success: true };
}

/**
 * Get pending connection by ID
 */
export async function getPendingConnection(pendingId: string): Promise<PendingConnection | null> {
    const db = getDb();
    const doc = await db.collection(Collections.PENDING_CONNECTIONS).doc(pendingId).get();

    if (!doc.exists) {
        return null;
    }

    return doc.data() as PendingConnection;
}

/**
 * Get pending connections for a family phone
 */
export async function getPendingConnectionsForFamily(familyPhone: string): Promise<PendingConnection[]> {
    const db = getDb();
    const now = new Date();

    const query = await db
        .collection(Collections.PENDING_CONNECTIONS)
        .where('familyPhone', '==', familyPhone)
        .where('status', '==', 'pending')
        .get();

    return query.docs
        .map(doc => doc.data() as PendingConnection)
        .filter(p => p.expiresAt.toDate() > now);
}

/**
 * Link elder and family accounts after verification
 */
export async function linkAccounts(elderUid: string, familyUid: string): Promise<void> {
    const db = getDb();

    const elderRef = db.collection(Collections.USERS).doc(elderUid);
    const familyRef = db.collection(Collections.USERS).doc(familyUid);

    // Add to each other's connected lists
    await db.runTransaction(async (transaction) => {
        transaction.update(elderRef, {
            connectedFamily: FieldValue.arrayUnion(familyUid),
        });

        transaction.update(familyRef, {
            connectedElders: FieldValue.arrayUnion(elderUid),
        });
    });

    logger.info('Accounts linked', { elderUid, familyUid });
}

/**
 * Get connected elders for a family member
 */
export async function getConnectedElders(familyUid: string) {
    const db = getDb();

    const familyDoc = await db.collection(Collections.USERS).doc(familyUid).get();
    if (!familyDoc.exists) {
        return [];
    }

    const familyData = familyDoc.data()!;
    const elderUids = familyData.connectedElders || [];

    if (elderUids.length === 0) {
        return [];
    }

    const elders = await Promise.all(
        elderUids.map(async (uid: string) => {
            const elderDoc = await db.collection(Collections.USERS).doc(uid).get();
            if (!elderDoc.exists) return null;
            return { uid, ...elderDoc.data() };
        })
    );

    return elders.filter(Boolean);
}

/**
 * Get connected family for an elder
 */
export async function getConnectedFamily(elderUid: string) {
    const db = getDb();

    const elderDoc = await db.collection(Collections.USERS).doc(elderUid).get();
    if (!elderDoc.exists) {
        return [];
    }

    const elderData = elderDoc.data()!;
    const familyUids = elderData.connectedFamily || [];

    if (familyUids.length === 0) {
        return [];
    }

    const family = await Promise.all(
        familyUids.map(async (uid: string) => {
            const familyDoc = await db.collection(Collections.USERS).doc(uid).get();
            if (!familyDoc.exists) return null;
            return { uid, ...familyDoc.data() };
        })
    );

    return family.filter(Boolean);
}

export default {
    createPendingConnection,
    verifyFamilyConnection,
    getPendingConnection,
    getPendingConnectionsForFamily,
    linkAccounts,
    getConnectedElders,
    getConnectedFamily,
};
