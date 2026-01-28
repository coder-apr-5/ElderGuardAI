import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Meh, Frown } from "lucide-react";

export const MoodSelector = () => {
    // Manual / DB State
    const [saving, setSaving] = useState(false);
    const [lastMood, setLastMood] = useState<string | null>(null);

    // Function to handle saving mood
    const saveMoodToDB = async (mood: string) => {
        setSaving(true);
        try {
            const { auth, db } = await import("@elder-nest/shared");
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

            const user = auth.currentUser;
            if (!user) {
                console.warn("No user logged in, cannot save mood");
                return;
            }

            // Save mood to Firestore
            await addDoc(collection(db, "moods"), {
                userId: user.uid,
                score: mood.toLowerCase().includes('happy') ? 1.0 : mood.toLowerCase().includes('sad') ? 0.0 : 0.5,
                label: mood,
                source: 'manual',
                timestamp: serverTimestamp()
            });

        } catch (error) {
            console.error("Failed to save mood", error);
        } finally {
            setSaving(false);
        }
    };

    const handleMoodClick = async (mood: string) => {
        setLastMood(mood);
        await saveMoodToDB(mood);

        // Reset selection visual after 3 seconds
        setTimeout(() => setLastMood(null), 3000);
    };

    return (
        <div className="space-y-6 w-full">
            {/* Manual Mood Buttons */}
            <div className="flex gap-4 justify-center w-full">
                <Button
                    variant={lastMood === 'happy' ? 'default' : 'outline'}
                    size="xl"
                    className={`flex-1 flex-col gap-2 h-auto py-8 transition-all rounded-3xl ${lastMood === 'happy'
                        ? 'bg-green-500 text-white border-green-600 scale-105 shadow-xl dark:bg-green-600'
                        : 'bg-white hover:bg-green-50 text-slate-700 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-green-500'
                        }`}
                    onClick={() => handleMoodClick('happy')}
                    disabled={saving}
                >
                    <Smile size={48} className={lastMood === 'happy' ? 'text-white' : 'text-green-500'} />
                    <span className="text-xl font-bold">Happy</span>
                </Button>

                <Button
                    variant={lastMood === 'okay' ? 'default' : 'outline'}
                    size="xl"
                    className={`flex-1 flex-col gap-2 h-auto py-8 transition-all rounded-3xl ${lastMood === 'okay'
                        ? 'bg-yellow-400 text-slate-900 border-yellow-500 scale-105 shadow-xl dark:bg-yellow-500'
                        : 'bg-white hover:bg-yellow-50 text-slate-700 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-yellow-400'
                        }`}
                    onClick={() => handleMoodClick('okay')}
                    disabled={saving}
                >
                    <Meh size={48} className={lastMood === 'okay' ? 'text-slate-900' : 'text-yellow-500'} />
                    <span className="text-xl font-bold">Okay</span>
                </Button>

                <Button
                    variant={lastMood === 'sad' ? 'default' : 'outline'}
                    size="xl"
                    className={`flex-1 flex-col gap-2 h-auto py-8 transition-all rounded-3xl ${lastMood === 'sad'
                        ? 'bg-red-500 text-white border-red-600 scale-105 shadow-xl dark:bg-red-600'
                        : 'bg-white hover:bg-red-50 text-slate-700 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-red-500'
                        }`}
                    onClick={() => handleMoodClick('sad')}
                    disabled={saving}
                >
                    <Frown size={48} className={lastMood === 'sad' ? 'text-white' : 'text-red-500'} />
                    <span className="text-xl font-bold">Sad</span>
                </Button>
            </div>
        </div>
    )
}
