/**
 * MedicationsPage — Family Dashboard
 * 
 * Shows the elder's medications in real-time.
 * Family members can Add / Edit / Delete medications.
 * Two-way sync: changes from elder reflect instantly here, and vice versa.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Plus, Pencil, Trash2, Clock, Bell, X, Check,
  RefreshCw, User2, Users2, ChevronDown, ChevronUp, AlertTriangle,
  Activity, Shield
} from 'lucide-react';
import { auth, db } from '@elder-nest/shared';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useMedications, isStale, daysSinceUpdate } from '@/hooks/useMedications';
import type { MedicationInput, Medication } from '@/hooks/useMedications';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RoleBadge = ({ role }: { role: 'elder' | 'family' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
    role === 'elder'
      ? 'bg-indigo-100 text-indigo-700'
      : 'bg-emerald-100 text-emerald-700'
  }`}>
    {role === 'elder' ? <User2 size={10} /> : <Users2 size={10} />}
    {role === 'elder' ? 'Elder' : 'Family'}
  </span>
);

const StaleBadge = ({ days }: { days: number }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
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
    <form onSubmit={handleSubmit} className="space-y-3 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl shadow-inner">
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
        <Pill size={12} /> Medication Details
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Medicine Name *</label>
          <input value={form.medicineName} onChange={(e) => set('medicineName', e.target.value)}
            placeholder="e.g. Aspirin" required
            className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Dosage *</label>
          <input value={form.dosage} onChange={(e) => set('dosage', e.target.value)}
            placeholder="e.g. 100mg" required
            className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Time Schedule *</label>
          <input value={form.timeSchedule} onChange={(e) => set('timeSchedule', e.target.value)}
            placeholder="e.g. Morning & Night" required
            className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
          <input value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. After meals"
            className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={14} className="inline mr-1" />Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50">
          {saving ? <RefreshCw size={14} className="inline mr-1 animate-spin" /> : <Check size={14} className="inline mr-1" />}
          Save Medication
        </button>
      </div>
    </form>
  );
};

// ─── Med Card ─────────────────────────────────────────────────────────────────

const MedCard = ({ med, onEdit, onDelete, deleting }: {
  med: Medication;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const stale = isStale(med, 7);
  const days = daysSinceUpdate(med);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border overflow-hidden transition-all shadow-sm hover:shadow-md ${
        stale
          ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
          : 'border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          stale ? 'bg-amber-100 text-amber-600' : 'bg-white text-indigo-500 shadow-sm'
        }`}>
          <Pill size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-800 truncate">{med.medicineName}</h4>
            {stale && <StaleBadge days={days} />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />{med.timeSchedule}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-indigo-600">{med.dosage}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <RoleBadge role={med.updatedByRole} />
            <span className="text-[10px] text-slate-400">
              Updated by {med.updatedBy} · {med.updatedAt.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl hover:bg-white/70 text-slate-400 hover:text-indigo-500 transition-colors" title="Details">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onEdit}
            className="p-2 rounded-xl hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="p-2 rounded-xl hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50" title="Delete">
            {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded notes */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-4 pb-4 border-t border-white/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{med.notes || <span className="italic text-slate-400">No notes added</span>}</p>
              <p className="text-xs text-slate-400 mt-2">
                Added: {med.createdAt.toLocaleDateString()} · Last updated: {med.updatedAt.toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MedicationsPage = () => {
  const [elderId, setElderId] = useState<string | null>(null);
  const [elderName, setElderName] = useState('Elder');
  const [resolving, setResolving] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [staleAlert, setStaleAlert] = useState(true);

  // Resolve connected elder's UID from family user doc
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setResolving(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.data();
        const role = data?.role;

        if (role === 'family') {
          const eldersConnected: string[] = data?.eldersConnected ?? [];
          if (eldersConnected.length > 0) {
            const firstElderId = eldersConnected[0];
            setElderId(firstElderId);
            // Fetch elder's name
            const elderSnap = await getDoc(doc(db, 'users', firstElderId));
            setElderName(elderSnap.data()?.fullName?.split(' ')[0] ?? 'Elder');
          } else {
            // Try via connectionCode: family might have skipped linking
            // Fallback: show empty state with prompt
            setElderId(null);
          }
        } else if (role === 'elder') {
          // If somehow an elder opens this page
          setElderId(user.uid);
          setElderName(user.displayName?.split(' ')[0] ?? 'Elder');
        }
      } catch (e) {
        console.error('MedicationsPage resolve elder:', e);
      } finally {
        setResolving(false);
      }
    });
    return () => unsub();
  }, []);

  const { medications, loading, error, addMedication, updateMedication, deleteMedication } =
    useMedications(elderId, 'family');

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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalMeds = medications.length;
  const staleMedsCount = staleMeds.length;
  const recentlyUpdated = medications.filter((m) => daysSinceUpdate(m) <= 1).length;

  if (resolving || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!elderId) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8 bg-white rounded-3xl border border-indigo-100 shadow-lg">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="text-indigo-400" size={36} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">No Elder Connected</h2>
        <p className="text-slate-500 mb-6">
          You are not connected to any elder yet. Ask the elder to share their connection code and link your account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="text-indigo-500" size={26} />
            {elderName}'s Medications
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
            <Activity size={13} />
            Live sync — changes reflect instantly for elder too
          </p>
        </div>
        {!showAdd && (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
          >
            <Plus size={18} /> Add Medication
          </motion.button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: totalMeds, color: 'from-indigo-500 to-purple-600', icon: Pill },
          { label: 'Needs Update', value: staleMedsCount, color: 'from-amber-400 to-orange-500', icon: AlertTriangle },
          { label: 'Updated Today', value: recentlyUpdated, color: 'from-emerald-400 to-teal-500', icon: Check },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`rounded-2xl p-4 bg-gradient-to-br ${color} text-white shadow-md`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} className="opacity-80" />
              <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">{error}</div>
      )}

      {/* Stale reminder banner */}
      <AnimatePresence>
        {staleAlert && staleMeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
          >
            <Bell size={20} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                ⚠️ {staleMeds.length} medication{staleMeds.length > 1 ? 's' : ''} not updated in 7+ days
              </p>
              <p className="text-amber-700 text-sm mt-0.5">
                Please review: <span className="font-medium">{staleMeds.map(m => m.medicineName).join(', ')}</span>
              </p>
            </div>
            <button onClick={() => setStaleAlert(false)} className="text-amber-400 hover:text-amber-600">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <MedForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medication list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {medications.map((med) => (
            editingId === med.id ? (
              <motion.div key={med.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MedForm
                  initial={{ medicineName: med.medicineName, dosage: med.dosage, timeSchedule: med.timeSchedule, notes: med.notes }}
                  onSave={(data) => handleEdit(med.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </motion.div>
            ) : (
              <MedCard
                key={med.id}
                med={med}
                onEdit={() => setEditingId(med.id)}
                onDelete={() => { setDeletingId(med.id); deleteMedication(med.id).finally(() => setDeletingId(null)); }}
                deleting={deletingId === med.id}
              />
            )
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {medications.length === 0 && !showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-3xl border border-dashed border-indigo-200">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="text-indigo-400" size={36} />
            </div>
            <p className="text-slate-500 text-lg font-medium mb-2">No medications added yet</p>
            <p className="text-slate-400 text-sm mb-6">Add {elderName}'s medications to start tracking</p>
            <button onClick={() => setShowAdd(true)}
              className="px-6 py-2.5 bg-indigo-500 text-white rounded-2xl font-semibold hover:bg-indigo-600 transition-colors">
              <Plus size={16} className="inline mr-1" />Add First Medication
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MedicationsPage;
