import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";

interface CameraMoodDetectorProps {
    onCapture: (base64Image: string) => void;
    isAnalyzing: boolean;
}

export const CameraMoodDetector = ({ onCapture, isAnalyzing }: CameraMoodDetectorProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            console.log("Requesting camera access...");
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });
            console.log("Camera access granted, stream:", mediaStream.id);
            setStream(mediaStream);
            setIsActive(true);
            setError(null);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Explicitly play to ensure mobile compatibility
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please check permissions and ensure no other app is using it.");
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsActive(false);
        }
    }, [stream]);

    // Capture image from video stream
    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current || isAnalyzing) {
            console.warn("Capture aborted: Refs missing or analyzing");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.warn("Video not ready yet");
            return;
        }

        if (context) {
            console.log("Capturing image...", video.videoWidth, video.videoHeight);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
                const imageData = canvas.toDataURL("image/jpeg", 0.8);
                onCapture(imageData);
                stopCamera(); // Stop after capture to save battery/privacy
            } catch (e) {
                console.error("Canvas to DataURL failed:", e);
                setError("Failed to process image.");
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    if (error) {
        return (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-xl text-center">
                <p>{error}</p>
                <Button variant="outline" onClick={() => setError(null)} className="mt-2">
                    Try Again
                </Button>
            </div>
        );
    }

    if (!isActive) {
        return (
            <Button
                onClick={startCamera}
                variant="outline"
                size="xl"
                className="flex-col gap-2 h-auto py-8 hover:bg-indigo-100 hover:border-indigo-500 w-full"
            >
                <Camera size={48} className="text-indigo-500" />
                <span className="text-xl">Check by Camera</span>
            </Button>
        );
    }

    return (
        <div className="relative w-full max-w-sm mx-auto bg-black rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-700">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover transform -scale-x-100" // Mirror effect
            />

            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                <Button
                    onClick={stopCamera}
                    variant="secondary"
                    className="bg-white/80 hover:bg-white text-gray-800 backdrop-blur-sm"
                >
                    Cancel
                </Button>

                <Button
                    onClick={captureImage}
                    disabled={isAnalyzing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg"
                >
                    {isAnalyzing ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Camera className="mr-2 h-4 w-4" />
                            Snap & Check
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
