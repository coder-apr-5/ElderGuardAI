import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import {
    FormInput,
    GradientButton,
    sendPasswordResetEmail,
    forgotPasswordSchema,
    type ForgotPasswordFormData
} from '@elder-nest/shared';

const ForgotPasswordPage = () => {
    const [isSent, setIsSent] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            await sendPasswordResetEmail(data.email);
            setIsSent(true);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {!isSent ? (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
                            <p className="text-gray-500">Enter your email to receive recovery instructions.</p>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <FormInput
                                label="Email Address"
                                type="email"
                                icon={Mail}
                                sizeVariant="family"
                                {...register('email')}
                                error={errors.email?.message}
                            />
                            <GradientButton type="submit" size="family" className="w-full">
                                Send Reset Link
                            </GradientButton>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                        <p className="text-gray-500 mb-8">We've sent you a password reset link.</p>
                        <Link to="/auth/login">
                            <GradientButton variant="secondary" size="family" className="w-full">
                                Back to Login
                            </GradientButton>
                        </Link>
                    </div>
                )}
                <div className="mt-6 text-center">
                    <Link to="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
