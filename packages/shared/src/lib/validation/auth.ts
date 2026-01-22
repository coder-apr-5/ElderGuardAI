import { z } from 'zod';

// Common schemas
export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

// Elder schemas
export const elderSignupSchema = z.object({
    fullName: z.string().min(2, 'Please enter your full name (at least 2 characters)'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    age: z.coerce.number().min(50, 'Age must be at least 50').max(120, 'Please enter a valid age'), // coerce to handle string input from forms
    emergencyContact: z.string().min(10, 'Please enter a valid phone number'),
    connectionCode: z.string().length(6, 'Code must be exactly 6 characters').optional().or(z.literal('')),
    agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }) }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ElderSignupFormData = z.infer<typeof elderSignupSchema>;

// Family schemas
export const familySignupSchema = z.object({
    fullName: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    relationship: z.enum(['son', 'daughter', 'caregiver', 'other'], {
        errorMap: () => ({ message: 'Please select a relationship' })
    }),
    connectionOption: z.enum(['have_code', 'later']),
    connectionCode: z.string().optional(),
    agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }) }),
}).refine(data => {
    if (data.connectionOption === 'have_code') {
        return data.connectionCode && data.connectionCode.length === 6;
    }
    return true;
}, {
    message: "Please enter the 6-digit code",
    path: ["connectionCode"],
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type FamilySignupFormData = z.infer<typeof familySignupSchema>;
