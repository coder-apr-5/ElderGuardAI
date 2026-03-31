import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

export type VisionState = {
  mood: string;
  moodConfidence: number;
  pose: string;
  poseDetails: string;
  isActive: boolean;
};

export function useMediaPipeVision(videoRef: React.RefObject<HTMLVideoElement>, isEnabled: boolean) {
  const [visionState, setVisionState] = useState<VisionState>({
    mood: "Neutral",
    moodConfidence: 0,
    pose: "Pose Unknown",
    poseDetails: "Detecting...",
    isActive: false,
  });

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestAnimationFrameRef = useRef<number>();

  // Smoothing buffers
  const moodBufferRef = useRef<string[]>([]);
  const poseBufferRef = useRef<string[]>([]);
  
  const lastUpdateRef = useRef<number>(0);

  const initializeModels = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      const faceTask = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });
      faceLandmarkerRef.current = faceTask;

      const poseTask = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      poseLandmarkerRef.current = poseTask;

    } catch (err) {
      console.error("Failed to initialize MediaPipe models:", err);
    }
  };

  useEffect(() => {
    initializeModels();
    return () => {
      faceLandmarkerRef.current?.close();
      poseLandmarkerRef.current?.close();
    };
  }, []);

  // Helper to map blendshapes to emotion
  const getEmotionFromBlendshapes = (blendshapes: any[]) => {
    if (!blendshapes || blendshapes.length === 0) return { mood: "Neutral", conf: 0 };
    
    // Create a map from categoryName to score
    const scores: Record<string, number> = {};
    for (const shape of blendshapes[0].categories) {
      scores[shape.categoryName] = shape.score;
    }

    const smileMouth = scores["mouthSmileLeft"] + scores["mouthSmileRight"];
    const frownMouth = scores["mouthFrownLeft"] + scores["mouthFrownRight"];
    const eyeBlink = scores["eyeBlinkLeft"] + scores["eyeBlinkRight"];
    const browDown = scores["browDownLeft"] + scores["browDownRight"];
    const jawOpen = scores["jawOpen"];

    if (smileMouth > 0.8) return { mood: "Happy", conf: smileMouth / 2 };
    if (frownMouth > 0.6) return { mood: "Sad", conf: frownMouth / 2 };
    if (browDown > 0.8 && frownMouth > 0.3) return { mood: "Angry", conf: browDown / 2 };
    if (eyeBlink > 1.2 || (eyeBlink > 0.6 && jawOpen > 0.5)) return { mood: "Tired", conf: Math.min(1, eyeBlink / 2) };

    let maxConf = Math.max(smileMouth, frownMouth, browDown, eyeBlink, jawOpen);
    if (maxConf < 0.2) return { mood: "Neutral", conf: 0.8 };
    
    return { mood: "Neutral", conf: 0.5 }; // default
  };

  // Helper to map angles to pose
  const getPoseFromLandmarks = (landmarks: any[]) => {
    if (!landmarks || landmarks.length === 0) return { pose: "Pose Unknown", ang: 0 };
    const lms = landmarks[0];
    // Need shoulders (11, 12), hips (23, 24), knees (25, 26), ankles (27, 28)
    
    // Helper to calculate angle between 3 points
    const calculateAngle = (p1: any, p2: any, p3: any) => {
      const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
      let angle = Math.abs((radians * 180.0) / Math.PI);
      if (angle > 180.0) {
        angle = 360 - angle;
      }
      return angle;
    };

    const leftShoulder = lms[11];
    const leftHip = lms[23];
    const leftKnee = lms[25];
    const leftAnkle = lms[27];

    const rightShoulder = lms[12];
    const rightHip = lms[24];
    
    // A quick check if it's horizontal
    if (!leftShoulder || !leftHip || !leftKnee || !leftAnkle) {
      return { pose: "Partial Body Visible", ang: 0 };
    }

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const isHorizontal = Math.abs(avgShoulderY - avgHipY) < 0.2; // They are roughly at same Y level

    if (isHorizontal) {
      return { pose: "Lying Down", ang: 90 };
    }

    const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

    const isStanding = leftHipAngle > 160 && leftKneeAngle > 160;
    const isSitting = leftHipAngle > 80 && leftHipAngle < 130 && leftKneeAngle > 80 && leftKneeAngle < 130;

    let ang = Math.round((leftHipAngle + leftKneeAngle) / 2);

    if (isStanding) return { pose: "Standing", ang };
    if (isSitting) return { pose: "Sitting", ang };

    return { pose: "Inactive", ang };
  };

  const mode = (arr: string[]) => {
    return arr.sort((a,b) =>
      arr.filter(v => v===a).length - arr.filter(v => v===b).length
    ).pop() || arr[0];
  };

  const analyzeStream = useCallback(async () => {
    if (!videoRef.current || !isEnabled) return;
    const video = videoRef.current;
    
    if (video.readyState >= 2 && faceLandmarkerRef.current && poseLandmarkerRef.current) {
      const nowMs = performance.now();
      
      try {
        const faceResult = faceLandmarkerRef.current.detectForVideo(video, nowMs);
        const poseResult = poseLandmarkerRef.current.detectForVideo(video, nowMs);
        
        // Update state every 1s (1000ms) to throttle updates
        if (nowMs - lastUpdateRef.current > 1000) {
          
          let curMood = "No Face Detected";
          let curMoodConf = 0;
          let curPose = "Pose Unknown";
          let curPoseAngle = 0;

          if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
            const { mood, conf } = getEmotionFromBlendshapes(faceResult.faceBlendshapes);
            curMood = mood;
            curMoodConf = conf;
          }

          if (poseResult.landmarks && poseResult.landmarks.length > 0) {
             const { pose, ang } = getPoseFromLandmarks(poseResult.landmarks);
             curPose = pose;
             curPoseAngle = ang;
          }

          // Buffer logic (smooth over last 5 frames)
          const mBuffer = moodBufferRef.current;
          mBuffer.push(curMood);
          if (mBuffer.length > 5) mBuffer.shift();

          const pBuffer = poseBufferRef.current;
          pBuffer.push(curPose);
          if (pBuffer.length > 5) pBuffer.shift();

          const smoothedMood = mode(mBuffer);
          const smoothedPose = mode(pBuffer);

          setVisionState({
            mood: smoothedMood,
            moodConfidence: curMoodConf,
            pose: smoothedPose,
            poseDetails: `Angle: ${curPoseAngle}°`,
            isActive: true
          });
          
          lastUpdateRef.current = nowMs;
        }
      } catch (e) {
        console.warn("Vision analysis error:", e);
      }
    }
    
    if (isEnabled) {
      requestAnimationFrameRef.current = requestAnimationFrame(analyzeStream);
    }
  }, [isEnabled, videoRef]);

  useEffect(() => {
    if (isEnabled && faceLandmarkerRef.current && poseLandmarkerRef.current) {
      requestAnimationFrameRef.current = requestAnimationFrame(analyzeStream);
    } else {
      setVisionState(prev => ({ ...prev, isActive: false }));
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
    }
    return () => {
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
    };
  }, [isEnabled, analyzeStream]);

  return visionState;
}
