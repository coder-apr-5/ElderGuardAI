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
import { AIInsightsPanel } from "./AIInsightsPanel";

export const CameraMonitor: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [fps, setFps] = useState(0);
    const lastTimeRef = useRef(performance.now());
    const framesRef = useRef(0);

    const { analyzeFrame, analyzing, lastResult } = useVisionAnalysis();

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

    // Capture and Analyze Frame
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

    // Frame processing loop
    useEffect(() => {
        let interval: any;
        if (isActive) {
            // Analyze every 2 seconds to avoid overloading API while maintaining "real-time" feel
            interval = setInterval(captureFrame, 2000);
        }
        return () => clearInterval(interval);
    }, [isActive, captureFrame]);

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

                    {isActive && (
                        <div className="bg-indigo-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                {fps} FPS
                            </span>
                        </div>
                    )}
                </div>

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
                            Initialize AI Monitoring
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
                        <button
                            className="p-3 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                            onClick={startCamera}
                            title="Refresh Stream"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Insights Side Panel */}
            <div className="w-full md:w-[320px] bg-slate-800/50 backdrop-blur-xl border-l border-white/5 p-6 z-30">
                <AIInsightsPanel result={lastResult} isAnalyzing={analyzing} />
            </div>
        </div>
    );
};
