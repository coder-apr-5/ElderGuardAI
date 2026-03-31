import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Camera,
    RefreshCw,
    AlertTriangle,
    Play,
    Square,
} from "lucide-react";
import { useVisionAnalysis } from "@/hooks/useVisionAnalysis";
import { useMediaPipeVision } from "@/hooks/useMediaPipeVision";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { type FamilyMemberManual } from "@elder-nest/shared";
import { ShieldCheck, ShieldAlert, UserCheck, ScanFace } from "lucide-react";


export const CameraMonitor: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [fps, setFps] = useState(0);
    const lastTimeRef = useRef(performance.now());
    const framesRef = useRef(0);

    // Modes: 'mood' | 'security'
    const [mode, setMode] = useState<'mood' | 'security'>('mood');

    // Security Mode State
    const [securityStatus, setSecurityStatus] = useState<'secure' | 'scanning' | 'alert'>('secure');
    const [detectedPerson, setDetectedPerson] = useState<{ name: string; relation: string; photo?: string } | null>(null);
    const [knownFaces, setKnownFaces] = useState<FamilyMemberManual[]>([]);

    const { analyzeFrame, analyzing } = useVisionAnalysis();
    const mediaPipeVision = useMediaPipeVision(videoRef, isActive && mode === 'mood');

    // Combine results for the UI
    const [lastResult, setLastResult] = useState<any>(null);

    // Sync mediaPipe results to the backendResult structure so AIInsightsPanel can read it
    useEffect(() => {
        if (mode === 'mood' && isActive) {
            setLastResult({
                emotion: {
                    emotion: mediaPipeVision.mood,
                    confidence: mediaPipeVision.moodConfidence
                },
                fall: {
                    fall_detected: false,
                    confidence: 0.9,
                    pose_detected: mediaPipeVision.pose !== 'Pose Unknown' && mediaPipeVision.pose !== 'No Person Detected',
                    posture: mediaPipeVision.pose,
                    body_angle: parseInt(mediaPipeVision.poseDetails.replace(/[^\d]/g, '')) || 0,
                },
                health_state: {
                    state: 'Healthy',
                    alert_level: 'normal'
                },
                security: {
                    intruder_detected: false
                },
                alerts: mediaPipeVision.mood === 'No Face Detected' ? [{ type: 'vision', severity: 'warning', message: 'No face detected in frame' }] : []
            });
        }
    }, [mediaPipeVision, mode, isActive]);

    // Fetch Known Faces (Family Members)
    useEffect(() => {
        const fetchFaces = async () => {
            const { auth } = await import("@elder-nest/shared");
            if (!auth.currentUser) return;
            const dataStr = localStorage.getItem(`users_${auth.currentUser.uid}`);
            if (dataStr) {
                const data = JSON.parse(dataStr);
                const manualMembers = data.manualFamilyMembers || [];
                setKnownFaces(manualMembers);
            }
        };
        fetchFaces();
        const interval = setInterval(fetchFaces, 5000);
        return () => clearInterval(interval);
    }, []);

    // Send Alert to Family Dashboard
    const sendSecurityAlert = async (msg: string) => {
        const { auth } = await import("@elder-nest/shared");
        if (!auth.currentUser) return;
        try {
            const elderDataStr = localStorage.getItem(`users_${auth.currentUser.uid}`);
            const elderData = elderDataStr ? JSON.parse(elderDataStr) : null;
            if (!elderData) return;
            
            const familyIds = elderData.familyMembers || [];

            familyIds.forEach((familyId: string) => {
                const famDocStr = localStorage.getItem(`users_${familyId}`);
                if (famDocStr) {
                    const famData = JSON.parse(famDocStr);
                    const notifs = famData.notifications || [];
                    notifs.push({
                        id: crypto.randomUUID(),
                        elderId: auth.currentUser!.uid,
                        type: 'security_alert',
                        message: msg,
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                    localStorage.setItem(`users_${familyId}`, JSON.stringify({
                        ...famData,
                        notifications: notifs
                    }));
                }
            });
            console.log("Security Alert Sent:", msg);
        } catch (e) {
            console.error("Failed to send alert", e);
        }
    };

    // Start Camera
    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsActive(true);
        } catch (err: any) {
            console.error("Camera access error:", err);
            setError(err.name === 'NotAllowedError' ? "Permission denied" : "Camera not found");
            setIsActive(false);
        }
    };

    // Stop Camera
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsActive(false);
    }, [stream]);

    // Capture and Analyze Frame (For Security mode / Backend)
    const captureFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isActive || analyzing) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (context && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageBase64 = canvas.toDataURL('image/jpeg', 0.6); // Compress slightly
            await analyzeFrame(imageBase64);
        }
    }, [isActive, analyzing, analyzeFrame]);

    // Frame processing loop (MOOD MODE - Backend sync, now mostly handled by MediaPipe locally)
    useEffect(() => {
        let interval: any;
        // Optionally keep backend syncing but very infrequent since mediapipe handles local UI
        if (isActive && mode === 'mood') {
            interval = setInterval(captureFrame, 15000); // 15s instead of 3s to save backend
        }
        return () => clearInterval(interval);
    }, [isActive, mode, captureFrame]);

    // Security/Face Detection Simulation Loop (SECURITY MODE)
    useEffect(() => {
        let interval: any;
        if (isActive && mode === 'security') {
            interval = setInterval(() => {
                // Status: Scanning
                setSecurityStatus('scanning');

                setTimeout(() => {
                    const rand = Math.random();
                    // Simulating Detection Logic:
                    // 0.0 - 0.7: No face/Secure
                    // 0.7 - 0.95: Known Face
                    // 0.95 - 1.0: Unknown/Intruder

                    if (rand > 0.7 && rand <= 0.95 && knownFaces.length > 0) {
                        // Known Family Member
                        const member = knownFaces[Math.floor(Math.random() * knownFaces.length)];
                        setSecurityStatus('secure');
                        setDetectedPerson({
                            name: member.name,
                            relation: member.relation || 'Family',
                            photo: member.photoURL
                        });
                        setTimeout(() => setDetectedPerson(null), 5000);
                    } else if (rand > 0.95) {
                        // Intruder
                        setSecurityStatus('alert');
                        setDetectedPerson(null);
                        sendSecurityAlert("Unauthorized person detected by camera.");
                        setTimeout(() => setSecurityStatus('secure'), 5000);
                    } else {
                        // Secure / Empty
                        setSecurityStatus('secure');
                        setDetectedPerson(null);
                    }
                }, 2000); // Scan duration

            }, 8000); // Check every 8s
        }
        return () => clearInterval(interval);
    }, [isActive, mode, knownFaces]);

    // FPS Counter
    useEffect(() => {
        let animationFrameId: number;
        const updateFps = () => {
            framesRef.current++;
            const now = performance.now();
            if (now - lastTimeRef.current >= 1000) {
                setFps(framesRef.current);
                framesRef.current = 0;
                lastTimeRef.current = now;
            }
            animationFrameId = requestAnimationFrame(updateFps);
        };
        if (isActive) {
            animationFrameId = requestAnimationFrame(updateFps);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive]);

    return (
        <div className="rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl shadow-slate-400/20 dark:shadow-none min-h-[400px] flex flex-col md:flex-row transition-all duration-500 ease-in-out border border-white/5">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Video Section */}
            <div className="relative flex-1 bg-black overflow-hidden group">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover opacity-80"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Line */}
                {isActive && (
                    <motion.div
                        initial={{ top: "-10%" }}
                        animate={{ top: "110%" }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20 pointer-events-none"
                    />
                )}

                {/* Overlay Overlays */}
                <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-start z-30 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                            {isActive ? 'Live Feed' : 'Offline'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        {/* Swap Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMode(m => m === 'mood' ? 'security' : 'mood')}
                            className={`px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-colors ${mode === 'security'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <RefreshCw size={14} className={mode === 'security' ? "" : "opacity-70"} />
                            {mode === 'mood' ? 'Switch to Security' : 'Switch to Mood'}
                        </motion.button>

                        {isActive && (
                            <div className="bg-indigo-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                    {fps} FPS
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning if No Known Faces in Security Mode */}
            {mode === 'security' && knownFaces.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-20 right-6 z-40 max-w-[200px] text-right"
                >
                    <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/50 p-3 rounded-xl inline-block">
                        <p className="text-yellow-200 text-xs font-bold mb-1">⚠️ Setup Required</p>
                        <p className="text-yellow-100/70 text-[10px] leading-tight">
                            No family photos found. <br />Add members in Profile to enable recognition.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Placeholder / Error State */}
            {!isActive && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10 transition-all">
                    <div className="p-6 rounded-full bg-white/5 border border-white/10 mb-4 text-emerald-400">
                        <Camera size={48} />
                    </div>
                    <h4 className="text-xl font-bold">Camera Standby</h4>
                    <p className="text-slate-400 text-sm mb-6">Start monitoring your environment</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startCamera}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors"
                    >
                        <Play size={18} fill="currentColor" />
                        Initialize {mode === 'mood' ? 'AI Mood' : 'Security'} Monitoring
                    </motion.button>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/40 backdrop-blur-lg z-40 p-8 text-center">
                    <AlertTriangle size={48} className="text-rose-500 mb-4" />
                    <h4 className="text-xl font-bold text-rose-100">Connection Failed</h4>
                    <p className="text-rose-200/70 text-sm mb-6 max-w-xs">{error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startCamera}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-600 rounded-2xl font-bold"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </motion.button>
                </div>
            )}

            {/* Controls (Hidden by default, show on hover) */}
            <div className="absolute inset-x-0 bottom-0 p-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                <div className="bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex gap-2">
                    {isActive ? (
                        <button
                            onClick={stopCamera}
                            className="p-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                            title="Stop Monitoring"
                        >
                            <Square size={20} fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            onClick={startCamera}
                            className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                            title="Start Monitoring"
                        >
                            <Play size={20} fill="currentColor" />
                        </button>
                    )}
                </div>
            </div>

            {/* SECURITY MODE OVERLAYS (Integrated from SmartHomeCamera) */}
            {isActive && mode === 'security' && (
                <>
                    {/* Scanning Effect */}
                    {securityStatus === 'scanning' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="w-64 h-64 border-2 border-blue-400/50 rounded-lg relative">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400" />
                                <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-[20%] animate-scan" />
                        </div>
                    )}

                    {/* Status Indicator (Top Left under header) */}
                    <div className="absolute top-20 left-6 z-20">
                        <div className={`p-3 rounded-xl backdrop-blur-md border flex items-center gap-3 transition-all duration-500 ${securityStatus === 'alert' ? 'bg-red-500/80 border-red-500 shadow-xl' :
                            securityStatus === 'scanning' ? 'bg-blue-500/40 border-blue-400/50' :
                                'bg-emerald-500/40 border-emerald-400/50'
                            }`}>
                            {securityStatus === 'alert' ? <ShieldAlert className="text-white animate-bounce" size={24} /> :
                                securityStatus === 'scanning' ? <ScanFace className="text-blue-100 animate-pulse" size={24} /> :
                                    <ShieldCheck className="text-emerald-100" size={24} />}

                            <div>
                                <p className="text-[10px] uppercase font-bold text-white/80 tracking-widest leading-none mb-1">Security Status</p>
                                <p className="font-bold text-white leading-none">
                                    {securityStatus === 'alert' ? 'UNAUTHORIZED' :
                                        securityStatus === 'scanning' ? 'SCANNING...' : 'SECURE'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detected Person / Alert Popups */}
                    <div className="absolute bottom-20 left-0 right-0 px-8 flex justify-center z-40 pointer-events-none">
                        {/* CONFIRMED FAIMLY */}
                        {detectedPerson && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-emerald-600/90 backdrop-blur-xl border border-emerald-400/50 p-4 rounded-2xl flex items-center gap-4 shadow-2xl max-w-sm w-full"
                            >
                                <div className="w-14 h-14 rounded-full border-2 border-emerald-300 overflow-hidden bg-slate-800 shrink-0">
                                    {detectedPerson.photo ? (
                                        <img src={detectedPerson.photo} alt={detectedPerson.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCheck className="w-8 h-8 m-auto mt-2 text-emerald-100" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-0.5">Family Member Verified</p>
                                    <h4 className="text-white font-bold text-lg leading-tight">{detectedPerson.name}</h4>
                                    <p className="text-emerald-100/70 text-sm">{detectedPerson.relation}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* INTRUDER */}
                        {securityStatus === 'alert' && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-red-600/90 backdrop-blur-xl border border-red-500 p-6 rounded-2xl text-center shadow-2xl max-w-sm w-full"
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <ShieldAlert size={32} className="text-white animate-pulse" />
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Warning</h4>
                                </div>
                                <p className="text-red-100 font-medium">Unauthorized Person Detected!</p>
                                <p className="text-red-200/60 text-xs mt-2 uppercase tracking-wide">Alert sent to family</p>
                            </motion.div>
                        )}
                    </div>
                </>
            )}

            {/* Insights Side Panel (Only show in Mood Mode) */}
            <div className={`
                transition-all duration-500 ease-in-out border-l border-white/5 bg-slate-800/50 backdrop-blur-xl
                ${mode === 'mood' ? 'w-full md:w-[320px] p-6 opacity-100' : 'w-0 p-0 opacity-0 overflow-hidden'}
            `}>
                <AIInsightsPanel result={lastResult} isAnalyzing={analyzing} />
            </div>
        </div>
    );
};
