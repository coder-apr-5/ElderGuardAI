import { useState, useEffect } from 'react';

// Types
export interface ElderSummary {
    uid: string;
    name: string;
    photoUrl?: string;
    connectionStatus: 'online' | 'offline';
}

export interface ElderStatus {
    mood: 'happy' | 'okay' | 'sad';
    riskScore: number;
    lastActive: string;
    isEmergency: boolean;
    medicineCompliance: number;
    vitals: {
        stability: string;
    };
}

// Hook to get the list of connected elders (localStorage mock)
export const useConnectedElders = () => {
    const [elders, setElders] = useState<ElderSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchElders = async () => {
            try {
                const { auth } = await import("@elder-nest/shared");
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }

                // 1. Get Family Profile from localStorage
                const familyDataStr = localStorage.getItem(`users_${user.uid}`);
                const familyData = familyDataStr ? JSON.parse(familyDataStr) : null;

                if (!familyData) {
                    setElders([]);
                    setLoading(false);
                    return;
                }

                const elderIds: string[] = familyData.eldersConnected || [];

                if (elderIds.length === 0) {
                    setElders([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch all elder profiles from localStorage
                const elderPromises = elderIds.map(async (id) => {
                    const elderDataStr = localStorage.getItem(`users_${id}`);
                    if (elderDataStr) {
                        const data = JSON.parse(elderDataStr);
                        return {
                            uid: id,
                            name: data.fullName || 'Unknown',
                            connectionStatus: 'online', // Mock
                            photoUrl: data.profilePicture
                        } as ElderSummary;
                    }
                    return null;
                });

                const fetchedElders = (await Promise.all(elderPromises)).filter(Boolean) as ElderSummary[];
                setElders(fetchedElders);

            } catch (err) {
                console.error('Failed to fetch elders', err);
                setError('Failed to load family members');
            } finally {
                setLoading(false);
            }
        };

        fetchElders();
    }, []);

    return { elders, loading, error };
};

// Hook to get real-time status of a specific elder (localStorage simulation)
export const useElderStatus = (elderId: string | null) => {
    const [data, setData] = useState<ElderStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        if (!elderId) {
            setLoading(false);
            return;
        }

        const fetchStatus = () => {
            const userDataStr = localStorage.getItem(`users_${elderId}`);
            const userData = userDataStr ? JSON.parse(userDataStr) : {};

            setData(prev => ({
                mood: 'okay',
                riskScore: 0,
                medicineCompliance: 100,
                vitals: { stability: 'Stable' },
                ...prev,
                lastActive: userData.lastActive || new Date().toISOString(),
                isEmergency: userData.isEmergency || false,
            }));
            setLoading(false);
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);

        return () => clearInterval(interval);
    }, [elderId]);

    const refresh = () => { };

    return { data, loading, error, refresh };
};
