// Using string for ISO dates instead of Firestore Timestamp
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'fall' | 'sos' | 'health' | 'security' | 'inactive';

export interface Alert {
    id?: string;
    elderId: string;
    familyIds: string[]; // List of family members to notify
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    timestamp: string;
    acknowledged: boolean;
    acknowledgedBy?: string;
    metadata?: any; // For snapshot URLs or specific data
}

export type MedicationStatus = 'pending' | 'taken' | 'missed' | 'skipped';

export interface Medication {
    id?: string;
    elderId: string;
    name: string;
    dosage: string;
    time: string; // HH:MM format (24h)
    days: string[]; // ['Mon', 'Tue', ...] or ['Daily']
    status: { [date: string]: MedicationStatus }; // Map of YYYY-MM-DD -> Status to track daily history
    instructions?: string;
    createdBy: string; // Family UID
    createdAt: string;
}

export interface VitalSign {
    elderId: string;
    type: 'heart_rate' | 'blood_pressure' | 'oxygen' | 'temp';
    value: number;
    unit: string;
    timestamp: string;
}

export interface MoodLog {
    elderId: string;
    mood: string; // 'happy', 'sad', etc.
    confidence: number;
    timestamp: string;
    note?: string;
}
