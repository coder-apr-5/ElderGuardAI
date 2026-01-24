// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email Service - Email Operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { getDb, Collections } from '../config/firebase';
import { validateEmail, normalizeEmail, quickValidateEmail } from '../utils/emailValidator';
import type { EmailValidationResult, User } from '../types';

/**
 * Validate email address
 */
export async function validateEmailAddress(email: string): Promise<EmailValidationResult> {
    return validateEmail(email);
}

/**
 * Quick email validation (syntax only)
 */
export function quickValidate(email: string): boolean {
    return quickValidateEmail(email);
}

/**
 * Normalize email for storage
 */
export function normalize(email: string): string {
    return normalizeEmail(email);
}

/**
 * Check if email is already registered
 */
export async function isEmailRegistered(email: string): Promise<boolean> {
    const db = getDb();
    const normalized = normalizeEmail(email);

    const usersQuery = await db
        .collection(Collections.USERS)
        .where('email', '==', normalized)
        .limit(1)
        .get();

    return !usersQuery.empty;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const db = getDb();
    const normalized = normalizeEmail(email);

    const usersQuery = await db
        .collection(Collections.USERS)
        .where('email', '==', normalized)
        .limit(1)
        .get();

    if (usersQuery.empty) {
        return null;
    }

    const doc = usersQuery.docs[0];
    return { uid: doc.id, ...doc.data() } as User;
}

/**
 * Mask email for privacy (show first 2 chars and domain)
 */
export function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***';

    const maskedLocal = local.length > 2
        ? local.substring(0, 2) + '***'
        : '***';

    return `${maskedLocal}@${domain}`;
}

export default {
    validateEmailAddress,
    quickValidate,
    normalize,
    isEmailRegistered,
    getUserByEmail,
    maskEmail,
};
