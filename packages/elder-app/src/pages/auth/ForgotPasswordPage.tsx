import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import {
    AuthLayout,
    FormInput,
    GradientButton,
    sendPasswordResetEmail,
    forgotPasswordSchema,
    ForgotPasswordFormData
} from '@elder-nest/shared';

const ForgotPasswordPage = () => {
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(data.email);
            setIsSent(true);
        } catch (err: any) {
            // In production, don't reveal if email exists or not, but for helpful UX here we might show something generic or specific.
            setError("Unable to process request. Please try again or check the email.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout backgroundVariant="elder" showBackButton={true} title="Reset Password">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 text-center">

                {!isSent ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <p className="text-gray-600 text-lg mb-6">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <FormInput
                            label="Email Address"
                            type="email"
                            icon={Mail}
                            sizeVariant="elder"
                            {...register('email')}
                            error={errors.email?.message}
                        />

                        {error && <p className="text-red-500">{error}</p>}

                        <GradientButton
                            type="submit"
                            size="elder"
                            loading={isLoading}
                            className="w-full mt-4"
                        >
                            Send Reset Link
                        </GradientButton>
                    </form>
                ) : (
                    <div className="flex flex-col items-center py-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Check your email!</h3>
                        <p className="text-gray-600 text-lg mb-8">
                            We've sent a password reset link to your email.
                        </p>
                        <Link to="/auth/login">
                            <GradientButton size="elder" variant="secondary" className="w-full">
                                <ArrowLeft className="mr-2" size={20} /> Back to Login
                            </GradientButton>
                        </Link>
                    </div>
                )}

            </div>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
