import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Heart, Sun, Leaf } from 'lucide-react';
import { z } from 'zod';

import {
    OAuthButton,
    signInWithEmail,
    loginSchema
} from '@elder-nest/shared';

// Infer the type locally from loginSchema
type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            rememberMe: false
        }
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmail(data.email, data.password);
            if (roleParam === 'family') {
                navigate('/family');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Left Panel - Warm Gradient with Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                style={{
                    background: roleParam === 'family'
                        ? 'linear-gradient(135deg, #0f172a 0%, #0891b2 50%, #059669 100%)'
                        : 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)'
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-40 right-20 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-2xl"></div>
                </div>

                {/* Floating Icons */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-32 right-20 text-white/30"
                >
                    <Sun size={48} />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute bottom-60 left-16 text-white/20"
                >
                    <Leaf size={56} />
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1/2 right-32 text-white/25"
                >
                    <Heart size={40} fill="currentColor" />
                </motion.div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-8 text-white h-full">
                    {/* Logo & Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Heart className="w-7 h-7 text-white" fill="currentColor" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">ElderGuardAI</span>
                        </div>

                        {/* Main Tagline */}
                        <h1 className="text-4xl font-bold leading-tight mb-4">
                            {roleParam === 'family' ? (
                                <>
                                    Monitor your<br />
                                    loved ones based on,<br />
                                    <span className="text-teal-200">Real-time Data.</span>
                                </>
                            ) : (
                                <>
                                    Your companion<br />
                                    for a healthier,<br />
                                    <span className="text-yellow-200">happier life.</span>
                                </>
                            )}
                        </h1>
                        <p className="text-lg text-white/80 max-w-md leading-relaxed">
                            {roleParam === 'family'
                                ? "Peace of mind for you. Safety and independence for them. Stay connected always."
                                : "Simple health tracking, timely reminders, and caring support - all designed just for you."
                            }
                        </p>
                    </div>

                    {/* Testimonial */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 bg-orange-300 rounded-full border-2 border-white/50"></div>
                                <div className="w-8 h-8 bg-pink-300 rounded-full border-2 border-white/50"></div>
                                <div className="w-8 h-8 bg-purple-300 rounded-full border-2 border-white/50"></div>
                            </div>
                            <span className="text-white/90 font-medium text-sm">Loved by 5,000+ elders</span>
                        </div>
                        <p className="text-white/90 text-base italic leading-relaxed">
                            "ElderNest makes managing my health so easy. The reminders are gentle."
                        </p>
                        <p className="text-white/70 mt-2 font-medium text-sm">— Margaret, 72</p>
                    </div>
                </div>
            </motion.div>

            {/* Right Panel - Login Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8"
                style={{ backgroundColor: '#fefcfb' }}
            >
                <div className="w-full max-w-md">
                    {/* Dark Mode Toggle (Decorative) */}
                    <div className="flex justify-end mb-4">
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <Sun className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
                        <p className="text-gray-500">
                            Access your <span className={`font-medium ${roleParam === 'family' ? 'text-teal-600' : 'text-orange-500'}`}>
                                {roleParam === 'family' ? 'Family Portal' : 'personal dashboard'}
                            </span>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    {...register('email')}
                                    placeholder="your.email@example.com"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-white"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-2">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('rememberMe')}
                                    className="w-5 h-5 border-2 border-gray-300 rounded text-orange-500 focus:ring-orange-400 transition"
                                />
                                <span className="text-gray-600">Remember me</span>
                            </label>
                            <Link
                                to="/auth/forgot-password"
                                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 font-semibold text-white rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{
                                background: roleParam === 'family'
                                    ? 'linear-gradient(135deg, #0891b2 0%, #059669 100%)'
                                    : 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                            }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>

                        {/* Divider */}
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="px-4 text-gray-400 text-sm">Or continue with</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Google Login */}
                        <OAuthButton
                            role={roleParam === 'family' ? 'family' : 'elder'}
                            onSuccess={() => {
                                if (roleParam === 'family') {
                                    navigate('/family');
                                } else {
                                    navigate('/dashboard');
                                }
                            }}
                            onError={(msg) => setError(msg)}
                        />

                        {/* Developer Bypass (Only for testing) */}
                        {import.meta.env.DEV && (
                            <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.setItem('dev_bypass_auth', 'true');
                                        if (roleParam === 'family') navigate('/family');
                                        else navigate('/dashboard');
                                        window.location.reload();
                                    }}
                                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors border border-gray-300"
                                >
                                    🛠️ Developer Quick Access (No Login Required)
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-2 uppercase tracking-widest">
                                    Dev Only • Bypasses Firebase Auth
                                </p>
                            </div>
                        )}

                        {/* Sign Up Link */}
                        <p className="text-center text-gray-600 pt-2">
                            New to ElderNest?{' '}
                            <Link
                                to={roleParam === 'family' ? "/auth/signup?role=family" : "/auth/signup"}
                                className={`font-semibold hover:opacity-80 transition-colors ${roleParam === 'family' ? 'text-teal-600' : 'text-orange-500'}`}
                            >
                                {roleParam === 'family' ? 'Create a Family Account' : 'Create an account'}
                            </Link>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
