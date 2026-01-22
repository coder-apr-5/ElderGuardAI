import { EmergencyButton } from "@/features/emergency/EmergencyButton";
import { MoodSelector } from "@/features/mood/MoodSelector";
import { MedicineList } from "@/features/medicine/MedicineList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export const HomePage = () => {
    return (
        <div className="space-y-8 pb-32 pt-6">
            <header className="space-y-2 px-4">
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Good Morning,<br /><span className="text-primary">Martha!</span> ☀️</h1>
                <p className="text-xl text-muted-foreground font-medium">It's a beautiful Tuesday.</p>
            </header>

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4"
            >
                <div className="glass-panel rounded-3xl p-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">How are you feeling?</h2>
                    <MoodSelector />
                </div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-4"
            >
                <div className="glass-panel rounded-3xl p-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Today's Medicine</h2>
                    <MedicineList />
                </div>
            </motion.section>

            <motion.div
                className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <div className="w-full max-w-lg pointer-events-auto">
                    <EmergencyButton />
                </div>
            </motion.div>
        </div>
    )
}
