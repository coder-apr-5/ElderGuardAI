import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from '../lib/firebase/auth'; // Ensure this path is correct
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('elder' | 'family')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles: _allowedRoles }) => {
    const [loading, setLoading] = useState(true);
    const [_user, setUser] = useState<any>(null); // Ideally type this with your user type
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
            if (!firebaseUser) {
                navigate('/auth/login', { replace: true });
                return;
            }

            // Optional: Fetch full user profile here to check roles/completion
            // const profile = await getUserProfile(firebaseUser.uid); 
            // if (allowedRoles && !allowedRoles.includes(profile.role)) ... 

            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

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
