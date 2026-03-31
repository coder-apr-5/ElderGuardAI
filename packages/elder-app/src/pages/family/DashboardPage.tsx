import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { RiskMeter } from "@/features/family/risk/RiskMeter";
import { ActivityTimeline } from "@/features/family/activity/ActivityTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Pill, Heart, AlertTriangle, Users, Plus, Volume2, VolumeX } from "lucide-react";
import { useConnectedElders, useElderStatus } from "@/hooks/useElderData";

// Web Audio API helper for an alarm siren
const playAlertSound = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sawtooth';
        
        const now = audioCtx.currentTime;
        // Sweeping frequency for a siren effect
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.linearRampToValueAtTime(1000, now + 0.3);
        oscillator.frequency.linearRampToValueAtTime(600, now + 0.6);
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gainNode.gain.setValueAtTime(0.5, now + 0.55);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);

        oscillator.start(now);
        oscillator.stop(now + 0.6);
    } catch (e) {
        console.warn("Audio play failed (maybe browser autoplay blocked)", e);
    }
};

export const DashboardPage = () => {
    // 1. Fetch Connected Elders
    const { elders: realElders, loading: eldersLoading } = useConnectedElders();
    const [selectedElderId, setSelectedElderId] = useState<string | null>(null);

    // 2. Fetch Status for Selected Elder replaces Mocks used previously
    const elders = realElders;

    // Select the first elder by default when list loads
    useEffect(() => {
        if (elders.length > 0 && !selectedElderId) {
            setSelectedElderId(elders[0].uid);
        }
    }, [elders, selectedElderId]);

    // 2. Fetch Status for Selected Elder
    const { data: elderStatus, loading: statusLoading } = useElderStatus(selectedElderId);

    const currentElder = elders.find(e => e.uid === selectedElderId) || elders[0];

    const [isMuted, setIsMuted] = useState(false);

    // 3. Setup Emergency Alert Sound & Notifications
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (elderStatus?.isEmergency && !isMuted) {
            // Request notification permission if not asked
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }

            // Trigger visual browser notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("🚨 EMERGENCY ALERT! 🚨", {
                    body: `${currentElder?.name || 'Elder'} has triggered an SOS! Please check immediately.`,
                    icon: "/pwa-192.png",
                    requireInteraction: true
                });
            }

            // Play sound immediately, then on interval
            playAlertSound();
            interval = setInterval(playAlertSound, 800);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [elderStatus?.isEmergency, currentElder?.name, isMuted]);

    if (eldersLoading) {
        return <div className="p-8 text-center">Loading family members...</div>;
    }

    if (elders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6 text-slate-400 dark:text-slate-500">
                    <Users className="mx-auto h-16 w-16" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">No elders connected</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                    Get started by connecting to an elder using their unique 6-character share code to start receiving live updates and health data.
                </p>
                <Link 
                    to="/family/connect" 
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg hover:shadow-indigo-500/30"
                >
                    <Plus size={24} />
                    Connect an Elder
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                    Dashboard for <span className="text-indigo-600 dark:text-indigo-400">{currentElder?.name}</span>
                </h2>
                
                {/* Elder Switcher (Scrollable on small screens) */}
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    {elders.map(elder => (
                        <button
                            key={elder.uid}
                            onClick={() => setSelectedElderId(elder.uid)}
                            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${selectedElderId === elder.uid
                                ? 'bg-indigo-600 text-white border border-indigo-500 scale-105 z-10'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {elder.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Emergency Alert Banner */}
            {elderStatus?.isEmergency && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-pulse shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-[bounce_1s_infinite]"></div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 animate-bounce bg-red-100 p-2 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-lg text-red-700 font-extrabold tracking-tight">
                                    SOS ALERT TRIGGERED!
                                </p>
                                <p className="text-sm text-red-600 font-medium">
                                    Check on <span className="underline">{currentElder?.name}</span> immediately or dispatch help.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-3 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                            title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
                        >
                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} className="animate-pulse" />}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Score Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Risk Score</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statusLoading ? (
                            <div className="h-24 flex items-center justify-center text-sm text-gray-400">Analyzing...</div>
                        ) : (
                            <RiskMeter score={elderStatus?.riskScore || 0} />
                        )}
                    </CardContent>
                </Card>

                {/* Medicine Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Medicine Adherence</CardTitle>
                        <Pill className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{elderStatus?.medicineCompliance || 0}%</div>
                        <p className="text-xs text-muted-foreground">Today's compliance</p>
                        <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-1000"
                                style={{ width: `${elderStatus?.medicineCompliance || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ActivityTimeline />
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Mood Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
                        {statusLoading ? (
                            <span className="text-muted-foreground">Loading trends...</span>
                        ) : (
                            <div className="w-full h-full flex flex-col justify-between">
                                <div className="text-center mb-2">
                                    <span className="text-4xl mb-1 block">
                                        {elderStatus?.mood === 'happy' ? '😊' : elderStatus?.mood === 'sad' ? '😔' : elderStatus?.mood === 'okay' ? '😐' : '😐'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-600">Current: <span className="capitalize">{elderStatus?.mood || 'Neutral'}</span></span>
                                </div>
                                {/* Simple CSS Bar Graph Simulation */}
                                <div className="flex items-end justify-between gap-2 h-24 pb-2 px-2">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 group w-full">
                                            <div
                                                className="w-full bg-slate-100 rounded-t relative overflow-hidden"
                                                style={{ height: '80px' }}
                                            >
                                                <div
                                                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t transition-all duration-1000 group-hover:bg-indigo-400"
                                                    style={{ height: `${[40, 60, 30, 80, 50, 90, 70][i]}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">{day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
