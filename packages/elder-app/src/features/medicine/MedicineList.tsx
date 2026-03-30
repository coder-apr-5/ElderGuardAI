/**
 * MedicineList — Elder-side medication manager
 * Real-time two-way sync with Family Dashboard via Firestore onSnapshot.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Plus, Pencil, Trash2, Clock, AlertTriangle, X, Check, Bell,
  RefreshCw, User2, Users2, ChevronDown, ChevronUp
} from 'lucide-react';
import { auth, db } from '@elder-nest/shared';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useMedications, isStale, daysSinceUpdate } from '@/hooks/useMedications';
import type { MedicationInput } from '@/hooks/useMedications';

// ─── Sub-components ──────────────────────────────────────────────────────────

const RoleBadge = ({ role }: { role: 'elder' | 'family' }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
      role === 'elder'
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    }`}
  >
    {role === 'elder' ? <User2 size={10} /> : <Users2 size={10} />}
    {role === 'elder' ? 'Elder' : 'Family'}
  </span>
);

const StaleBadge = ({ days }: { days: number }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 uppercase tracking-wide">
    <AlertTriangle size={10} />
    {days}d old
  </span>
);

// ─── MedForm ─────────────────────────────────────────────────────────────────

interface MedFormProps {
  initial?: Partial<MedicationInput>;
  onSave: (data: MedicationInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const EMPTY: MedicationInput = { medicineName: '', dosage: '', timeSchedule: '', notes: '' };

const MedForm = ({ initial, onSave, onCancel, saving }: MedFormProps) => {
  const [form, setForm] = useState<MedicationInput>({ ...EMPTY, ...initial });

  const set = (k: keyof MedicationInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineName.trim() || !form.dosage.trim() || !form.timeSchedule.trim()) return;
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-slate-600 shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Medicine Name *</label>
          <input
            value={form.medicineName}
            onChange={(e) => set('medicineName', e.target.value)}
            placeholder="e.g. Metformin"
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Dosage *</label>
          <input
            value={form.dosage}
            onChange={(e) => set('dosage', e.target.value)}
            placeholder="e.g. 500mg, 1 tablet"
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Time Schedule *</label>
          <input
            value={form.timeSchedule}
            onChange={(e) => set('timeSchedule', e.target.value)}
            placeholder="e.g. 8:00 AM & 8:00 PM"
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Notes (optional)</label>
          <input
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. Take after meals"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={14} className="inline mr-1" />Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw size={14} className="inline mr-1 animate-spin" /> : <Check size={14} className="inline mr-1" />}
          Save
        </button>
      </div>
    </form>
  );
};

// ─── MedicineList ─────────────────────────────────────────────────────────────

export const MedicineList = () => {
  const [elderId, setElderId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [staleAlert, setStaleAlert] = useState(true);

  // Resolve elder UID on auth change
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setElderId(null); return; }
      const snap = await getDoc(doc(db, 'users', user.uid));
      const role = snap.data()?.role as string;
      if (role === 'elder') {
        setElderId(user.uid);
      }
    });
    return () => unsub();
  }, []);

  const { medications, loading, error, addMedication, updateMedication, deleteMedication } =
    useMedications(elderId, 'elder');

  const staleMeds = medications.filter((m) => isStale(m, 7));

  const handleAdd = async (data: MedicationInput) => {
    setSaving(true);
    try { await addMedication(data); setShowAdd(false); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id: string, data: MedicationInput) => {
    setSaving(true);
    try { await updateMedication(id, data); setEditingId(null); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deleteMedication(id); }
    finally { setDeletingId(null); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-rose-500 text-sm">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Stale reminder alert ── */}
      <AnimatePresence>
        {staleAlert && staleMeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-sm"
          >
            <Bell size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {staleMeds.length} medication{staleMeds.length > 1 ? 's have' : ' has'} not been updated in over 7 days.
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                Please review and update: {staleMeds.map(m => m.medicineName).join(', ')}
              </p>
            </div>
            <button onClick={() => setStaleAlert(false)} className="text-amber-500 hover:text-amber-700">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Medication cards ── */}
      <AnimatePresence mode="popLayout">
        {medications.map((med) => {
          const stale = isStale(med, 7);
          const days = daysSinceUpdate(med);
          const isExpanded = expandedId === med.id;

          return (
            <motion.div
              key={med.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-2xl border transition-all ${
                stale
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                  : 'border-blue-100 dark:border-slate-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700/50'
              }`}
            >
              {editingId === med.id ? (
                <div className="p-3">
                  <MedForm
                    initial={{ medicineName: med.medicineName, dosage: med.dosage, timeSchedule: med.timeSchedule, notes: med.notes }}
                    onSave={(data) => handleEdit(med.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                      stale ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-white dark:bg-slate-600 text-blue-500 dark:text-blue-300'
                    }`}>
                      <Pill className="w-6 h-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{med.medicineName}</h4>
                        {stale && <StaleBadge days={days} />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock size={11} />
                          {med.timeSchedule}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{med.dosage}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <RoleBadge role={med.updatedByRole} />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          by {med.updatedBy} · {med.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : med.id)}
                        className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-600 text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Show notes"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => setEditingId(med.id)}
                        className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-600 text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(med.id)}
                        disabled={deletingId === med.id}
                        className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === med.id
                          ? <RefreshCw size={16} className="animate-spin" />
                          : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded notes */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-600">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-3 mb-1">Notes</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {med.notes || <span className="italic text-slate-400">No notes</span>}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {medications.length === 0 && !showAdd && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-base">No medications added yet</p>
        </div>
      )}

      {/* ── Add form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <MedForm
              onSave={handleAdd}
              onCancel={() => setShowAdd(false)}
              saving={saving}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add button ── */}
      {!showAdd && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors text-sm font-semibold"
        >
          <Plus size={18} /> Add Medication
        </motion.button>
      )}
    </div>
  );
};
