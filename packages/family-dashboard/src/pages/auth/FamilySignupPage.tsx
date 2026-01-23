import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Phone, User, Users, QrCode, ArrowRight } from 'lucide-react';

import {
    FormInput,
    GradientButton,
    signUpFamily,
    familySignupSchema,
    type FamilySignupFormData,
    getFriendlyErrorMessage
} from '@elder-nest/shared';

const SignupPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form
    const { register, handleSubmit, trigger, watch, formState: { errors } } = useForm<FamilySignupFormData>({
        resolver: zodResolver(familySignupSchema),
        defaultValues: {
            connectionOption: 'have_code'
        }
    });

    const connectionOption = watch('connectionOption');

    const nextStep = async () => {
        let fields: (keyof FamilySignupFormData)[] = [];
        if (step === 1) fields = ['email', 'password', 'confirmPassword'];
        if (step === 2) fields = ['fullName', 'countryCode', 'phone', 'relationship'];

        const isValid = await trigger(fields);
        if (isValid) setStep(step + 1);
    };

    const onSubmit = async (data: FamilySignupFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            await signUpFamily(data);
            navigate('/dashboard');
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row shadow-2xl my-auto bg-white dark:bg-gray-800 rounded-3xl overflow-hidden m-4 min-h-[600px]">

                {/* Sidebar Progress */}
                <div className="w-full md:w-1/3 bg-gray-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">

                    {/* Progress Steps */}
                    <div className="z-10 mt-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600 text-gray-400'}`}>1</div>
                            <span className={step >= 1 ? 'font-semibold text-white' : 'text-gray-400'}>Account Details</span>
                        </div>
                        <div className="w-0.5 h-8 bg-gray-700 ml-5"></div>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600 text-gray-400'}`}>2</div>
                            <span className={step >= 2 ? 'font-semibold text-white' : 'text-gray-400'}>Personal Info</span>
                        </div>
                        <div className="w-0.5 h-8 bg-gray-700 ml-5"></div>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600 text-gray-400'}`}>3</div>
                            <span className={step >= 3 ? 'font-semibold text-white' : 'text-gray-400'}>Connect Elder</span>
                        </div>
                    </div>

                    <div className="z-10 mt-auto">
                        <p className="text-gray-400 text-sm">Already have an account? <Link to="/auth/login" className="text-white hover:underline">Log in</Link></p>
                    </div>

                    {/* Background Blob */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                </div>

                {/* Main Form Area */}
                <div className="flex-1 p-10 md:p-16 relative">
                    <div className="max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Create Family Account</h2>

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
                                        <FormInput label="Email" type="email" icon={Mail} sizeVariant="family" {...register('email')} error={errors.email?.message} />
                                        <FormInput label="Password" type="password" icon={Lock} sizeVariant="family" {...register('password')} error={errors.password?.message} />
                                        <FormInput label="Confirm Password" type="password" icon={Lock} sizeVariant="family" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
                                        <GradientButton type="button" onClick={nextStep} className="w-full mt-6">Next Step</GradientButton>
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
                                        <FormInput label="Full Name" icon={User} sizeVariant="family" {...register('fullName')} error={errors.fullName?.message} />

                                        {/* Phone Number with Country Code */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                            <div className="flex gap-2">
                                                <select
                                                    {...register('countryCode')}
                                                    className="w-32 h-14 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500 text-sm"
                                                >
                                                    <option value="">Code</option>
                                                    <option value="+1">🇺🇸 +1</option>
                                                    <option value="+44">🇬🇧 +44</option>
                                                    <option value="+91">🇮🇳 +91</option>
                                                    <option value="+86">🇨🇳 +86</option>
                                                    <option value="+81">🇯🇵 +81</option>
                                                    <option value="+49">🇩🇪 +49</option>
                                                    <option value="+33">🇫🇷 +33</option>
                                                    <option value="+61">🇦🇺 +61</option>
                                                    <option value="+55">🇧🇷 +55</option>
                                                    <option value="+52">🇲🇽 +52</option>
                                                    <option value="+7">🇷🇺 +7</option>
                                                    <option value="+82">🇰🇷 +82</option>
                                                    <option value="+39">🇮🇹 +39</option>
                                                    <option value="+34">🇪🇸 +34</option>
                                                    <option value="+31">🇳🇱 +31</option>
                                                    <option value="+46">🇸🇪 +46</option>
                                                    <option value="+47">🇳🇴 +47</option>
                                                    <option value="+41">🇨🇭 +41</option>
                                                    <option value="+971">🇦🇪 +971</option>
                                                    <option value="+966">🇸🇦 +966</option>
                                                    <option value="+65">🇸🇬 +65</option>
                                                    <option value="+60">🇲🇾 +60</option>
                                                    <option value="+63">🇵🇭 +63</option>
                                                    <option value="+62">🇮🇩 +62</option>
                                                    <option value="+84">🇻🇳 +84</option>
                                                    <option value="+27">🇿🇦 +27</option>
                                                    <option value="+234">🇳🇬 +234</option>
                                                    <option value="+20">🇪🇬 +20</option>
                                                </select>
                                                <input
                                                    type="tel"
                                                    {...register('phone')}
                                                    placeholder="Phone number"
                                                    className="flex-1 h-14 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                            {errors.countryCode && <p className="text-red-500 text-sm">{errors.countryCode.message}</p>}
                                            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Relationship to Elder</label>
                                            <select
                                                {...register('relationship')}
                                                className="w-full h-14 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500"
                                            >
                                                <option value="">Select relationship</option>
                                                <option value="son">Son</option>
                                                <option value="daughter">Daughter</option>
                                                <option value="caregiver">Caregiver</option>
                                                <option value="other">Other</option>
                                            </select>
                                            {errors.relationship && <p className="text-red-500 text-sm">{errors.relationship.message}</p>}
                                        </div>

                                        <GradientButton type="button" onClick={nextStep} className="w-full mt-6">Next Step</GradientButton>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${connectionOption === 'have_code' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" value="have_code" {...register('connectionOption')} className="w-5 h-5 text-indigo-600" />
                                                    <div>
                                                        <div className="font-semibold text-gray-900">I have an invitation code</div>
                                                        <div className="text-sm text-gray-500">My elder already has the app</div>
                                                    </div>
                                                </div>
                                            </label>

                                            <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${connectionOption === 'later' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" value="later" {...register('connectionOption')} className="w-5 h-5 text-indigo-600" />
                                                    <div>
                                                        <div className="font-semibold text-gray-900">My elder will join later</div>
                                                        <div className="text-sm text-gray-500">I'll invite them after signup</div>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {connectionOption === 'have_code' && (
                                            <div className="mt-4">
                                                <FormInput
                                                    label="6-Digit Connection Code"
                                                    placeholder="XXX-XXX"
                                                    sizeVariant="family"
                                                    {...register('connectionCode')}
                                                    error={errors.connectionCode?.message}
                                                    className="text-center tracking-widest uppercase font-mono"
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3 mt-4">
                                            <input type="checkbox" {...register('agreeToTerms')} className="mt-1 w-5 h-5 text-indigo-600" />
                                            <span className="text-sm text-gray-600">I agree to Terms & Privacy Policy</span>
                                        </div>
                                        {errors.agreeToTerms && <p className="text-red-500 text-sm">{errors.agreeToTerms.message}</p>}

                                        {error && <p className="text-red-500 text-center">{error}</p>}

                                        <GradientButton type="submit" loading={isLoading} className="w-full mt-4" size="family">
                                            Complete Signup
                                        </GradientButton>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
