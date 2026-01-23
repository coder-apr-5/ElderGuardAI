import { z } from 'zod';

// Phone validation regex - supports formats like +1234567890, +91 9876543210, etc.
const phoneRegex = /^\+[1-9]\d{0,2}[\s-]?\d{6,14}$/;

// Common schemas
export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

// Elder schemas - using Date of Birth instead of Age
export const elderSignupSchema = z.object({
    fullName: z.string().min(2, 'Please enter your full name (at least 2 characters)'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    dateOfBirth: z.string().min(1, 'Please enter your date of birth').refine((val) => {
        const date = new Date(val);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        return age >= 50 && age <= 120;
    }, { message: 'You must be at least 50 years old' }),
    emergencyContact: z.string().regex(phoneRegex, 'Please enter a valid phone number with country code (e.g., +1 234 567 8900)'),
    connectionCode: z.string().length(6, 'Code must be exactly 6 characters').optional().or(z.literal('')),
    agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }) }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ElderSignupFormData = z.infer<typeof elderSignupSchema>;

// Family schemas - Password match validation first, then connection code
export const familySignupSchema = z.object({
    fullName: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    countryCode: z.string().min(1, 'Please select a country code'),
    phone: z.string().min(6, 'Please enter a valid phone number'),
    relationship: z.enum(['son', 'daughter', 'caregiver', 'other'], {
        errorMap: () => ({ message: 'Please select a relationship' })
    }),
    connectionOption: z.enum(['have_code', 'later']),
    connectionCode: z.string().optional(),
    agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }) }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
}).refine(data => {
    if (data.connectionOption === 'have_code') {
        return data.connectionCode && data.connectionCode.length === 6;
    }
    return true;
}, {
    message: "Please enter the 6-digit code",
    path: ["connectionCode"],
});

export type FamilySignupFormData = z.infer<typeof familySignupSchema>;
