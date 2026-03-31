import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from '../lib/firebase/auth'; // Ensure this path is correct
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
                // Fetch full user profile
                const dataStr = localStorage.getItem(`users_${firebaseUser.uid}`);

                if (!dataStr) {
                    // User authenticated but no DB record?
                    console.error("No user document found");
                    navigate('/auth/login');
                    return;
                }

                const userData = JSON.parse(dataStr);

                // 1. Role Check
                if (allowedRoles && !allowedRoles.includes(userData.role)) {
                    // Wrong role (e.g. family trying to access elder pages)
                    // Redirect to their appropriate home or denied page
                    if (userData.role === 'family') navigate('/family');
                    else navigate('/unauthorized');
                    return;
                }

                // 2. Profile Setup Check
                // If the route requires setup, but user hasn't completed it -> Redirect to Setup
                if (requireSetup && !userData.profileSetupComplete && userData.role === 'elder') {
                    navigate('/auth/profile-setup');
                    return;
                }

                // If we are ON the setup page, but setup IS complete -> Redirect to Home
                if (location.pathname === '/auth/profile-setup' && userData.profileSetupComplete) {
                    navigate('/');
                    return;
                }

                setUser({ ...firebaseUser, ...userData });
                setLoading(false);

            } catch (err) {
                console.error("Error verifying user session:", err);
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
