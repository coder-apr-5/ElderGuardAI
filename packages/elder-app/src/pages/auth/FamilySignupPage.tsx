import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, Check, ChevronRight, ChevronLeft, Users, Shield, Heart } from 'lucide-react';
import { z } from 'zod';
import { OAuthButton, signUpFamily, getFriendlyErrorMessage } from '@elder-nest/shared';

// Define schema locally since we're adapting the UI structure
const familySignupSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Valid phone number is required'),
  countryCode: z.string().default('+91'),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms' }),
  }),
  connectionOption: z.enum(['have_code', 'later']).default('have_code'), // Default to entering code as it's a step
  connectionCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => {
  // If we are at the step where code is required (implied by this page flow), enforce it
  // Or if connectionOption is 'have_code'
  if (data.connectionOption === 'have_code') {
    return data.connectionCode && data.connectionCode.length === 6;
  }
  return true;
}, {
  message: "Please enter the 6-digit code",
  path: ["connectionCode"],
});

type FamilySignupFormData = z.infer<typeof familySignupSchema>;

const FamilySignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, trigger, setValue, watch, formState: { errors } } = useForm<FamilySignupFormData>({
    resolver: zodResolver(familySignupSchema),
    mode: 'onChange',
    defaultValues: {
      countryCode: '+91',
      connectionOption: 'have_code'
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof FamilySignupFormData)[] = [];
    if (step === 1) fieldsToValidate = ['fullName', 'email', 'password', 'confirmPassword'];

    if (step === 2) fieldsToValidate = ['phone', 'countryCode', 'agreeToTerms'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => prev + 1);
      setError(null);
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = async (data: FamilySignupFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Submitting family signup...", data);
      await signUpFamily({
        ...data,
        // Combine country code if needed or pass separately
        phone: `${data.countryCode} ${data.phone}`,
        relationship: 'other' // Default, can be updated later in profile
      });
      navigate('/family');
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(getFriendlyErrorMessage(err.code) || "Signup failed. Please try again.");
      setIsLoading(false);
    }
  };

  const stepTitles = [
    { title: 'Account Details', subtitle: 'Create your login credentials' },
    { title: 'Contact Info', subtitle: 'How can we reach you?' },
    { title: 'Verification', subtitle: 'Enter family code' },
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Panel - Family Branding Gradient */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-5/12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0e7490 50%, #059669 100%)'
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
          <Users size={40} />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-32 left-12 text-white/25"
        >
          <Shield size={36} fill="currentColor" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 text-white h-full">
          {/* Logo & Brand */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">ElderGuard Family</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight mb-3">
              Care for your<br />
              <span className="text-teal-200">loved ones</span> closely
            </h1>
            <p className="text-base text-white/80 max-w-sm leading-relaxed">
              Stay connected, monitor health updates, and provide the best care with ElderNest.
            </p>
          </div>

          {/* Step Progress */}
          <div className="space-y-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${s === step ? 'bg-white/20 backdrop-blur-sm' : 'opacity-60'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s < step ? 'bg-teal-400 text-white' :
                  s === step ? 'bg-white text-teal-600' :
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
            Already have a family account?{' '}
            <Link to="/auth/login?role=family" className="text-white font-semibold hover:underline">
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
        style={{ backgroundColor: '#f8fafc' }}
      >
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-teal-600" />
              <span className="text-lg font-bold text-gray-800">ElderNest Family</span>
            </div>
          </div>

          {/* Step Indicator (Mobile) */}
          <div className="lg:hidden flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${s <= step ? 'bg-teal-600' : 'bg-gray-200'
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
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
                  <div className="bg-teal-50 p-3 rounded-xl text-teal-800 text-sm">
                    We need your contact details to connect you with your family.
                  </div>

                  {/* Phone with Country Code */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        {...register('countryCode')}
                        className="w-28 px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-sm"
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
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          {...register('phone')}
                          placeholder="123 456 7890"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl mt-4">
                    <input
                      type="checkbox"
                      {...register('agreeToTerms')}
                      className="w-5 h-5 mt-0.5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <p className="text-sm text-gray-600">
                      I agree to the <Link to="#" className="text-teal-600 underline">Terms of Service</Link> and <Link to="#" className="text-teal-600 underline">Privacy Policy</Link>
                    </p>
                  </div>
                  {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms.message}</p>}
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
                  <div className="bg-teal-50 p-3 rounded-xl text-teal-800 text-sm">
                    Enter the unique family code found on your loved one's dashboard.
                  </div>

                  {/* Family Code */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Family Code</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('connectionCode')}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white tracking-widest text-lg font-mono uppercase"
                        onChange={(e) => {
                          setValue('connectionOption', 'have_code');
                          // default valid behavior
                          register('connectionCode').onChange(e);
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This connects your account to your elder.</p>
                    {errors.connectionCode && <p className="text-red-500 text-xs mt-1">{errors.connectionCode.message}</p>}
                  </div>
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

              {step < 3 ? (
                <motion.button
                  type="button"
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #0e7490 50%, #059669 100%)'
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
                    background: 'linear-gradient(135deg, #0f172a 0%, #0e7490 50%, #059669 100%)'
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Create Account...
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
              role="family"
              onSuccess={() => navigate('/family')}
              onError={(msg) => setError(msg)}
            />

            {/* Mobile Sign In Link */}
            <p className="lg:hidden text-center text-gray-600 text-sm mt-4">
              Already have an account?{' '}
              <Link to="/auth/login?role=family" className="text-teal-600 font-semibold">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default FamilySignupPage;
