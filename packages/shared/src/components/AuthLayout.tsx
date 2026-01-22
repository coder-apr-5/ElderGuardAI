import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    backgroundVariant: 'elder' | 'family';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    title,
    subtitle,
    showBackButton = false,
    backgroundVariant
}) => {
    const navigate = useNavigate();

    // Elder App: Warm, Light Blue to Teal
    // Family App: Deep Blue to Purple (often split screen, but this component handles the mobile/generic view wrapper if needed)

    const bgClass = backgroundVariant === 'elder'
        ? "bg-gradient-to-br from-blue-50 via-white to-teal-50"
        : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"; // Family might handle its own split screen in page

    return (
        <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden ${bgClass}`}>

            {/* Animated Background Elements (Bubbles) - primarily for Elder App */}
            {backgroundVariant === 'elder' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ y: [0, -50, 0], x: [0, 30, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-10 left-10 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ y: [0, 40, 0], x: [0, -30, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-10 right-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl"
                    />
                </div>
            )}

            <div className="w-full max-w-md md:max-w-lg z-10">
                {showBackButton && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate(-1)}
                        className="mb-6 flex items-center text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Back
                    </motion.button>
                )}

                {(title || subtitle) && (
                    <div className="text-center mb-8">
                        {title && (
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-3xl md:text-4xl font-bold mb-2 ${backgroundVariant === 'elder' ? 'text-gray-800' : 'text-gray-900 dark:text-white'}`}
                            >
                                {title}
                            </motion.h1>
                        )}
                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-gray-500 dark:text-gray-400 text-lg"
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
};

export default AuthLayout;
