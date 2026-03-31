import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Pill, Bell, Heart, Plus, X } from 'lucide-react';
import { auth } from '@elder-nest/shared';

const ProfileSetupPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [complete, setComplete] = useState(false);
    const [medications, setMedications] = useState<string[]>([]);
    const [newMed, setNewMed] = useState('');
    const [reminders, setReminders] = useState({ medication: true, family: false });

    const addMedication = () => {
        if (newMed.trim()) {
            setMedications([...medications, newMed.trim()]);
            setNewMed('');
        }
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleComplete = async () => {
        setIsLoading(true);

        try {
            // Save medications to localStorage
            const user = auth.currentUser;
            if (user) {
                const dataStr = localStorage.getItem(`users_${user.uid}`);
                const data = dataStr ? JSON.parse(dataStr) : {};
                localStorage.setItem(`users_${user.uid}`, JSON.stringify({
                    ...data,
                    medications: medications,
                    notificationPreferences: reminders,
                    profileSetupComplete: true
                }));
            }

            setComplete(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setIsLoading(false);
        }
    };

    if (complete) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef3e2 0%, #fce7f3 100%)' }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' }}
                    >
                        <Check className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">You're All Set!</h1>
                    <p className="text-gray-600">Welcome to ElderNest. Redirecting to your dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #fef3e2 0%, #fce7f3 100%)' }}>
            {/* Left Side - Decorative */}
            <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden items-center justify-center p-8"
                style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)'
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-40 right-20 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 text-white text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-white" fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3">Almost There!</h1>
                    <p className="text-lg text-white/80 max-w-sm">
                        Let's personalize your experience to help you stay healthy and connected.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-8 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center gap-2 mb-6">
                        <Heart className="w-6 h-6 text-orange-500" fill="currentColor" />
                        <span className="text-lg font-bold text-gray-800">ElderNest</span>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Setup Your Profile</h2>
                        <p className="text-gray-500 text-sm mb-6">Customize your experience</p>

                        <div className="space-y-6">
                            {/* Photo Upload */}
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full mx-auto flex items-center justify-center border-4 border-dashed border-orange-200 relative cursor-pointer hover:from-orange-200 hover:to-pink-200 transition-all">
                                    <Camera className="w-8 h-8 text-orange-400" />
                                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-orange-400 to-pink-400 p-1.5 rounded-full text-white">
                                        <Plus size={14} />
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Tap to upload a photo</p>
                            </div>

                            {/* Medications */}
                            <div>
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-800">
                                    <Pill className="w-4 h-4 text-orange-500" /> Daily Medications
                                </h3>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        value={newMed}
                                        onChange={(e) => setNewMed(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
                                        placeholder="e.g. Aspirin"
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={addMedication}
                                        className="px-4 py-2.5 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {medications.map((med, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm">
                                            {med}
                                            <button onClick={() => removeMedication(i)} className="hover:text-orange-900">
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                    {medications.length === 0 && (
                                        <span className="text-gray-400 text-sm italic">No medications added yet</span>
                                    )}
                                </div>
                            </div>

                            {/* Notifications */}
                            <div>
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-800">
                                    <Bell className="w-4 h-4 text-pink-500" /> Notifications
                                </h3>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">Medication Reminders</span>
                                        <button
                                            type="button"
                                            onClick={() => setReminders({ ...reminders, medication: !reminders.medication })}
                                            className={`w-12 h-7 rounded-full relative transition-colors ${reminders.medication ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${reminders.medication ? 'right-0.5' : 'left-0.5'
                                                }`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">Family Updates</span>
                                        <button
                                            type="button"
                                            onClick={() => setReminders({ ...reminders, family: !reminders.family })}
                                            className={`w-12 h-7 rounded-full relative transition-colors ${reminders.family ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${reminders.family ? 'right-0.5' : 'left-0.5'
                                                }`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Complete Button */}
                            <motion.button
                                type="button"
                                onClick={handleComplete}
                                disabled={isLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3.5 font-semibold text-white rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                                }}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Setting Up...
                                    </span>
                                ) : (
                                    <>Finish Setup <Check size={18} /></>
                                )}
                            </motion.button>

                            {/* Skip */}
                            <p className="text-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
                                >
                                    Skip for now
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
