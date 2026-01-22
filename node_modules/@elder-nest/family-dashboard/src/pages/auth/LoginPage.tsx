import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Moon, Sun, Shield } from 'lucide-react';

import {
    FormInput,
    GradientButton,
    OAuthButton,
    signInWithEmail,
    loginSchema,
    type LoginFormData,
    getFriendlyErrorMessage
} from '@elder-nest/shared';

const LoginPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDark, setIsDark] = useState(false);

    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');

    // Toggle Dark Mode (Mock - usually via context)
    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmail(data.email, data.password);
            if (roleParam === 'elder') {
                navigate('/elder');
            } else {
                navigate('/family');
            }
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex ${isDark ? 'dark bg-gray-900' : 'bg-white'}`}>

            {/* LEFT SIDE - Illustration & Stats (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white flex-col justify-between p-16">
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <Shield className="w-8 h-8 text-blue-200" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">ElderNest Family</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Stay connected with <br /> <span className="text-blue-200">your loved ones.</span>
                    </h1>
                    <p className="text-blue-100 text-xl max-w-md">
                        Monitor health, get real-time updates, and coordinate care effortlessly.
                    </p>
                </div>

                {/* Abstract Visual Elements */}
                <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-20 -top-20 w-[600px] h-[600px] border border-white/10 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-20 -top-20 w-[800px] h-[800px] border border-white/5 rounded-full"
                    />
                </div>

                <div className="z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 mt-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gray-300 border-2 border-indigo-800" />
                            ))}
                        </div>
                        <div className="text-sm font-medium">Trusted by 10,000+ families</div>
                    </div>
                    <p className="italic text-lg text-blue-50">"This app has given me so much peace of mind regarding my mother's health."</p>
                    <div className="mt-2 text-sm text-blue-200">— Sarah J., Caregiver</div>
                </div>
            </div>

            {/* RIGHT SIDE - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900 transition-colors duration-300 relative">

                {/* Theme Toggle */}
                <button onClick={toggleTheme} className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {isDark ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-600" />}
                </button>

                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sign into your account</h2>
                        <p className="text-gray-500 dark:text-gray-400">Access your family dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        <FormInput
                            label="Email address"
                            type="email"
                            sizeVariant="family"
                            {...register('email')}
                            error={errors.email?.message}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            containerClassName="mb-4"
                        />

                        <FormInput
                            label="Password"
                            type="password"
                            sizeVariant="family"
                            {...register('password')}
                            error={errors.password?.message}
                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            containerClassName="mb-2"
                        />

                        <div className="flex items-center justify-between mb-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('rememberMe')}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                            </label>

                            <Link
                                to="/auth/forgot-password"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <GradientButton
                            type="submit"
                            size="family"
                            variant="primary"
                            loading={isLoading}
                            className="w-full"
                        >
                            Sign In
                        </GradientButton>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <OAuthButton
                            role="family"
                            onSuccess={() => navigate('/dashboard')}
                            onError={(msg) => setError(msg)}
                            className="h-14"
                        />

                        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                            New to ElderNest?{' '}
                            <Link to="/auth/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                                Create an account
                            </Link>
                        </p>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
