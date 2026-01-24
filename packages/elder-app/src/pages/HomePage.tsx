import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { EmergencyButton } from "@/features/emergency/EmergencyButton";
import { MoodSelector } from "@/features/mood/MoodSelector";
import { MedicineList } from "@/features/medicine/MedicineList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export const HomePage = () => {
    // Initialize dark mode from localStorage or system preference
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('elderDarkMode');
            if (saved !== null) {
                return saved === 'true';
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // Apply dark mode class to document
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('elderDarkMode', String(isDarkMode));
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-[#F8F9FA]'}`}>
            <div className="space-y-8 pb-32 pt-6">
                {/* Dark Mode Toggle - Fixed Position */}
                <div className="fixed top-4 right-4 z-50">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleDarkMode}
                        className={`p-4 rounded-2xl shadow-lg transition-all duration-300 ${isDarkMode
                            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDarkMode ? <Sun size={28} /> : <Moon size={28} />}
                    </motion.button>
                </div>

                <header className="space-y-2 px-4">
                    <h1 className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Good Morning,<br />
                        <span className={isDarkMode ? 'text-teal-400' : 'text-primary'}>Martha!</span> ☀️
                    </h1>
                    <p className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        It's a beautiful Tuesday.
                    </p>
                </header>

                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-4"
                >
                    <Link to="/chat">
                        <div className={`rounded-3xl p-6 transition-all duration-300 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${isDarkMode
                            ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-700'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                            }`}>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl bg-white/20 rounded-full p-3 backdrop-blur-sm">
                                    🤗
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Talk to Mira</h2>
                                    <p className={`text-sm ${isDarkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>
                                        Your AI companion is here for you 24/7
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4"
                >
                    <div className={`rounded-3xl p-6 transition-colors duration-300 ${isDarkMode
                        ? 'bg-gray-800/80 border border-gray-700'
                        : 'glass-panel'
                        }`}>
                        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            How are you feeling?
                        </h2>
                        <MoodSelector />
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="px-4"
                >
                    <div className={`rounded-3xl p-6 transition-colors duration-300 ${isDarkMode
                        ? 'bg-gray-800/80 border border-gray-700'
                        : 'glass-panel'
                        }`}>
                        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Today's Medicine
                        </h2>
                        <MedicineList />
                    </div>
                </motion.section>

                <motion.div
                    className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                >
                    <div className="w-full max-w-lg pointer-events-auto">
                        <EmergencyButton />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
