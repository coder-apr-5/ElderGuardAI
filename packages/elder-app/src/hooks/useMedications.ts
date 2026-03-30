/**
 * useMedications — Real-time two-way medication sync
 *
 * Stores medications in a top-level Firestore collection:
 *   medications/{medicationId}
 *
 * Each document includes:
 *   elderId, medicineName, dosage, timeSchedule, notes,
 *   updatedBy, updatedByRole, updatedAt, createdAt
 *
 * Both Elder and Family members can CRUD.
 * Uses onSnapshot for real-time updates (no reload needed).
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '@elder-nest/shared';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MedRole = 'elder' | 'family';

export interface Medication {
  id: string;
  elderId: string;
  medicineName: string;
  dosage: string;
  timeSchedule: string;
  notes?: string;
  updatedBy: string;        // display name
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

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * @param elderId  - The UID of the elder whose medications to watch.
 *                   For elder users: their own UID.
 *                   For family dashboard: the connected elder's UID.
 * @param role     - 'elder' | 'family'
 */
export function useMedications(elderId: string | null, role: MedRole) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Real-time listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!elderId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'medications'),
      where('elderId', '==', elderId),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const meds: Medication[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            elderId: data.elderId,
            medicineName: data.medicineName,
            dosage: data.dosage,
            timeSchedule: data.timeSchedule,
            notes: data.notes ?? '',
            updatedBy: data.updatedBy ?? '',
            updatedByRole: data.updatedByRole ?? 'elder',
            updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
            createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
          };
        });
        setMedications(meds);
        setLoading(false);
      },
      (err) => {
        console.error('useMedications onSnapshot error:', err);
        setError('Failed to load medications. Check Firestore rules.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [elderId]);

  // ── CRUD helpers ─────────────────────────────────────────────────────────
  const currentUser = auth.currentUser;
  const displayName = currentUser?.displayName || (role === 'elder' ? 'Elder' : 'Family Member');

  const addMedication = async (input: MedicationInput): Promise<void> => {
    if (!elderId) throw new Error('No elder ID');
    await addDoc(collection(db, 'medications'), {
      elderId,
      medicineName: input.medicineName.trim(),
      dosage: input.dosage.trim(),
      timeSchedule: input.timeSchedule.trim(),
      notes: input.notes?.trim() ?? '',
      updatedBy: displayName,
      updatedByRole: role,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  };

  const updateMedication = async (id: string, input: Partial<MedicationInput>): Promise<void> => {
    await updateDoc(doc(db, 'medications', id), {
      ...input,
      updatedBy: displayName,
      updatedByRole: role,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteMedication = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'medications', id));
  };

  return { medications, loading, error, addMedication, updateMedication, deleteMedication };
}

// ─── Stale-reminder helper ────────────────────────────────────────────────────

/** Returns true if the medication hasn't been updated in more than `thresholdDays` days */
export function isStale(med: Medication, thresholdDays = 7): boolean {
  const diffMs = Date.now() - med.updatedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}

/** How many days since last update */
export function daysSinceUpdate(med: Medication): number {
  return Math.floor((Date.now() - med.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
}
