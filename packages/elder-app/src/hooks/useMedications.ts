import { useState, useEffect } from 'react';
import { auth } from '@elder-nest/shared';

export type MedRole = 'elder' | 'family';

export interface Medication {
  id: string;
  elderId: string;
  medicineName: string;
  dosage: string;
  timeSchedule: string;
  notes?: string;
  updatedBy: string;        
  updatedByRole: MedRole;
  updatedAt: Date;
  createdAt: Date;
}

export interface MedicationInput {
  medicineName: string;
  dosage: string;
  timeSchedule: string;
  notes?: string;
}

const STORAGE_KEY = 'medications_db';

const getLocalMeds = (): Medication[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const raw = JSON.parse(data);
    return raw.map((m: any) => ({
      ...m,
      updatedAt: new Date(m.updatedAt),
      createdAt: new Date(m.createdAt)
    }));
  } catch {
    return [];
  }
};

const setLocalMeds = (meds: Medication[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
};

export function useMedications(elderId: string | null, role: MedRole) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (!elderId) {
      setLoading(false);
      return;
    }

    // Load initial
    const loadMeds = () => {
      const allMeds = getLocalMeds();
      const userMeds = allMeds
        .filter(m => m.elderId === elderId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      setMedications(userMeds);
      setLoading(false);
    };

    loadMeds();

    // Listen for cross-tab changes (ONLY works if on same port, but prevents crash)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadMeds();
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Simulate real-time polling for local fallback
    const interval = setInterval(loadMeds, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [elderId]);

  const currentUser = auth.currentUser;
  const displayName = currentUser?.displayName || (role === 'elder' ? 'Elder' : 'Family Member');

  const addMedication = async (input: MedicationInput): Promise<void> => {
    if (!elderId) throw new Error('No elder ID');
    
    const newMed: Medication = {
      id: Math.random().toString(36).substring(2, 10),
      elderId,
      medicineName: input.medicineName.trim(),
      dosage: input.dosage.trim(),
      timeSchedule: input.timeSchedule.trim(),
      notes: input.notes?.trim() ?? '',
      updatedBy: displayName,
      updatedByRole: role,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    const all = getLocalMeds();
    setLocalMeds([...all, newMed]);
    setMedications(prev => [...prev, newMed].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
  };

  const updateMedication = async (id: string, input: Partial<MedicationInput>): Promise<void> => {
    const all = getLocalMeds();
    const updated = all.map(m => {
      if (m.id === id) {
        return {
          ...m,
          ...input,
          updatedBy: displayName,
          updatedByRole: role,
          updatedAt: new Date()
        };
      }
      return m;
    });
    
    setLocalMeds(updated);
    setMedications(updated.filter(m => m.elderId === elderId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
  };

  const deleteMedication = async (id: string): Promise<void> => {
    const all = getLocalMeds();
    const filtered = all.filter(m => m.id !== id);
    setLocalMeds(filtered);
    setMedications(filtered.filter(m => m.elderId === elderId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
  };

  return { medications, loading, error, addMedication, updateMedication, deleteMedication };
}

export function isStale(med: Medication, thresholdDays = 7): boolean {
  const diffMs = Date.now() - med.updatedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}

export function daysSinceUpdate(med: Medication): number {
  return Math.floor((Date.now() - med.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
}
