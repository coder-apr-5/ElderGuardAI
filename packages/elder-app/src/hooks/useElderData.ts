import { useState, useEffect } from 'react';
// import axios from 'axios';

//const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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

// Hook to get the list of connected elders
export const useConnectedElders = () => {
    const [elders, setElders] = useState<ElderSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchElders = async () => {
            try {
                // Dynamic import for shared config
                const { auth, db } = await import("@elder-nest/shared");
                const { doc, getDoc } = await import("firebase/firestore");

                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }

                // 1. Get Family Profile
                const familyDocRef = doc(db, 'users', user.uid);
                const familyDoc = await getDoc(familyDocRef);

                if (!familyDoc.exists()) {
                    setElders([]);
                    setLoading(false);
                    return;
                }

                const familyData = familyDoc.data();
                const elderIds: string[] = familyData.eldersConnected || [];

                if (elderIds.length === 0) {
                    setElders([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch all elder profiles
                const elderPromises = elderIds.map(async (id) => {
                    const elderRef = doc(db, 'users', id);
                    const elderSnap = await getDoc(elderRef);
                    if (elderSnap.exists()) {
                        const data = elderSnap.data();
                        return {
                            uid: id,
                            name: data.fullName || 'Unknown',
                            connectionStatus: 'online', // In real app, check 'lastActive' timestamp vs current time
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

// Hook to get real-time status of a specific elder
export const useElderStatus = (elderId: string | null) => {
    const [data, setData] = useState<ElderStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribeUser: () => void;
        let unsubscribeMood: () => void;
        let unsubscribeRisk: () => void;

        const setupListeners = async () => {
            if (!elderId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { db } = await import("@elder-nest/shared");
                const { doc, onSnapshot, collection, query, where, orderBy, limit } = await import("firebase/firestore");

                // 1. Listen to User Document (Last Active & Emergency Status)
                const userRef = doc(db, 'users', elderId);
                unsubscribeUser = onSnapshot(userRef, (docSnap) => {
                    const userData = docSnap.data();
                    setData(prev => ({
                        ...prev!,
                        lastActive: userData?.lastActive?.toDate?.()?.toISOString() || new Date().toISOString(),
                        isEmergency: userData?.isEmergency || false, // REAL TIME emergency status
                    } as ElderStatus));
                });

                // 2. Listen to Latest Mood
                const moodQuery = query(
                    collection(db, 'moods'),
                    where('userId', '==', elderId),
                    orderBy('timestamp', 'desc'),
                    limit(1)
                );

                unsubscribeMood = onSnapshot(moodQuery, (snapshot) => {
                    if (!snapshot.empty) {
                        const moodData = snapshot.docs[0].data();
                        const moodLabel = moodData.label?.toLowerCase();
                        let normalizedMood: 'happy' | 'okay' | 'sad' = 'okay';

                        if (['happy', 'good', 'great', 'excited'].some(m => moodLabel?.includes(m))) normalizedMood = 'happy';
                        else if (['sad', 'bad', 'terrible', 'depressed'].some(m => moodLabel?.includes(m))) normalizedMood = 'sad';

                        setData(prev => ({
                            ...prev!,
                            mood: normalizedMood
                        } as ElderStatus));
                    }
                });

                // 3. Listen to Latest Risk Score
                const riskQuery = query(
                    collection(db, 'riskScores'),
                    where('userId', '==', elderId),
                    orderBy('timestamp', 'desc'),
                    limit(1)
                );

                unsubscribeRisk = onSnapshot(riskQuery, (snapshot) => {
                    if (!snapshot.empty) {
                        const riskData = snapshot.docs[0].data();
                        setData(prev => ({
                            ...prev!,
                            riskScore: riskData.riskScore || 0,
                            vitals: {
                                ...prev?.vitals,
                                stability: riskData.riskLevel || 'Stable'
                            }
                        } as ElderStatus));
                    } else {
                        // Default if no risk score yet
                        setData(prev => ({
                            ...prev!,
                            riskScore: 0,
                            vitals: { stability: 'Stable' }
                        } as ElderStatus));
                    }
                });

                // Initialize default structure while waiting for snapshots
                setData({
                    mood: 'okay',
                    riskScore: 0,
                    lastActive: new Date().toISOString(),
                    isEmergency: false,
                    medicineCompliance: 100, // Still placeholder until we have medicine tracking
                    vitals: { stability: 'Stable' }
                });

            } catch (err) {
                console.error("Error setting up listeners", err);
                setError("Failed to connect to real-time updates");
            } finally {
                setLoading(false);
            }
        };

        setupListeners();

        return () => {
            if (unsubscribeUser) unsubscribeUser();
            if (unsubscribeMood) unsubscribeMood();
            if (unsubscribeRisk) unsubscribeRisk();
        };
    }, [elderId]);

    // Refetch is not needed with real-time listeners, but keeping interface consistent
    const refresh = () => { };

    return { data, loading, error, refresh };
};

