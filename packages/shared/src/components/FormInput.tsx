import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LucideIcon, AlertCircle } from 'lucide-react';

import { twMerge } from 'tailwind-merge';

// Simple utility if not imported
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(inputs.filter(Boolean).join(" "));
}

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: LucideIcon;
    error?: string;
    sizeVariant?: 'elder' | 'family';
    containerClassName?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, icon: Icon, error, sizeVariant = 'elder', className, type = 'text', containerClassName, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);
        const [internalValue, setInternalValue] = useState('');
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Merge refs
        React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        // Check if input has value (handles both controlled and uncontrolled scenarios)
        const hasValue = Boolean(props.value) || Boolean(props.defaultValue) || internalValue.length > 0;

        // Determine input type based on toggle
        const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

        // Height variables
        const heightClass = sizeVariant === 'elder' ? 'h-16 text-lg' : 'h-14 text-base';
        const iconSize = sizeVariant === 'elder' ? 24 : 20;

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            props.onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            props.onFocus?.(e);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setInternalValue(e.target.value);
            props.onChange?.(e);
        };

        return (
            <div className={cn("relative w-full mb-6", containerClassName)}>
                <div className="relative">
                    {/* Input Icon Left */}
                    {Icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                            <Icon size={iconSize} />
                        </div>
                    )}

                    {/* The Input */}
                    <input
                        ref={inputRef}
                        type={inputType}
                        className={cn(
                            "w-full bg-white border-2 rounded-xl outline-none transition-all duration-300 placeholder-transparent",
                            heightClass,
                            Icon ? "pl-12" : "pl-4",
                            type === 'password' ? "pr-12" : "pr-4",
                            error
                                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                : isFocused
                                    ? "border-indigo-500 ring-4 ring-indigo-100 scale-[1.01]"
                                    : "border-gray-200 hover:border-gray-300",
                            className
                        )}
                        placeholder={label} // Required for :placeholder-shown trick if using CSS only, but we use JS state
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        {...props}
                    />

                    {/* Floating Label */}
                    <label
                        className={cn(
                            "absolute left-4 transition-all duration-200 pointer-events-none text-gray-400",
                            Icon ? "left-12" : "left-4",
                            (isFocused || hasValue)
                                ? "-top-3 bg-white px-2 text-sm font-medium text-indigo-600"
                                : "top-1/2 -translate-y-1/2"
                        )}
                    >
                        {label}
                    </label>

                    {/* Loading/Success Indicators could go here */}

                    {/* Password Toggle */}
                    {type === 'password' && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
                        </button>
                    )}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-1 mt-1 text-red-500 text-sm ml-1"
                        >
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';
export default FormInput;
