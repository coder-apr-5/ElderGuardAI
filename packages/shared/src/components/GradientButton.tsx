import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(inputs.filter(Boolean).join(" "));
}

export interface GradientButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'elder' | 'family' | 'small';
    loading?: boolean;
    children: React.ReactNode;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
    ({ className, variant = 'primary', size = 'family', loading, children, disabled, ...props }, ref) => {

        const baseClass = "rounded-full font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden";

        const sizeClasses = {
            elder: "h-20 text-2xl px-12",
            family: "h-14 text-lg px-8",
            small: "h-10 text-sm px-4"
        };

        const variantClasses = {
            primary: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:brightness-110",
            secondary: "bg-white border-2 border-indigo-200 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50",
            ghost: "bg-transparent text-gray-600 hover:bg-gray-100" // Simple ghost
        };

        // Custom overrides for specific requests (Elder vs Family specific gradients can be passed in className too, 
        // but default Primary is generic "Brand" gradient.
        // Elder App primary: Linear gradient from Soft Blue (#6366F1) to Teal (#14B8A6)
        // Family Dashboard primary: Deep Blue (#1E40AF) to Purple (#7C3AED)

        // We can handle this via className prop passed from the app specific pages, 
        // OR we can make `variant` support 'elder-primary' and 'family-primary'.
        // Let's stick to passing `className` to override gradient if needed, or use a default that looks good.

        return (
            <motion.button
                ref={ref}
                disabled={disabled || loading}
                whileHover={!disabled && !loading ? { scale: 1.02, translateY: -2 } : {}}
                whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
                className={cn(
                    baseClass,
                    sizeClasses[size],
                    variantClasses[variant],
                    (disabled || loading) && "opacity-70 cursor-not-allowed grayscale-[0.5]",
                    className
                )}
                {...props}
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : children}
            </motion.button>
        );
    }
);

GradientButton.displayName = 'GradientButton';
export default GradientButton;
