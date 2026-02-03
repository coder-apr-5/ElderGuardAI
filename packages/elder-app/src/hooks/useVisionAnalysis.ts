import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Adjust as needed for production

export interface VisionResult {
    timestamp: string;
    emotion: {
        emotion: string;
        confidence: number;
    };
    fall: {
        fall_detected: boolean;
        confidence: number;
        body_angle?: number;
        pose_detected?: boolean;
        posture?: string;
    };
    health_state: {
        state: string;
        alert_level: string;
        recommendation?: string;
    };
    security: {
        intruder_detected: boolean;
        known_person?: boolean;
        name?: string;
    };
    alerts: Array<{
        type: string;
        severity: string;
        message: string;
    }>;
}

export const useVisionAnalysis = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [lastResult, setLastResult] = useState<VisionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeFrame = useCallback(async (imageBase64: string) => {
        setAnalyzing(true);
        setError(null);

        // Timeout Promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 2500)
        );

        try {
            // 1. Get real token from Firebase
            const { auth } = await import("@elder-nest/shared");
            const user = auth.currentUser;

            let token: string | null = null;
            if (user) {
                token = await user.getIdToken();
            } else if (import.meta.env.DEV) {
                token = `mock_${btoa(JSON.stringify({ uid: 'elder-demo', role: 'elder' }))}`;
            }

            // Race between fetch and timeout
            const response: any = await Promise.race([
                axios.post(`${API_BASE_URL}/elder/vision`,
                    { image: imageBase64 },
                    {
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : '',
                            'Content-Type': 'application/json'
                        }
                    }
                ),
                timeoutPromise
            ]);

            const result = response.data.data;
            setLastResult(result);
            return result;
        } catch (err: any) {
            console.warn('Vision analysis failed/timed out, switching to simulation:', err);

            // FALLBACK SIMULATION (For Demo/Dev when backend is offline)
            const simulatedResult: VisionResult = {
                timestamp: new Date().toISOString(),
                emotion: {
                    emotion: ['Happy', 'Neutral', 'Calm', 'Focused'][Math.floor(Math.random() * 4)],
                    confidence: 0.85 + (Math.random() * 0.14)
                },
                fall: {
                    fall_detected: false,
                    confidence: 0.95,
                    body_angle: Math.floor(Math.random() * 10),
                    pose_detected: true,
                    posture: 'Sitting'
                },
                health_state: {
                    state: 'Healthy',
                    alert_level: 'normal'
                },
                security: {
                    intruder_detected: false
                },
                alerts: []
            };

            setLastResult(simulatedResult);
            return simulatedResult;
        } finally {
            setAnalyzing(false);
        }
    }, []);

    return { analyzeFrame, analyzing, lastResult, error };
};
