import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

export const EmergencyButton = () => {
    const [isTriggered, setIsTriggered] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleEmergency = () => {
        setIsTriggered(true);
        // Simulate API call or Future AI Trigger
        setTimeout(() => {
            alert("Emergency Signal Sent! Family and Services Notified.");
            setIsTriggered(false);
        }, 2000);
    };

    return (
        <div className="relative flex items-center justify-center w-full py-4">
            {/* Pulsing Rings (Visual only) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 bg-red-500/20 rounded-full animate-pulse-ring" />
                <div className="w-24 h-24 bg-red-500/10 rounded-full animate-pulse-ring delay-75" />
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                onClick={handleEmergency}
                className={cn(
                    "relative z-10 flex items-center justify-between w-full max-w-sm p-2 pr-6 overflow-hidden transition-all duration-300 rounded-full shadow-2xl group",
                    isTriggered ? "bg-green-500" : "bg-gradient-to-r from-red-600 to-rose-600"
                )}
            >
                {/* Icon Circle */}
                <div className={cn(
                    "flex items-center justify-center w-16 h-16 rounded-full shadow-inner transition-colors duration-300",
                    isTriggered ? "bg-green-400 text-white" : "bg-white text-red-600"
                )}>
                    <AnimatePresence mode="wait">
                        {isTriggered ? (
                            <motion.div
                                key="check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <CheckCircle2 size={32} strokeWidth={3} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="alert"
                                animate={{ rotate: isHovered ? [0, -10, 10, -10, 0] : 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <AlertTriangle size={32} strokeWidth={3} fill="currentColor" fillOpacity={0.2} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Text Content */}
                <div className="flex flex-col items-start flex-1 ml-4 text-white">
                    <span className="text-xl font-bold tracking-wide uppercase">
                        {isTriggered ? "Help Sent!" : "Emergency SOS"}
                    </span>
                    <span className="text-red-100 text-sm font-medium opacity-90">
                        {isTriggered ? "Stay calm, help is coming" : "Tap to alert family instantly"}
                    </span>
                </div>

                {/* Arrow or Icon on Right */}
                <div className="text-white/80">
                    <Phone className={cn("w-6 h-6 transition-transform duration-300", isHovered ? "scale-110" : "")} />
                </div>
            </motion.button>
        </div>
    );
};
