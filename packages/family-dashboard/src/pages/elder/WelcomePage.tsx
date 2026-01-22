import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GradientButton } from '@elder-nest/shared';
import { Accessibility, Heart, ShieldCheck } from 'lucide-react'; // Example icons

export const WelcomePage = () => {
    // Design Philosophy match:
    // Primary Gradient: Soft Blue (#6366F1) to Teal (#14B8A6)
    // Large illustrations, friendly

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 relative overflow-hidden flex flex-col">

            {/* Background Animated Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[10%] left-[10%] w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ y: [0, 40, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[20%] right-[5%] w-96 h-96 bg-teal-200/40 rounded-full blur-3xl"
                />
            </div>

            <main className="flex-grow flex flex-col items-center justify-center p-6 text-center z-10">

                {/* Logo Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                    className="mb-8"
                >
                    <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-gradient-to-tr from-indigo-500 to-teal-400 rounded-3xl shadow-xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                        <Heart className="w-16 h-16 text-white text-opacity-90 fill-current" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-600 mb-4 tracking-tight">
                        ElderNest AI
                    </h1>
                </motion.div>

                {/* Tagline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.5 }}
                    className="mb-12 max-w-lg mx-auto"
                >
                    <p className="text-xl md:text-2xl text-gray-600 font-medium leading-relaxed">
                        Your AI Companion for <br /><span className="text-teal-600">Healthy</span> & <span className="text-indigo-600">Happy</span> Living
                    </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2, type: "spring", stiffness: 100 }}
                    className="flex flex-col gap-4 w-full max-w-sm"
                >
                    <Link to="/auth/signup">
                        <GradientButton
                            className="w-full text-xl shadow-indigo-200/50"
                            size="elder"
                            variant="primary"
                        >
                            Get Started
                        </GradientButton>
                    </Link>

                    <Link to="/auth/login">
                        <GradientButton
                            className="w-full text-xl border-2"
                            size="elder"
                            variant="secondary"
                        >
                            I Have an Account
                        </GradientButton>
                    </Link>
                </motion.div>

                {/* Accessibility Tools Hint (Mock) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="mt-12 flex gap-4 text-gray-400"
                >
                    <Accessibility className="w-6 h-6" />
                    <span className="text-sm">Accessibility options enabled automatically</span>
                </motion.div>

            </main>
        </div>
    );
};
