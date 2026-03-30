/**
 * Local Storage fallback for user profile data.
 * Used when Firestore is unavailable (e.g. no billing enabled).
 * Stores user profile data in localStorage so auth and protected routes still work.
 */

const USER_STORE_KEY = 'elderguard_user_profile';

export interface LocalUserData {
    uid: string;
    email: string;
    fullName: string;
    role: 'elder' | 'family';
    createdAt: string;
    lastActive: string;
    // Elder-specific
    age?: number;
    emergencyContact?: string;
    familyMembers?: string[];
    connectionCode?: string;
    profileSetupComplete?: boolean;
    // Family-specific
    phone?: string | null;
    relationship?: string;
    eldersConnected?: string[];
}

export const localUserStore = {
    save(userData: LocalUserData): void {
        try {
            localStorage.setItem(USER_STORE_KEY, JSON.stringify(userData));
            console.log('💾 User profile saved to localStorage');
        } catch (e) {
            console.error('Failed to save user to localStorage:', e);
        }
    },

    get(uid?: string): LocalUserData | null {
        try {
            const data = localStorage.getItem(USER_STORE_KEY);
            if (!data) return null;
            const parsed = JSON.parse(data) as LocalUserData;
            // If uid is provided, verify it matches
            if (uid && parsed.uid !== uid) return null;
            return parsed;
        } catch (e) {
            console.error('Failed to read user from localStorage:', e);
            return null;
        }
    },

    remove(): void {
        try {
            localStorage.removeItem(USER_STORE_KEY);
        } catch (e) {
            console.error('Failed to remove user from localStorage:', e);
        }
    },

    update(updates: Partial<LocalUserData>): void {
        try {
            const existing = this.get();
            if (existing) {
                this.save({ ...existing, ...updates, lastActive: new Date().toISOString() });
            }
        } catch (e) {
            console.error('Failed to update user in localStorage:', e);
        }
    }
};
