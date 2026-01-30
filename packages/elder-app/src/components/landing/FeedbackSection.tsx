import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '@elder-nest/shared';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const FeedbackSection = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState<number>(5);
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setStatus('submitting');
        try {
            await addDoc(collection(db, 'feedback'), {
                email,
                message,
                rating,
                timestamp: serverTimestamp(),
                source: 'landing_page'
            });
            setStatus('success');
            setMessage('');
            setEmail('');
        } catch (error) {
            console.error("Error submitting feedback:", error);
            setStatus('error');
        }
    };

    return (
        <section className="py-24 bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-500 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-4xl mx-auto px-6 z-10">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-mono">Real-Time Feedback</h2>
                        <p className="text-indigo-200 text-lg">
                            We are constantly improving ElderGuardAI. Tell us what you think or report an issue.
                            <span className="block text-sm mt-1 text-teal-400 font-semibold uppercase tracking-wider">Live Submission</span>
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl"
                >
                    {status === 'success' ? (
                        <div className="text-center py-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-2">Feedback Received!</h3>
                            <p className="text-indigo-200 mb-8">Thank you for helping us make ElderGuardAI better.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors font-medium"
                            >
                                Send another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-indigo-200">Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-indigo-200">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                            >
                                                <Star
                                                    className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-indigo-200">Your Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us about a bug, a feature request, or your experience..."
                                    required
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none transition-all h-32 resize-none placeholder:text-slate-500"
                                />
                            </div>

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>Something went wrong. Please try again.</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === 'submitting' ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        Send Feedback <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </section>
    );
};
