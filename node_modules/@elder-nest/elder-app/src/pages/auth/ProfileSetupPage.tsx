import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Pill, Clock, Bell } from 'lucide-react';
import { AuthLayout, GradientButton, FormInput } from '@elder-nest/shared';

// Mock setup, just UI as requested
const ProfileSetupPage = () => {
    const navigate = useNavigate();
    const [complete, setComplete] = useState(false);

    const handleComplete = () => {
        setComplete(true);
        setTimeout(() => {
            navigate('/');
        }, 2000);
    };

    if (complete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-teal-50">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Check className="w-16 h-16 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">You're All Set!</h1>
                    <p className="text-gray-600 mt-2">Welcome to ElderNest.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <AuthLayout backgroundVariant="elder" title="Setup Your Profile">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 max-w-lg mx-auto">
                <div className="space-y-8">

                    {/* Photo Upload Mock */}
                    <div className="text-center">
                        <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto flex items-center justify-center border-4 border-dashed border-gray-300 relative cursor-pointer hover:bg-gray-200 transition-colors">
                            <Camera className="w-10 h-10 text-gray-400" />
                            <div className="absolute bottom-0 right-0 bg-indigo-500 p-2 rounded-full text-white">
                                <Check size={16} />
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">Tap to upload a photo</p>
                    </div>

                    {/* Medical Info Mock */}
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Pill className="text-indigo-500" /> Daily Medications
                        </h3>
                        <div className="space-y-3">
                            <FormInput label="Medication Name" placeholder="e.g. Aspirin" sizeVariant="elder" />
                            <div className="flex gap-2">
                                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">Aspirin x</div>
                                <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm dashed border">+ Add</div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Bell className="text-teal-500" /> Notifications
                        </h3>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-lg text-gray-700">Medication Reminders</span>
                                <div className="w-14 h-8 bg-green-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-md" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg text-gray-700">Family Updates</span>
                                <div className="w-14 h-8 bg-gray-300 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <GradientButton onClick={handleComplete} size="elder" className="w-full">
                        Finish Setup
                    </GradientButton>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ProfileSetupPage;
