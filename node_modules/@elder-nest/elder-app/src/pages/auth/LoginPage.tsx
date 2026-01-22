import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Heart } from 'lucide-react';

import {
    AuthLayout,
    FormInput,
    GradientButton,
    OAuthButton,
    signInWithEmail,
    loginSchema,
    LoginFormData,
    getFriendlyErrorMessage
} from '@elder-nest/shared';

const LoginPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
            navigate('/'); // Redirect to dashboard
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            backgroundVariant="elder"
            showBackButton={true}
            title="Welcome Back"
            subtitle="We missed you!"
        >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-white/50 relative overflow-hidden">

                {/* Decorative Heart */}
                <div className="absolute top-6 right-6 text-pink-400 rotate-12 animate-pulse">
                    <Heart fill="currentColor" size={32} />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Email Field */}
                    <FormInput
                        label="Email Address"
                        type="email"
                        icon={Mail}
                        sizeVariant="elder"
                        {...register('email')}
                        error={errors.email?.message}
                        placeholder="your.email@example.com"
                    />

                    {/* Password Field */}
                    <FormInput
                        label="Password"
                        type="password"
                        icon={Lock}
                        sizeVariant="elder"
                        {...register('password')}
                        error={errors.password?.message}
                    />

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between mt-2 mb-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('rememberMe')}
                                className="w-6 h-6 border-2 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            />
                            <span className="text-gray-600 text-lg">Keep me signed in</span>
                        </label>

                        <Link
                            to="/auth/forgot-password"
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-lg transition-colors underline decoration-transparent hover:decoration-indigo-600"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, shake: 10 }}
                            animate={{ opacity: 1, x: [0, -10, 10, 0] }}
                            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-center font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <GradientButton
                        type="submit"
                        size="elder"
                        loading={isLoading}
                        className="w-full text-xl mt-4"
                    >
                        Sign In
                    </GradientButton>

                    {/* Divider */}
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-lg">or continue with</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {/* Social Login */}
                    <OAuthButton
                        role="elder"
                        onSuccess={() => navigate('/')}
                        onError={(msg) => setError(msg)}
                    />

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600 text-lg">
                            Don't have an account?{' '}
                            <Link to="/auth/signup" className="text-indigo-600 font-bold hover:underline text-xl">
                                Sign Up
                            </Link>
                        </p>
                    </div>

                </form>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;
