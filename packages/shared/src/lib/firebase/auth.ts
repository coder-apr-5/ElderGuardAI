import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
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
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './config';
import { ElderUser, FamilyUser } from '../../types/user';

// --- Auth Utilities ---

export const mapFirebaseUserToUser = async (firebaseUser: User | null): Promise<ElderUser | FamilyUser | null> => {
    if (!firebaseUser) return null;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        return userDoc.data() as ElderUser | FamilyUser;
    }
    return null;
};

// --- Sign Up ---

export const signUpElder = async (data: any) => {
    const { email, password, fullName, age, emergencyContact, connectionCode: _connectionCode } = data;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    // Generate own connection code for others to join (simple random for now)
    const myConnectionCode = Math.floor(100000 + Math.random() * 900000).toString();

    const elderData: Omit<ElderUser, 'createdAt' | 'lastActive' | 'uid'> = {
        email,
        fullName,
        age,
        emergencyContact,
        familyMembers: [],
        connectionCode: myConnectionCode, // Their own code
        profileSetupComplete: false,
        role: 'elder'
    };

    // If they provided a code to link to a family member immediately (logic for linking would go here or separate function)
    // For now just saving the user.

    await setDoc(doc(db, 'users', user.uid), {
        ...elderData,
        uid: user.uid,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
    });

    return user;
};

export const signUpFamily = async (data: any) => {
    const { email, password, fullName, phone, relationship, connectionCode: _connectionCode } = data;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    const familyData: Omit<FamilyUser, 'createdAt' | 'lastLogin' | 'uid'> = {
        email,
        fullName,
        phone,
        relationship,
        eldersConnected: [], // Logic to link via connectionCode would act here
        role: 'family'
    };

    await setDoc(doc(db, 'users', user.uid), {
        ...familyData,
        uid: user.uid,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
    });

    // If connectionCode provided, implement linking logic here
    // ...

    return user;
};

// --- Sign In ---

export const signInWithEmail = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Update last login
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    try {
        await updateDoc(userDocRef, {
            lastActive: serverTimestamp() // or lastLogin depending on role, using generic 'lastActive' for simplicity or check role
        });
    } catch (e) {
        // If doc doesn't exist (legacy/error?), ignore or handle
        console.error("Error updating last login", e);
    }

    return userCredential.user;
};

export const signInWithGoogle = async (role: 'elder' | 'family') => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        // New Google User - we need to know if it's elder or family to create the right doc structure
        // This part is tricky with Google Auth as we don't have all the form fields.
        // Usually we redirect to a "Complete Profile" page.
        // For now, valid placeholders or minimal doc.
        const baseData = {
            uid: user.uid,
            email: user.email || '',
            fullName: user.displayName || '',
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            role: role
        };

        if (role === 'elder') {
            await setDoc(userDocRef, {
                ...baseData,
                age: 0, // Placeholder
                emergencyContact: '',
                familyMembers: [],
                connectionCode: Math.floor(100000 + Math.random() * 900000).toString(),
                profileSetupComplete: false
            });
        } else {
            await setDoc(userDocRef, {
                ...baseData,
                phone: '',
                relationship: 'other',
                eldersConnected: []
            });
        }
    } else {
        await updateDoc(userDocRef, {
            lastActive: serverTimestamp()
        });
    }

    return user;
};

// --- Sign Out ---

export const signOut = async () => {
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
