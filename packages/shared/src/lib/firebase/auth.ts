import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    arrayUnion
} from 'firebase/firestore';
import { auth, db } from './config';
export { auth, db };
import { ElderUser, FamilyUser } from '../../types/user';
import { localUserStore } from './localUserStore';
export { localUserStore };

// --- Firestore helper: try Firestore, fall back to localStorage ---

const saveUserToFirestoreOrLocal = async (uid: string, userData: any): Promise<void> => {
    try {
        await setDoc(doc(db, 'users', uid), userData);
        console.log('✅ User saved to Firestore');
    } catch (e: any) {
        console.warn('⚠️ Firestore unavailable, saving to localStorage instead:', e?.code || e?.message);
    }
    // Always save to localStorage as backup
    localUserStore.save({
        ...userData,
        uid,
        createdAt: userData.createdAt?.toDate?.() ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
        lastActive: new Date().toISOString(),
    });
};

const getUserData = async (uid: string): Promise<any | null> => {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            // Also update localStorage cache
            localUserStore.save({ ...data, uid } as any);
            return data;
        }
    } catch (e: any) {
        console.warn('⚠️ Firestore unavailable, reading from localStorage:', e?.code || e?.message);
    }
    // Fall back to localStorage
    return localUserStore.get(uid);
};

// --- Auth Utilities ---

export const mapFirebaseUserToUser = async (firebaseUser: User | null): Promise<ElderUser | FamilyUser | null> => {
    if (!firebaseUser) return null;
    const data = await getUserData(firebaseUser.uid);
    return data as ElderUser | FamilyUser | null;
};

// --- Sign Up ---

export const signUpElder = async (data: any) => {
    try {
        const { email, password, fullName, dateOfBirth, emergencyContact, connectionCode: _connectionCode } = data;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: fullName });

        const myConnectionCode = Math.floor(100000 + Math.random() * 900000).toString();

        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        const elderData = {
            uid: user.uid,
            email,
            fullName,
            age,
            emergencyContact,
            familyMembers: [],
            connectionCode: myConnectionCode,
            profileSetupComplete: false,
            role: 'elder' as const,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
        };

        await saveUserToFirestoreOrLocal(user.uid, elderData);
        return user;
    } catch (error: any) {
        throw new Error(getFriendlyErrorMessage(error));
    }
};

export const signUpFamily = async (data: any) => {
    try {
        const { email, password, fullName, phone, relationship, connectionCode } = data;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: fullName });

        let eldersConnected: string[] = [];

        // Link Elder Logic (best-effort)
        if (connectionCode) {
            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where("connectionCode", "==", connectionCode), where("role", "==", "elder"));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const elderDoc = querySnapshot.docs[0];
                    const elderId = elderDoc.id;
                    eldersConnected.push(elderId);

                    await updateDoc(doc(db, 'users', elderId), {
                        familyMembers: arrayUnion(user.uid)
                    });
                }
            } catch (e) {
                console.warn("⚠️ Failed to link elder during signup (Firestore may be unavailable):", e);
            }
        }

        const familyData = {
            uid: user.uid,
            email,
            fullName,
            phone: phone || null,
            relationship: relationship || 'family',
            eldersConnected: eldersConnected,
            role: 'family' as const,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        };

        await saveUserToFirestoreOrLocal(user.uid, familyData);
        return user;
    } catch (error: any) {
        throw new Error(getFriendlyErrorMessage(error));
    }
};

// --- Sign In ---

export const signInWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Update profile in Firestore (best-effort)
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
                const data = snap.data();
                const isElder = data.role === 'elder';
                
                const updates: any = { lastActive: serverTimestamp() };
                if (isElder) updates.connectionCode = newCode;
                
                await updateDoc(userDocRef, updates);
                
                // Cache updated data
                localUserStore.save({ ...data, ...updates, uid: user.uid });
            }
        } catch (e) {
            console.warn("⚠️ Could not update session in Firestore:", e);
        }
        
        // Finalize local storage update
        localUserStore.update({ lastActive: new Date().toISOString() });

        return user;
    } catch (error: any) {
        throw new Error(getFriendlyErrorMessage(error));
    }
};

// --- Helper: Setup or update Google user document ---

const setupOrUpdateGoogleUser = async (user: User, role: 'elder' | 'family') => {
    const now = new Date().toISOString();
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (role === 'elder') {
        const elderData = {
            uid: user.uid,
            email: user.email || '',
            fullName: user.displayName || '',
            age: 0,
            emergencyContact: '',
            familyMembers: [],
            connectionCode: newCode,
            profileSetupComplete: false,
            role: 'elder' as const,
            createdAt: now,
            lastActive: now,
        };

        // Try Firestore first
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    ...elderData,
                    createdAt: serverTimestamp(),
                    lastActive: serverTimestamp(),
                });
            } else {
                // Update existing user with new code and lastActive
                await updateDoc(userDocRef, { 
                    lastActive: serverTimestamp(),
                    connectionCode: newCode 
                });
                // Update localStorage with merged data
                localUserStore.save({ ...userDoc.data(), ...elderData, uid: user.uid } as any);
                return;
            }
        } catch (e: any) {
            console.warn('⚠️ Firestore unavailable for Google user setup:', e?.code || e?.message);
        }

        // Always save to localStorage
        localUserStore.save(elderData);
    } else {
        const familyData = {
            uid: user.uid,
            email: user.email || '',
            fullName: user.displayName || '',
            phone: '',
            relationship: 'other',
            eldersConnected: [],
            role: 'family' as const,
            createdAt: now,
            lastActive: now,
        };

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    ...familyData,
                    createdAt: serverTimestamp(),
                    lastActive: serverTimestamp(),
                });
            } else {
                await updateDoc(userDocRef, { lastActive: serverTimestamp() });
                localUserStore.save({ ...userDoc.data(), uid: user.uid } as any);
                return;
            }
        } catch (e: any) {
            console.warn('⚠️ Firestore unavailable for Google user setup:', e?.code || e?.message);
        }

        localUserStore.save(familyData);
    }

    console.log('✅ Google user setup completed for:', user.email);
};

// --- Sign In with Google ---

export const signInWithGoogle = async (role: 'elder' | 'family') => {
    try {
        const provider = new GoogleAuthProvider();

        sessionStorage.setItem('google_signin_role', role);
        sessionStorage.setItem('google_signin_pending', 'true');

        // Try popup first (faster UX when it works)
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            sessionStorage.removeItem('google_signin_pending');
            await setupOrUpdateGoogleUser(user, role);
            return user;
        } catch (popupError: any) {
            console.warn('⚠️ Popup sign-in failed, falling back to redirect...', popupError?.code);

            const fallbackCodes = [
                'auth/network-request-failed',
                'auth/popup-blocked',
                'auth/popup-closed-by-user',
                'auth/cancelled-popup-request',
                'auth/internal-error'
            ];

            if (fallbackCodes.includes(popupError?.code)) {
                await signInWithRedirect(auth, provider);
                return null as any;
            }

            throw popupError;
        }
    } catch (error: any) {
        sessionStorage.removeItem('google_signin_pending');
        throw new Error(getFriendlyErrorMessage(error));
    }
};

// --- Process Google Redirect Result (call on app init) ---

export const processGoogleRedirectResult = async (): Promise<User | null> => {
    try {
        const isPending = sessionStorage.getItem('google_signin_pending');
        if (!isPending) return null;

        const result = await getRedirectResult(auth);
        if (result && result.user) {
            const role = (sessionStorage.getItem('google_signin_role') as 'elder' | 'family') || 'elder';
            sessionStorage.removeItem('google_signin_pending');
            sessionStorage.removeItem('google_signin_role');

            await setupOrUpdateGoogleUser(result.user, role);
            console.log('✅ Google redirect sign-in completed for:', result.user.email);
            return result.user;
        }

        sessionStorage.removeItem('google_signin_pending');
        return null;
    } catch (error: any) {
        console.error('🔥 Error processing Google redirect result:', error);
        sessionStorage.removeItem('google_signin_pending');
        sessionStorage.removeItem('google_signin_role');
        return null;
    }
};

// --- Error Messages ---

const getFriendlyErrorMessage = (error: any): string => {
    console.error('🔥 [FRONTEND_AUTH_ERROR]:', error);
    
    if (error?.message?.toLowerCase().includes('failed to fetch')) {
        return "Network Error: Cannot reach Auth Service. Please check if your backend is running.";
    }

    const errorCode = error?.code || 'unknown';

    switch (errorCode) {
        case 'auth/network-request-failed':
            return "Network error: Could not connect to Google. Retrying with redirect...";
        case 'auth/unauthorized-domain':
            return `Unauthorized Domain: Please add 'localhost' to Authorized Domains in Firebase Console.`;
        case 'auth/popup-blocked':
            return "Login popup blocked! Retrying with redirect...";
        case 'auth/popup-closed-by-user':
            return "Login cancelled. Please try again.";
        case 'auth/operation-not-allowed':
            return "Google Sign-In is NOT enabled in your Firebase Console. Go to Authentication > Sign-in method > Google and enable it.";
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return "Invalid email or password.";
        case 'auth/email-already-in-use':
            return "This email is already registered.";
        case 'auth/invalid-api-key':
            return "Invalid Firebase API Key in .env.";
        case 'unavailable':
            return "Database temporarily unavailable. You're signed in but some features may be limited.";
        default:
            return `An unexpected error occurred: ${errorCode}. Please check the console for details.`;
    }
};

// --- Sign Out ---

export const signOut = async () => {
    localStorage.removeItem('dev_bypass_auth');
    localUserStore.remove();
    sessionStorage.removeItem('google_signin_pending');
    sessionStorage.removeItem('google_signin_role');
    await firebaseSignOut(auth);
};

// --- Password Management ---

export const sendPasswordResetEmail = async (email: string) => {
    await firebaseSendPasswordResetEmail(auth, email);
};

// --- State Listener ---

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    return firebaseOnAuthStateChanged(auth, callback);
};
