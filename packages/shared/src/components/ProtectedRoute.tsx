import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, localUserStore } from '../lib/firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('elder' | 'family')[];
    requireSetup?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requireSetup = true }) => {
    const [loading, setLoading] = useState(true);
    const [, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // --- Developer Bypass Check ---
        const bypass = localStorage.getItem('dev_bypass_auth') === 'true';
        if (bypass) {
            console.warn("🛠️ [DEV_BYPASS]: Authentication is currently bypassed.");
            const mockUser = {
                uid: 'dev-elder-123',
                email: 'dev@example.com',
                fullName: 'Dev Senior',
                role: 'elder',
                profileSetupComplete: true,
                age: 75,
                connectionCode: '123456'
            };
            setUser(mockUser);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
            if (!firebaseUser) {
                navigate('/auth/login', { replace: true, state: { from: location } });
                return;
            }

            try {
                // Try to fetch from Firestore first
                let userData: any = null;
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        userData = userSnap.data();
                        // Cache in localStorage
                        localUserStore.save({ ...userData, uid: firebaseUser.uid });
                    }
                } catch (firestoreErr) {
                    console.warn("⚠️ Firestore unavailable during route protection, trying localStorage fallback...");
                }

                // Fallback to localStorage if Firestore failed or returned no data
                if (!userData) {
                    userData = localUserStore.get(firebaseUser.uid);
                }

                if (!userData) {
                    // User authenticated but no DB record and no localStorage — 
                    // could be a new Google sign-in where Firestore was unavailable.
                    // Allow through with basic auth data from Firebase Auth.
                    console.warn("⚠️ No user profile found (Firestore/Local), using basic auth data.");
                    userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        fullName: firebaseUser.displayName || '',
                        role: (sessionStorage.getItem('google_signin_role') as any) || allowedRoles?.[0] || 'elder',
                        profileSetupComplete: false
                    };
                }

                // 1. Role Check
                if (allowedRoles && !allowedRoles.includes(userData.role)) {
                    if (userData.role === 'family') navigate('/family');
                    else navigate('/unauthorized');
                    return;
                }

                // 2. Profile Setup Check
                if (requireSetup && !userData.profileSetupComplete && userData.role === 'elder') {
                    navigate('/auth/profile-setup');
                    return;
                }

                if (location.pathname === '/auth/profile-setup' && userData.profileSetupComplete) {
                    navigate('/');
                    return;
                }

                setUser({ ...firebaseUser, ...userData });
                setLoading(false);

            } catch (err: any) {
                console.error("Critical error verifying user session:", err);
                navigate('/auth/login');
            }
        });

        return () => unsubscribe();
    }, [navigate, allowedRoles, requireSetup, location]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-gray-500 text-lg font-medium">Checking session...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
