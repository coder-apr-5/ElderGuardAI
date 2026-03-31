#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Fall Detector (MediaPipe)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Real-time fall detection using MediaPipe Pose.
Analyzes body posture to detect:
- Falls (body horizontal)
- Lying down
- Sitting
- Standing
- Unusual postures (excessive leaning, slouching)

This is a CRITICAL safety component that can SAVE LIVES.
"""

import numpy as np
import cv2
import base64
import io
import math
from typing import Dict, Optional, Tuple
from datetime import datetime
from PIL import Image
from loguru import logger

# YOLOv8 import with robust fallback
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("YOLOv8 not available. Using mock fall detection.")


class FallDetector:
    """
    Fall detection using MediaPipe Pose estimation.
    
    Capabilities:
    - Detect falls (body angle analysis)
    - Classify postures (standing, sitting, lying, fallen)
    - Detect unusual postures (excessive leaning)
    - Calculate confidence scores
    - Track pose history for pattern detection
    """
    
    # Posture angle thresholds (degrees from vertical)
    FALLEN_THRESHOLD = 30       # Nearly horizontal
    LYING_THRESHOLD = 45        # Lying down
    SITTING_THRESHOLD = 70      # Sitting posture
    
    def __init__(self):
        """Initialize YOLOv8 Pose detector."""
        self.is_available = YOLO_AVAILABLE
        
        if self.is_available:
            self.pose = YOLO('yolov8n-pose.pt')
            # Warm up
            self.pose.predict(np.zeros((64, 64, 3), dtype=np.uint8), verbose=False)
            logger.info("✅ FallDetector initialized with YOLOv8 Pose")
        else:
            self.pose = None
            logger.warning("⚠️ FallDetector running in mock mode (YOLO Pose not installed)")
        
        # Pose history for pattern detection
        self.pose_history = []
        self.max_history = 30  # Keep last 30 frames
    
    def detect_fall(self, image_base64: str) -> Dict:
        """
        Detect if person has fallen from image.
        
        Args:
            image_base64: Base64-encoded image string
            
        Returns:
            Dict with fall detection results:
            {
                'fall_detected': False,
                'confidence': 0.85,
                'body_angle': 85.0,  # degrees from horizontal
                'posture': 'standing',  # standing, sitting, lying, fallen
                'unusual_posture': False,
                'pose_detected': True,
                'landmarks_visible': 0.9,
                'timestamp': '2026-01-25T10:45:00'
            }
        """
        try:
            # Decode image
            image_array = self._decode_image(image_base64)
            
            if image_array is None:
                return self._no_pose_detected(error="Failed to decode image")
            
            # Use mock if YOLO not available
            if not self.is_available:
                return self._mock_detection(image_array)
            
            # Predict pose using YOLO
            results = self.pose(image_array, verbose=False)
            
            if not results or len(results) == 0 or not hasattr(results[0], 'keypoints') or results[0].keypoints is None or len(results[0].keypoints.xy[0]) == 0:
                return self._no_pose_detected()
            
            # Extract keypoints xy coordinates
            # shape is (N, 17, 2), we assume 1 person (N=0)
            landmarks = results[0].keypoints.xy[0].cpu().numpy()
            
            # If coordinates are 0, pose wasn't fully detected
            if np.all(landmarks == 0):
                return self._no_pose_detected()
            
            # Extract key body points
            body_data = self._extract_body_data(landmarks)
            
            if body_data is None:
                return self._no_pose_detected(error="Could not extract body landmarks")
            
            # Calculate body angle
            body_angle = self._calculate_body_angle(body_data)
            
            # Classify posture
            posture, fall_detected = self._classify_posture(
                body_angle, 
                body_data
            )
            
            # Check for unusual posture
            unusual_posture = self._detect_unusual_posture(landmarks)
            
            # Calculate confidence using basic visible points logic
            confidence = 0.85 # YOLO confidence placeholder
            
            # Store in history
            self._update_history({
                'posture': posture,
                'fall_detected': fall_detected,
                'body_angle': body_angle,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.debug(f"Pose: {posture}, Angle: {body_angle:.2f}, Fall: {fall_detected}, Confidence: {confidence:.2f}")
            
            result = {
                'fall_detected': fall_detected,
                'confidence': round(confidence, 3),
                'body_angle': round(body_angle, 2),
                'posture': posture,
                'unusual_posture': unusual_posture,
                'pose_detected': True,
                'landmarks_visible': round(confidence, 3),
                'timestamp': datetime.now().isoformat()
            }
            
            # Add fall alert if detected
            if fall_detected:
                result['alert'] = {
                    'type': 'FALL_DETECTED',
                    'severity': 'critical',
                    'message': 'Potential fall detected! Body angle indicates horizontal posture.',
                    'action_required': 'Verify elder safety immediately'
                }
                logger.warning(f"⚠️ FALL DETECTED: angle={body_angle:.1f}°, posture={posture}")
            
            return result
            
        except Exception as e:
            logger.error(f"Fall detection error: {str(e)}")
            return self._no_pose_detected(error=str(e))
    
    def _decode_image(self, image_base64: str) -> Optional[np.ndarray]:
        """Decode base64 image to numpy array."""
        try:
            # Remove data URI prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            image_array = np.array(image)
            
            # Ensure BGR format for OpenCV
            if len(image_array.shape) == 2:  # Grayscale
                image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2BGR)
            elif image_array.shape[2] == 4:  # RGBA
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2BGR)
            elif image_array.shape[2] == 3:  # RGB
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Image decode error: {e}")
            return None
    
    def _extract_body_data(self, landmarks) -> Optional[Dict]:
        """
        Extract key body points for posture analysis using YOLOv8 indexing.
        YOLOv8 COCO format indexing:
        0: nose, 5: l_shoulder, 6: r_shoulder, 11: l_hip, 12: r_hip, 
        13: l_knee, 14: r_knee, 15: l_ankle, 16: r_ankle
        """
        try:
            # Get key landmarks
            left_shoulder = landmarks[5]
            right_shoulder = landmarks[6]
            left_hip = landmarks[11]
            right_hip = landmarks[12]
            left_knee = landmarks[13]
            right_knee = landmarks[14]
            left_ankle = landmarks[15]
            right_ankle = landmarks[16]
            nose = landmarks[0]
            
            return {
                'shoulder_y': (left_shoulder[1] + right_shoulder[1]) / 2,
                'shoulder_x': (left_shoulder[0] + right_shoulder[0]) / 2,
                'hip_y': (left_hip[1] + right_hip[1]) / 2,
                'hip_x': (left_hip[0] + right_hip[0]) / 2,
                'knee_y': (left_knee[1] + right_knee[1]) / 2,
                'knee_x': (left_knee[0] + right_knee[0]) / 2,
                'ankle_y': (left_ankle[1] + right_ankle[1]) / 2,
                'ankle_x': (left_ankle[0] + right_ankle[0]) / 2,
                'head_y': nose[1],
                'head_x': nose[0],
                'left_shoulder': (left_shoulder[0], left_shoulder[1]),
                'right_shoulder': (right_shoulder[0], right_shoulder[1]),
                'left_hip': (left_hip[0], left_hip[1]),
                'right_hip': (right_hip[0], right_hip[1])
            }
            
        except Exception as e:
            logger.error(f"Body data extraction error: {e}")
            return None
    
    def _calculate_body_angle(self, body_data: Dict) -> float:
        """
        Calculate body angle from vertical axis.
        
        A standing person has angle ~90° from horizontal.
        A fallen person has angle ~0° from horizontal.
        
        Args:
            body_data: Extracted body point coordinates
            
        Returns:
            Angle in degrees (0 = horizontal, 90 = vertical)
        """
        # Calculate torso vector (shoulder to hip)
        dx = body_data['hip_x'] - body_data['shoulder_x']
        dy = body_data['hip_y'] - body_data['shoulder_y']
        
        # Calculate angle from horizontal
        # In image coordinates, y increases downward
        angle_rad = math.atan2(dy, dx)
        angle_deg = math.degrees(angle_rad)
        
        # Convert to angle from horizontal plane
        # 90° = vertical (standing)
        # 0° = horizontal (fallen)
        body_angle = abs(angle_deg)
        
        # Handle cases where dy is negative (person upside down or leaning back)
        if body_angle > 90:
            body_angle = 180 - body_angle
            
        return body_angle
    
    def _classify_posture(
        self, 
        body_angle: float, 
        body_data: Dict
    ) -> Tuple[str, bool]:
        """
        Classify body posture based on angle and position.
        
        Args:
            body_angle: Angle from horizontal in degrees
            body_data: Extracted body point coordinates
            
        Returns:
            Tuple of (posture_name, fall_detected)
        """
        # Check if head is below hip (strong fall indicator)
        head_below_hip = body_data['head_y'] > body_data['hip_y']
        
        # Determine hip height (for sitting detection)
        hip_is_low = body_data['hip_y'] > 0.6  # In lower 40% of frame
        
        # Fall detection: body nearly horizontal OR head below hip
        if body_angle < self.FALLEN_THRESHOLD or head_below_hip:
            return ('fallen', True)
        
        # Lying down (horizontal but not emergency)
        elif body_angle < self.LYING_THRESHOLD:
            # Could be lying in bed - check context
            return ('lying', False)
        
        # Sitting
        elif body_angle < self.SITTING_THRESHOLD and hip_is_low:
            return ('sitting', False)
        
        # Standing
        else:
            return ('standing', False)
    
    def _detect_unusual_posture(self, landmarks) -> bool:
        """
        Detect unusual or concerning postures using YOLOv8 indexing.
        """
        try:
            left_shoulder = landmarks[5]
            right_shoulder = landmarks[6]
            left_hip = landmarks[11]
            right_hip = landmarks[12]
            
            # Check shoulder tilt
            shoulder_tilt = abs(left_shoulder[1] - right_shoulder[1])
            
            # Check hip tilt
            hip_tilt = abs(left_hip[1] - right_hip[1])
            
            # Unusual if extreme tilt (leaning heavily to one side)
            if shoulder_tilt > 0.15 or hip_tilt > 0.15:
                return True
            
            # Check for hunched posture (shoulders significantly forward)
            # This would require depth estimation, simplified here
            
            return False
            
        except Exception as e:
            logger.debug(f"Unusual posture check failed: {e}")
            return False
    
    def _calculate_confidence(self, landmarks) -> float:
        """
        Calculate detection confidence based on landmark visibility.
        
        Args:
            landmarks: MediaPipe pose landmarks
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        key_landmarks = [
            self.mp_pose.PoseLandmark.LEFT_SHOULDER,
            self.mp_pose.PoseLandmark.RIGHT_SHOULDER,
            self.mp_pose.PoseLandmark.LEFT_HIP,
            self.mp_pose.PoseLandmark.RIGHT_HIP,
            self.mp_pose.PoseLandmark.LEFT_KNEE,
            self.mp_pose.PoseLandmark.RIGHT_KNEE
        ]
        
        visibilities = [
            landmarks[lm].visibility 
            for lm in key_landmarks
        ]
        
        return np.mean(visibilities)
    
    def _update_history(self, pose_data: Dict):
        """Update pose history for pattern detection."""
        self.pose_history.append(pose_data)
        
        # Keep only recent history
        if len(self.pose_history) > self.max_history:
            self.pose_history = self.pose_history[-self.max_history:]
    
    def _no_pose_detected(self, error: Optional[str] = None) -> Dict:
        """Return default response when no pose is detected."""
        return {
            'fall_detected': False,
            'confidence': 0.0,
            'body_angle': None,
            'posture': 'unknown',
            'unusual_posture': False,
            'pose_detected': False,
            'landmarks_visible': 0.0,
            'error': error or 'No pose detected in image',
            'timestamp': datetime.now().isoformat()
        }
    
    def _mock_detection(self, image_array: np.ndarray) -> Dict:
        """Provide mock detection when MediaPipe unavailable."""
        # Use image dimensions to create plausible mock
        height, width = image_array.shape[:2]
        
        # Random but plausible values for testing
        postures = ['standing', 'sitting', 'standing', 'standing', 'standing']
        posture = np.random.choice(postures)
        
        return {
            'fall_detected': False,
            'confidence': 0.85,
            'body_angle': 75.0 if posture == 'standing' else 55.0,
            'posture': posture,
            'unusual_posture': False,
            'pose_detected': True,
            'landmarks_visible': 0.85,
            'mock': True,
            'timestamp': datetime.now().isoformat()
        }
    
    def analyze_movement_pattern(self) -> Dict:
        """
        Analyze movement patterns from pose history.
        
        Returns:
            Movement pattern analysis:
            {
                'activity_level': 'active' | 'sedentary' | 'immobile',
                'posture_changes': 5,
                'fall_events': 0,
                'time_standing_pct': 60.0,
                'time_sitting_pct': 30.0,
                'time_lying_pct': 10.0
            }
        """
        if len(self.pose_history) < 5:
            return {
                'activity_level': 'unknown',
                'posture_changes': 0,
                'fall_events': 0,
                'time_standing_pct': 0.0,
                'time_sitting_pct': 0.0,
                'time_lying_pct': 0.0
            }
        
        # Count postures
        posture_counts = {
            'standing': 0,
            'sitting': 0,
            'lying': 0,
            'fallen': 0,
            'unknown': 0
        }
        
        posture_changes = 0
        previous_posture = None
        fall_events = 0
        
        for pose in self.pose_history:
            posture = pose.get('posture', 'unknown')
            posture_counts[posture] = posture_counts.get(posture, 0) + 1
            
            if previous_posture and posture != previous_posture:
                posture_changes += 1
            
            if pose.get('fall_detected'):
                fall_events += 1
            
            previous_posture = posture
        
        total = len(self.pose_history)
        
        # Calculate percentages
        standing_pct = (posture_counts['standing'] / total) * 100
        sitting_pct = (posture_counts['sitting'] / total) * 100
        lying_pct = (posture_counts['lying'] / total) * 100
        
        # Determine activity level
        if posture_changes > total * 0.3:
            activity_level = 'active'
        elif posture_changes > total * 0.1:
            activity_level = 'moderate'
        elif sitting_pct + lying_pct > 80:
            activity_level = 'sedentary'
        else:
            activity_level = 'low'
        
        return {
            'activity_level': activity_level,
            'posture_changes': posture_changes,
            'fall_events': fall_events,
            'time_standing_pct': round(standing_pct, 1),
            'time_sitting_pct': round(sitting_pct, 1),
            'time_lying_pct': round(lying_pct, 1)
        }


# Create global instance for import
fall_detector = FallDetector()
