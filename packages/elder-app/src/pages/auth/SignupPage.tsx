import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Calendar, Phone, Link as LinkIcon, Check, ChevronRight, ChevronLeft } from 'lucide-react';

import {
    AuthLayout,
    FormInput,
    GradientButton,
    signUpElder,
    elderSignupSchema,
    type ElderSignupFormData,
    getFriendlyErrorMessage
} from '@elder-nest/shared';

const SignupPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form
    const { register, handleSubmit, trigger, formState: { errors } } = useForm<ElderSignupFormData>({
        resolver: zodResolver(elderSignupSchema),
        mode: 'onChange'
    });

    // Step validation
    const nextStep = async () => {
        let fieldsToValidate: (keyof ElderSignupFormData)[] = [];
        if (step === 1) fieldsToValidate = ['fullName', 'email', 'password', 'confirmPassword'];
        if (step === 2) fieldsToValidate = ['dateOfBirth', 'emergencyContact'];

        // Trigger validation for current step
        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            setStep(prev => prev + 1);
            setError(null);
        }
    };

    const prevStep = () => setStep(prev => prev - 1);

    const onSubmit = async (data: ElderSignupFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            await signUpElder(data);
            // Success!
            // In a real app we might show a success screen here before redirecting
            navigate('/auth/profile-setup');
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    // Progress Bar
    const renderProgress = () => (
        <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
                <motion.div
                    key={s}
                    initial={false}
                    animate={{
                        scale: s === step ? 1.2 : 1,
                        backgroundColor: s <= step ? '#6366F1' : '#E5E7EB'
                    }}
                    className="w-4 h-4 rounded-full transition-colors duration-300"
                />
            ))}
        </div>
    );

    return (
        <AuthLayout backgroundVariant="elder" showBackButton={step === 1}>
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-2xl border border-white/50 max-w-xl mx-auto">

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-600 mb-2">
                        Create Your Account
                    </h2>
                    <p className="text-gray-500 font-medium">Step {step} of 3</p>
                </div>

                {renderProgress()}

                <form onSubmit={handleSubmit(onSubmit)}>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <FormInput
                                    label="Full Name"
                                    icon={User}
                                    sizeVariant="elder"
                                    {...register('fullName')}
                                    error={errors.fullName?.message}
                                />
                                <FormInput
                                    label="Email Address"
                                    type="email"
                                    icon={Mail}
                                    sizeVariant="elder"
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                                <FormInput
                                    label="Password"
                                    type="password"
                                    icon={Lock}
                                    sizeVariant="elder"
                                    {...register('password')}
                                    error={errors.password?.message}
                                />
                                <FormInput
                                    label="Confirm Password"
                                    type="password"
                                    icon={Lock}
                                    sizeVariant="elder"
                                    {...register('confirmPassword')}
                                    error={errors.confirmPassword?.message}
                                />
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-blue-50 p-4 rounded-xl mb-4 text-blue-800 text-lg">
                                    We need a few details to customize your experience.
                                </div>
                                <FormInput
                                    label="Date of Birth"
                                    type="date"
                                    icon={Calendar}
                                    sizeVariant="elder"
                                    {...register('dateOfBirth')}
                                    error={errors.dateOfBirth?.message?.toString()}
                                />
                                <FormInput
                                    label="Emergency Contact (Phone)"
                                    type="tel"
                                    icon={Phone}
                                    sizeVariant="elder"
                                    {...register('emergencyContact')}
                                    error={errors.emergencyContact?.message}
                                    placeholder="e.g. +1 234 567 8900"
                                />
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                                        <LinkIcon size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Family Connection</h3>
                                    <p className="text-gray-500 mt-2">
                                        If a family member gave you a code, enter it below. Otherwise, you can skip this.
                                    </p>
                                </div>

                                <FormInput
                                    label="Connection Code (Optional)"
                                    icon={LinkIcon}
                                    sizeVariant="elder"
                                    {...register('connectionCode')}
                                    error={errors.connectionCode?.message}
                                    placeholder="XXX-XXX"
                                    className="text-center tracking-widest uppercase font-mono"
                                    maxLength={6}
                                />

                                <div className="flex items-start gap-3 mt-6 p-4 bg-gray-50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        {...register('agreeToTerms')}
                                        className="w-6 h-6 mt-1 text-indigo-600"
                                    />
                                    <div className="text-sm text-gray-600">
                                        I agree to the <span className="text-indigo-600 underline">Terms of Service</span> and <span className="text-indigo-600 underline">Privacy Policy</span>.
                                    </div>
                                </div>
                                {errors.agreeToTerms && (
                                    <p className="text-red-500 text-sm ml-2 mt-1">{errors.agreeToTerms.message}</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex gap-4">
                        {step > 1 && (
                            <GradientButton
                                type="button"
                                onClick={prevStep}
                                variant="secondary"
                                size="elder"
                                className="w-1/3"
                            >
                                <ChevronLeft /> Back
                            </GradientButton>
                        )}

                        {step < 3 ? (
                            <GradientButton
                                type="button"
                                onClick={nextStep}
                                size="elder"
                                className="flex-1"
                            >
                                Next <ChevronRight />
                            </GradientButton>
                        ) : (
                            <GradientButton
                                type="submit"
                                loading={isLoading}
                                size="elder"
                                className="flex-1"
                            >
                                Complete Signup <Check />
                            </GradientButton>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 text-center text-red-500 font-medium bg-red-50 p-2 rounded-lg">
                            {error}
                        </div>
                    )}

                </form>
            </div>
        </AuthLayout>
    );
};

export default SignupPage;
