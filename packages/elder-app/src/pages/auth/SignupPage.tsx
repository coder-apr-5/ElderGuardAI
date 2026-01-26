import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Calendar, Phone, Check, ChevronRight, ChevronLeft, Heart, Sun, Sparkles } from 'lucide-react';
import { z } from 'zod';

import {
    OAuthButton,
    signUpElder,
    elderSignupSchema,
    getFriendlyErrorMessage
} from '@elder-nest/shared';

type ElderSignupFormData = z.infer<typeof elderSignupSchema>;

const SignupPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, trigger, formState: { errors } } = useForm<ElderSignupFormData>({
        resolver: zodResolver(elderSignupSchema),
        mode: 'onChange'
    });

    const nextStep = async () => {
        let fieldsToValidate: (keyof ElderSignupFormData)[] = [];
        if (step === 1) fieldsToValidate = ['fullName', 'email', 'password', 'confirmPassword'];
        if (step === 2) fieldsToValidate = ['dateOfBirth', 'emergencyContact'];

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
            console.log("Submitting elder signup...", data);
            await signUpElder(data);
            console.log("Signup successful, navigating to profile setup...");
            navigate('/auth/profile-setup');
        } catch (err: any) {
            console.error("Signup error:", err);
            setError(getFriendlyErrorMessage(err.code) || "Signup failed. Please try again.");
            setIsLoading(false);
        }
    };

    const stepTitles = [
        { title: 'Account Details', subtitle: 'Create your login credentials' },
        { title: 'Personal Info', subtitle: 'Tell us a bit about yourself' },
    ];

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Left Panel - Warm Gradient with Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex lg:w-5/12 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)'
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-40 right-20 w-48 h-48 bg-white rounded-full blur-3xl"></div>
                </div>

                {/* Floating Icons */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-24 right-16 text-white/30"
                >
                    <Sun size={40} />
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-32 left-12 text-white/25"
                >
                    <Heart size={36} fill="currentColor" />
                </motion.div>
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-1/2 right-8 text-white/20"
                >
                    <Sparkles size={32} />
                </motion.div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-8 text-white h-full">
                    {/* Logo & Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Heart className="w-6 h-6 text-white" fill="currentColor" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">ElderGuardAI</span>
                        </div>

                        <h1 className="text-3xl font-bold leading-tight mb-3">
                            Start your journey<br />
                            to a <span className="text-yellow-200">healthier life</span>
                        </h1>
                        <p className="text-base text-white/80 max-w-sm leading-relaxed">
                            Join thousands of elders who are taking control of their health with our easy-to-use platform.
                        </p>
                    </div>

                    {/* Step Progress */}
                    <div className="space-y-3">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${s === step ? 'bg-white/20 backdrop-blur-sm' : 'opacity-60'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s < step ? 'bg-green-400 text-white' :
                                    s === step ? 'bg-white text-orange-500' :
                                        'bg-white/30 text-white'
                                    }`}>
                                    {s < step ? <Check size={16} /> : s}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{stepTitles[s - 1].title}</p>
                                    <p className="text-xs text-white/70">{stepTitles[s - 1].subtitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Already have account */}
                    <p className="text-white/80 text-sm">
                        Already have an account?{' '}
                        <Link to="/auth/login" className="text-white font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>

            {/* Right Panel - Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full lg:w-7/12 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
                style={{ backgroundColor: '#fefcfb' }}
            >
                <div className="w-full max-w-md">
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Heart className="w-6 h-6 text-orange-500" fill="currentColor" />
                            <span className="text-lg font-bold text-gray-800">ElderNest</span>
                        </div>
                    </div>

                    {/* Step Indicator (Mobile) */}
                    <div className="lg:hidden flex justify-center gap-2 mb-6">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className={`w-3 h-3 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-gray-200'
                                    } ${s === step ? 'scale-125' : ''}`}
                            />
                        ))}
                    </div>

                    {/* Header */}
                    <div className="mb-6 text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{stepTitles[step - 1].title}</h2>
                        <p className="text-gray-500 text-sm">{stepTitles[step - 1].subtitle}</p>
                    </div>

                    {/* Form */}
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
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 text-sm">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                {...register('fullName')}
                                                placeholder="Enter your full name"
                                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                                            />
                                        </div>
                                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 text-sm">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                {...register('email')}
                                                placeholder="your.email@example.com"
                                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                                            />
                                        </div>
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 text-sm">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="password"
                                                {...register('password')}
                                                placeholder="Create a password"
                                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                                            />
                                        </div>
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 text-sm">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="password"
                                                {...register('confirmPassword')}
                                                placeholder="Confirm your password"
                                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                                            />
                                        </div>
                                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                                    </div>
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
                                    <div className="bg-orange-50 p-3 rounded-xl text-orange-800 text-sm">
                                        We need a few details to personalize your experience.
                                    </div>

                                    {/* Date of Birth */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 text-sm">Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="date"
                                                {...register('dateOfBirth')}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                                            />
                                        </div>
                                        {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message?.toString()}</p>}
                                    </div>

                                    {/* Emergency Contact with Country Code */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 text-sm">Emergency Contact</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="w-28 px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-sm"
                                                onChange={(e) => {
                                                    const phoneInput = document.getElementById('emergencyPhone') as HTMLInputElement;
                                                    if (phoneInput) {
                                                        const currentVal = phoneInput.value.replace(/^\+\d+\s?/, '');
                                                        phoneInput.value = e.target.value + ' ' + currentVal;
                                                        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
                                                    }
                                                }}
                                            >
                                                <option value="+1">🇺🇸 +1</option>
                                                <option value="+44">🇬🇧 +44</option>
                                                <option value="+91">🇮🇳 +91</option>
                                                <option value="+61">🇦🇺 +61</option>
                                                <option value="+86">🇨🇳 +86</option>
                                                <option value="+81">🇯🇵 +81</option>
                                                <option value="+49">🇩🇪 +49</option>
                                                <option value="+33">🇫🇷 +33</option>
                                                <option value="+39">🇮🇹 +39</option>
                                                <option value="+7">🇷🇺 +7</option>
                                                <option value="+55">🇧🇷 +55</option>
                                                <option value="+971">🇦🇪 +971</option>
                                                <option value="+65">🇸🇬 +65</option>
                                                <option value="+60">🇲🇾 +60</option>
                                            </select>
                                            <div className="relative flex-1">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    id="emergencyPhone"
                                                    type="tel"
                                                    {...register('emergencyContact')}
                                                    placeholder="+1 234 567 8900"
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                                                />
                                            </div>
                                        </div>
                                        {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.message}</p>}
                                    </div>

                                    {/* Terms */}
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl mt-4">
                                        <input
                                            type="checkbox"
                                            {...register('agreeToTerms')}
                                            className="w-5 h-5 mt-0.5 text-orange-500 rounded focus:ring-orange-400"
                                        />
                                        <p className="text-sm text-gray-600">
                                            I agree to the <Link to="#" className="text-orange-500 underline">Terms of Service</Link> and <Link to="#" className="text-orange-500 underline">Privacy Policy</Link>
                                        </p>
                                    </div>
                                    {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms.message}</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-center text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex gap-3">
                            {step > 1 && (
                                <motion.button
                                    type="button"
                                    onClick={prevStep}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} /> Back
                                </motion.button>
                            )}

                            {step < 2 ? (
                                <motion.button
                                    type="button"
                                    onClick={nextStep}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 py-3 font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                                    }}
                                >
                                    Continue <ChevronRight size={18} />
                                </motion.button>
                            ) : (
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 py-3 font-semibold text-white rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                                    }}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Creating Account...
                                        </span>
                                    ) : (
                                        <>Complete Signup <Check size={18} /></>
                                    )}
                                </motion.button>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center py-4 mt-4">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="px-4 text-gray-400 text-xs">Or sign up with</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Google Signup */}
                        <OAuthButton
                            role="elder"
                            onSuccess={() => navigate('/auth/profile-setup')}
                            onError={(msg) => setError(msg)}
                        />

                        {/* Mobile Sign In Link */}
                        <p className="lg:hidden text-center text-gray-600 text-sm mt-4">
                            Already have an account?{' '}
                            <Link to="/auth/login" className="text-orange-500 font-semibold">
                                Sign In
                            </Link>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;
