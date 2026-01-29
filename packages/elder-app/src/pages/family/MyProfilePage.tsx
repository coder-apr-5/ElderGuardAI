import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Camera, Save, Plus, Trash2, User } from 'lucide-react';
import { auth, db } from '@elder-nest/shared';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { FamilyUser, FamilyMemberManual } from '@elder-nest/shared';

export const MyProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [familyMembers, setFamilyMembers] = useState<FamilyMemberManual[]>([]);
    const [newMember, setNewMember] = useState<FamilyMemberManual>({ name: '', relation: '', phone: '' });

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        address: '',
        state: '',
        nationality: '',
        relationship: '', // Relationship to Elder
        dob: '',
        photoURL: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (auth.currentUser) {
                const docRef = doc(db, 'users', auth.currentUser.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data() as FamilyUser;

                    setFormData({
                        fullName: data.fullName || '',
                        phoneNumber: data.phone || '',
                        email: data.email || auth.currentUser.email || '',
                        address: data.address || '',
                        state: data.state || '',
                        nationality: data.nationality || '',
                        relationship: typeof data.relationship === 'string' ? data.relationship : '',
                        dob: data.dob || '',
                        photoURL: data.photoURL || ''
                    });
                    setFamilyMembers(data.manualOtherFamilyMembers || []);
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
                    const updated = [...familyMembers];
                    updated[index].photoURL = result;
                    setFamilyMembers(updated);
                } else {
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
                fullName: formData.fullName,
                phone: formData.phoneNumber,
                address: formData.address,
                state: formData.state,
                nationality: formData.nationality,
                relationship: formData.relationship,
                dob: formData.dob,
                photoURL: formData.photoURL,
                manualOtherFamilyMembers: familyMembers,
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 grid md:grid-cols-3 gap-8">
                {/* Photo Column */}
                <div className="md:col-span-1 flex flex-col items-center">
                    <div className="relative group w-40 h-40">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User size={64} />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-lg transition-colors">
                            <Camera size={18} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e)} />
                        </label>
                    </div>
                </div>

                {/* Form Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Full Name</label>
                            <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Email (Read Only)</label>
                            <input type="text" value={formData.email} disabled className="w-full px-4 py-2 rounded-lg border bg-gray-50 text-gray-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Phone</label>
                            <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                            <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">Address</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">State</label>
                            <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Nationality</label>
                            <input type="text" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">Relationship with Elder</label>
                            <select value={formData.relationship} onChange={e => setFormData({ ...formData, relationship: e.target.value })} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Select Relationship</option>
                                <option value="son">Son</option>
                                <option value="daughter">Daughter</option>
                                <option value="spouse">Spouse</option>
                                <option value="grandchild">Grandchild</option>
                                <option value="sibling">Sibling</option>
                                <option value="caregiver">Caregiver</option>
                                <option value="friend">Friend</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Other Family Members */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <User size={20} className="text-purple-500" />
                    Other Family Members
                </h3>

                <div className="space-y-4">
                    {familyMembers.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">No Img</div>}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-800">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.phone}</p>
                            </div>
                            <button onClick={() => removeFamilyMember(idx)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                        <h4 className="font-semibold text-sm mb-4 text-gray-600">Add New Contact</h4>
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                            <input type="text" placeholder="Name" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} className="px-3 py-2 rounded-lg border" />
                            <input type="tel" placeholder="Phone" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} className="px-3 py-2 rounded-lg border" />
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white cursor-pointer hover:bg-gray-50">
                                <Camera size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-500 truncate">{newMember.photoURL ? 'Photo Selected' : 'Add Photo'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false, -2)} />
                            </label>
                        </div>
                        <Button onClick={addFamilyMember} variant="outline" className="w-full border-dashed border-gray-400 text-gray-600 hover:text-blue-600 hover:border-blue-500">
                            <Plus size={16} className="mr-2" /> Add Family Member
                        </Button>
                    </div>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {saving ? 'Saving...' : <>Save Profile <Save size={20} /></>}
            </motion.button>
        </div>
    );
};
