// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phone Service - Phone Number Operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { getDb, Collections } from '../config/firebase';
import { validatePhone, formatToE164, formatForDisplay, maskPhoneNumber, COUNTRY_CONFIGS, getSupportedCountries } from '../utils/phoneFormatter';
import type { PhoneValidationResult, User } from '../types';

/**
 * Validate and format phone number
 */
export function validatePhoneNumber(phoneNumber: string, countryCode?: string): PhoneValidationResult {
    return validatePhone(phoneNumber, countryCode);
}

/**
 * Check if phone number is already registered
 */
export async function isPhoneRegistered(e164Phone: string): Promise<boolean> {
    const db = getDb();

    const usersQuery = await db
        .collection(Collections.USERS)
        .where('phone', '==', e164Phone)
        .limit(1)
        .get();

    return !usersQuery.empty;
}

/**
 * Check if phone number has pending registration
 */
export async function hasPendingRegistration(e164Phone: string): Promise<boolean> {
    const db = getDb();
    const now = new Date();

    const pendingQuery = await db
        .collection(Collections.PENDING_CONNECTIONS)
        .where('elderPhone', '==', e164Phone)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

    if (pendingQuery.empty) {
        return false;
    }

    // Check if not expired
    const pending = pendingQuery.docs[0].data();
    return pending.expiresAt.toDate() > now;
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(e164Phone: string): Promise<User | null> {
    const db = getDb();

    const usersQuery = await db
        .collection(Collections.USERS)
        .where('phone', '==', e164Phone)
        .limit(1)
        .get();

    if (usersQuery.empty) {
        return null;
    }

    const doc = usersQuery.docs[0];
    return { uid: doc.id, ...doc.data() } as User;
}

/**
 * Format phone for storage (E.164)
 */
export { formatToE164 };

/**
 * Format phone for display
 */
export { formatForDisplay };

/**
 * Mask phone for privacy
 */
export { maskPhoneNumber };

/**
 * Get all supported countries with configs
 */
export function getAllCountries() {
    const supported = getSupportedCountries();
    return COUNTRY_CONFIGS.filter(c => supported.includes(c.code));
}

/**
 * Search countries by name or code
 */
export function searchCountries(query: string) {
    const normalizedQuery = query.toLowerCase().trim();
    const allCountries = getAllCountries();

    return allCountries.filter(country =>
        country.code.toLowerCase().includes(normalizedQuery) ||
        country.name.toLowerCase().includes(normalizedQuery) ||
        country.callingCode.includes(normalizedQuery)
    );
}

export default {
    validatePhoneNumber,
    isPhoneRegistered,
    hasPendingRegistration,
    getUserByPhone,
    formatToE164,
    formatForDisplay,
    maskPhoneNumber,
    getAllCountries,
    searchCountries,
};
