import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save, Plus, Trash2, Heart, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@elder-nest/shared';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { ElderUser, FamilyMemberManual } from '@elder-nest/shared';

export const ElderProfilePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<Partial<ElderUser>>({});
    const [familyMembers, setFamilyMembers] = useState<FamilyMemberManual[]>([]);
    const [newMember, setNewMember] = useState<FamilyMemberManual>({ name: '', relation: '', phone: '' });
    const [copied, setCopied] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        address: '',
        state: '',
        nationality: '',
        diseases: '', // comma separated for input
        bloodGroup: '',
        dob: '',
        photoURL: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (auth.currentUser) {
                const docRef = doc(db, 'users', auth.currentUser.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data() as ElderUser;
                    setUserData(data);
                    setFormData({
                        fullName: data.fullName || '',
                        phoneNumber: data.phoneNumber || '',
                        address: data.address || '',
                        state: data.state || '',
                        nationality: data.nationality || '',
                        diseases: data.diseases?.join(', ') || '',
                        bloodGroup: data.bloodGroup || '',
                        dob: data.dob || '',
                        photoURL: data.photoURL || ''
                    });
                    setFamilyMembers(data.manualFamilyMembers || []);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isProfile = true, index = -1) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (isProfile) {
                    setFormData(prev => ({ ...prev, photoURL: result }));
                } else if (index >= 0) {
                    // Update family member photo
                    const updated = [...familyMembers];
                    updated[index].photoURL = result;
                    setFamilyMembers(updated);
                } else {
                    // New member photo
                    setNewMember(prev => ({ ...prev, photoURL: result }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(docRef, {
                ...formData,
                diseases: formData.diseases.split(',').map(s => s.trim()).filter(Boolean),
                manualFamilyMembers: familyMembers,
                updatedAt: new Date()
            });
            alert('Profile updated successfully!');
        } catch (error) {
            console.error("Error updating profile:", error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const addFamilyMember = () => {
        if (newMember.name && newMember.phone) {
            setFamilyMembers([...familyMembers, newMember]);
            setNewMember({ name: '', relation: '', phone: '', photoURL: '' });
        }
    };

    const removeFamilyMember = (index: number) => {
        setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    };

    const copyCode = () => {
        if (userData.connectionCode) {
            navigator.clipboard.writeText(userData.connectionCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Profile</h1>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                {/* Profile Header Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-md">
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Camera size={40} />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white cursor-pointer shadow-lg hover:bg-indigo-600 transition-colors">
                            <Camera size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e)} />
                        </label>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{userData.fullName}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{userData.email}</p>
                        </div>

                        {userData.connectionCode && (
                            <div className="inline-flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                <Heart className="text-emerald-500" size={20} fill="currentColor" />
                                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Family Code:</span>
                                <span className="font-mono font-bold text-lg tracking-wider text-emerald-900 dark:text-emerald-200">{userData.connectionCode}</span>
                                <button onClick={copyCode} className="ml-2 p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-lg transition-colors text-emerald-600 dark:text-emerald-400">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Personal Details Form */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full" />
                        Personal Details
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                readOnly={!!userData.dob} // "must get Fetch from signup", usually implied read-only if already set, but let's allow edit if empty
                                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${userData.dob ? 'opacity-70 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Blood Group</label>
                            <select
                                value={formData.bloodGroup}
                                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option value="">Select Blood Group</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">State</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Nationality</label>
                            <input
                                type="text"
                                value={formData.nationality}
                                onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Diseases (comma separated)</label>
                            <textarea
                                value={formData.diseases}
                                onChange={e => setFormData({ ...formData, diseases: e.target.value })}
                                placeholder="e.g. Diabetes, Hypertension, Arthritis"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Manual Family Members */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-rose-500 rounded-full" />
                        Family Contact List (Manual)
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                        {familyMembers.map((member, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 relative group">
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                                    {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">No Img</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-white truncate">{member.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{member.relation} • {member.phone}</p>
                                </div>
                                <button onClick={() => removeFamilyMember(idx)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold text-sm mb-4">Add New Member</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <input type="text" placeholder="Name" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} className="px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                            <input type="text" placeholder="Relation" value={newMember.relation} onChange={e => setNewMember({ ...newMember, relation: e.target.value })} className="px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                            <input type="tel" placeholder="Phone" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} className="px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700" />
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 bg-white cursor-pointer hover:bg-slate-50">
                                <Camera size={16} className="text-slate-400" />
                                <span className="text-sm text-slate-500 truncate">{newMember.photoURL ? 'Photo Added' : 'Add Photo'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false, -2)} />
                            </label>
                        </div>
                        <button onClick={addFamilyMember} className="mt-4 w-full py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> Add Member
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-70"
                >
                    {saving ? 'Saving...' : <>Save Changes <Save size={20} /></>}
                </motion.button>
            </main>
        </div>
    );
};

export default ElderProfilePage; // Default export for lazy loading compatibility if needed
