import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    AlertCircle,
    CheckCircle2,
    Activity,
    Clock,
    Heart
} from "lucide-react";
import type { VisionResult } from "@/hooks/useVisionAnalysis";

interface AIInsightsPanelProps {
    result: VisionResult | null;
    isAnalyzing: boolean;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ result, isAnalyzing }) => {
    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'emergency':
            case 'critical':
                return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'warning':
            case 'high':
                return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default:
                return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        }
    };

    const getRiskStatus = () => {
        if (result?.fall.fall_detected) return { label: 'FALL DETECTED', icon: AlertCircle, variant: 'critical' };
        if (result?.health_state.alert_level === 'emergency') return { label: 'EMERGENCY', icon: AlertCircle, variant: 'critical' };
        if (result?.health_state.alert_level === 'warning') return { label: 'MONITOR', icon: Activity, variant: 'warning' };
        return { label: 'SAFE', icon: CheckCircle2, variant: 'safe' };
    };

    const status = getRiskStatus();

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={16} />
                    AI Insights
                </h4>
                <div className="flex items-center gap-2">
                    {isAnalyzing && (
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter"
                        >
                            Analyzing...
                        </motion.div>
                    )}
                    <div className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase ${getRiskColor(status.variant)}`}>
                        {status.label}
                    </div>
                </div>
            </div>

            {!result ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                    <Activity size={32} className="mb-2" />
                    <p className="text-xs font-medium">Waiting for feed...</p>
                </div>
            ) : (
                <div className="flex-1 space-y-4">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Heart size={12} />
                                <span className="text-[10px] font-bold uppercase">Mood</span>
                            </div>
                            <p className="text-lg font-bold text-white capitalize">
                                {result.emotion.emotion}
                            </p>
                            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.emotion.confidence * 100}%` }}
                                    className="h-full bg-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Activity size={12} />
                                <span className="text-[10px] font-bold uppercase">Body Pose</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                                {result.fall.posture || 'Detecting...'}
                            </p>
                            <p className="text-[10px] text-indigo-300 font-medium">
                                Angle: {result.fall.body_angle}° {result.fall.pose_detected ? '• Active' : '• Search...'}
                            </p>
                        </div>
                    </div>

                    {/* Recent Alerts List */}
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Clock size={10} />
                            Live Events
                        </h5>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {result.alerts.length > 0 ? (
                                    result.alerts.map((alert, idx) => (
                                        <motion.div
                                            key={`${alert.type}-${idx}`}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className={`flex items-start gap-2 p-2 rounded-xl border text-[11px] leading-tight ${getRiskColor(alert.severity)}`}
                                        >
                                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                            <p className="font-medium">{alert.message}</p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/5 text-emerald-400 text-[11px]"
                                    >
                                        <CheckCircle2 size={14} />
                                        <p>System monitoring; all environments secure.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
