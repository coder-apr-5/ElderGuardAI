#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Emotion Detector (DeepFace)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Real-time facial emotion detection using DeepFace.
Detects 7 emotions: angry, disgust, fear, happy, sad, surprise, neutral

Also provides:
- Pain detection (combined facial expressions)
- Distress level assessment
- Image quality assessment
- Emotion trend analysis

Pre-trained on FER2013 dataset (35,887 faces)
"""

import numpy as np
import cv2
import base64
import io
from typing import Dict, List, Optional
from datetime import datetime
from PIL import Image
from loguru import logger

# DeepFace import with fallback
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    logger.warning("DeepFace not available. Using mock emotion detection.")


class EmotionDetector:
    """
    Facial emotion detector using DeepFace.
    
    Capabilities:
    - Detect 7 emotions from facial images
    - Calculate emotion score (-1 to 1)
    - Detect pain indicators
    - Assess distress level
    - Analyze emotion trends over time
    """
    
    # Emotion to score mapping (-1: negative, 0: neutral, 1: positive)
    EMOTION_SCORES = {
        'happy': 1.0,
        'surprise': 0.5,
        'neutral': 0.0,
        'sad': -0.6,
        'fear': -0.7,
        'angry': -0.8,
        'disgust': -0.5
    }
    
    # Pain indicators (combinations suggest pain)
    PAIN_INDICATORS = ['fear', 'angry', 'sad', 'disgust']
    
    def __init__(self):
        """Initialize EmotionDetector with DeepFace."""
        self.is_available = DEEPFACE_AVAILABLE
        
        if self.is_available:
            logger.info("✅ EmotionDetector initialized with DeepFace")
            # Warm up the model with a dummy image
            self._warmup()
        else:
            logger.warning("⚠️ EmotionDetector running in mock mode (DeepFace not installed)")
    
    def _warmup(self):
        """Warm up DeepFace model with a dummy image."""
        try:
            # Create a small dummy image
            dummy_image = np.zeros((48, 48, 3), dtype=np.uint8)
            dummy_image.fill(128)  # Gray image
            
            # Run analysis to load models
            DeepFace.analyze(
                dummy_image,
                actions=['emotion'],
                enforce_detection=False,
                silent=True
            )
            logger.info("🔥 DeepFace models warmed up")
        except Exception as e:
            logger.warning(f"Warmup failed (non-critical): {e}")
    
    def analyze_emotion(
        self,
        image_base64: str,
        detect_face_quality: bool = True
    ) -> Dict:
        """
        Analyze facial emotion from base64-encoded image.
        
        Args:
            image_base64: Base64-encoded image string
            detect_face_quality: Whether to assess image quality
            
        Returns:
            Dict with emotion analysis:
            {
                'emotion': 'happy',
                'confidence': 0.87,
                'emotion_score': 1.0,
                'all_emotions': {...},
                'pain_detected': False,
                'distress_level': 'low',
                'face_detected': True,
                'image_quality': 'good',
                'timestamp': '2026-01-25T10:45:00'
            }
        """
        try:
            # Decode base64 image
            image_array = self._decode_image(image_base64)
            
            if image_array is None:
                return self._no_face_detected(error="Failed to decode image")
            
            # Use mock if DeepFace not available
            if not self.is_available:
                return self._mock_analysis(image_array)
            
            # Run DeepFace analysis
            result = DeepFace.analyze(
                image_array,
                actions=['emotion'],
                enforce_detection=False,
                detector_backend='opencv',
                silent=True
            )
            
            # Handle list or dict response
            if isinstance(result, list):
                if len(result) == 0:
                    return self._no_face_detected()
                result = result[0]
            
            # Extract emotion data
            emotions = result.get('emotion', {})
            dominant_emotion = result.get('dominant_emotion', 'neutral')
            
            if not emotions:
                return self._no_face_detected()
            
            confidence = emotions.get(dominant_emotion, 0) / 100.0
            
            # Calculate emotion score (-1 to 1)
            emotion_score = self.EMOTION_SCORES.get(dominant_emotion, 0.0)
            
            # Detect pain/distress
            pain_detected = self._detect_pain(emotions)
            distress_level = self._calculate_distress_level(emotions)
            
            # Check image quality
            image_quality = 'unknown'
            if detect_face_quality:
                image_quality = self._assess_image_quality(image_array)
            
            return {
                'emotion': dominant_emotion,
                'confidence': round(confidence, 3),
                'emotion_score': round(emotion_score, 3),
                'all_emotions': {k: round(v / 100, 3) for k, v in emotions.items()},
                'pain_detected': pain_detected,
                'distress_level': distress_level,
                'face_detected': True,
                'image_quality': image_quality,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Emotion detection error: {str(e)}")
            return self._no_face_detected(error=str(e))
    
    def _decode_image(self, image_base64: str) -> Optional[np.ndarray]:
        """
        Decode base64 image to numpy array.
        
        Args:
            image_base64: Base64-encoded image string
            
        Returns:
            RGB numpy array or None if decoding fails
        """
        try:
            # Remove data URI prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            image_array = np.array(image)
            
            # Convert to RGB if needed
            if len(image_array.shape) == 2:  # Grayscale
                image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)
            elif image_array.shape[2] == 4:  # RGBA
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Image decode error: {e}")
            return None
    
    def _detect_pain(self, emotions: Dict[str, float]) -> bool:
        """
        Detect if facial expression indicates pain.
        
        Pain typically manifests as a combination of:
        - Fear + Anger + Disgust
        
        Args:
            emotions: Dict of emotion scores (0-100)
            
        Returns:
            True if pain is detected
        """
        pain_score = sum(
            emotions.get(indicator, 0) 
            for indicator in self.PAIN_INDICATORS
        )
        
        # Threshold based on research (sum > 150 suggests pain)
        return pain_score > 150
    
    def _calculate_distress_level(self, emotions: Dict[str, float]) -> str:
        """
        Calculate distress level from emotion scores.
        
        Levels: low, medium, high, critical
        
        Args:
            emotions: Dict of emotion scores (0-100)
            
        Returns:
            Distress level string
        """
        negative_emotions = ['fear', 'angry', 'sad', 'disgust']
        distress_score = sum(emotions.get(e, 0) for e in negative_emotions)
        
        if distress_score > 200:
            return 'critical'
        elif distress_score > 120:
            return 'high'
        elif distress_score > 60:
            return 'medium'
        else:
            return 'low'
    
    def _assess_image_quality(self, image_array: np.ndarray) -> str:
        """
        Assess image quality for reliable emotion detection.
        
        Checks:
        - Resolution
        - Brightness
        - Blur level
        
        Args:
            image_array: RGB numpy array
            
        Returns:
            Quality string: 'poor', 'acceptable', 'good'
        """
        # Check resolution
        height, width = image_array.shape[:2]
        if width < 100 or height < 100:
            return 'poor'
        
        # Convert to grayscale for quality checks
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        
        # Check brightness
        brightness = np.mean(gray)
        if brightness < 40 or brightness > 220:
            return 'poor'  # Too dark or too bright
        
        # Check blur using Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var < 100:
            return 'poor'  # Blurry
        elif laplacian_var < 300:
            return 'acceptable'
        else:
            return 'good'
    
    def _no_face_detected(self, error: Optional[str] = None) -> Dict:
        """
        Return default response when no face is detected.
        
        Args:
            error: Optional error message
            
        Returns:
            Default emotion analysis dict
        """
        return {
            'emotion': 'neutral',
            'confidence': 0.0,
            'emotion_score': 0.0,
            'all_emotions': {},
            'pain_detected': False,
            'distress_level': 'unknown',
            'face_detected': False,
            'image_quality': 'unknown',
            'error': error or 'No face detected in image',
            'timestamp': datetime.now().isoformat()
        }
    
    def _mock_analysis(self, image_array: np.ndarray) -> Dict:
        """
        Provide mock emotion analysis when DeepFace is not available.
        
        Uses basic image statistics to generate plausible mock data.
        
        Args:
            image_array: RGB numpy array
            
        Returns:
            Mock emotion analysis dict
        """
        # Use image brightness to influence mock emotion
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        brightness = np.mean(gray) / 255.0
        
        # Brighter images -> happier mock emotions
        if brightness > 0.6:
            emotion = 'happy'
            confidence = 0.75 + np.random.uniform(0, 0.2)
        elif brightness > 0.4:
            emotion = 'neutral'
            confidence = 0.70 + np.random.uniform(0, 0.25)
        else:
            emotion = 'sad'
            confidence = 0.60 + np.random.uniform(0, 0.3)
        
        return {
            'emotion': emotion,
            'confidence': round(confidence, 3),
            'emotion_score': round(self.EMOTION_SCORES[emotion], 3),
            'all_emotions': {
                'happy': round(0.2 if emotion != 'happy' else confidence, 3),
                'sad': round(0.1 if emotion != 'sad' else confidence, 3),
                'neutral': round(0.3 if emotion != 'neutral' else confidence, 3),
                'fear': 0.05,
                'angry': 0.05,
                'surprise': 0.1,
                'disgust': 0.05
            },
            'pain_detected': False,
            'distress_level': 'low',
            'face_detected': True,
            'image_quality': self._assess_image_quality(image_array),
            'mock': True,
            'timestamp': datetime.now().isoformat()
        }
    
    def analyze_emotion_trend(
        self,
        emotion_history: List[float]
    ) -> Dict:
        """
        Analyze emotion trend over time.
        
        Args:
            emotion_history: List of emotion scores over time (-1 to 1)
            
        Returns:
            Trend analysis:
            {
                'trend': 'improving' | 'stable' | 'deteriorating',
                'change_score': 0.25,
                'recent_avg': 0.5,
                'older_avg': 0.25
            }
        """
        if len(emotion_history) < 3:
            return {
                'trend': 'insufficient_data',
                'change_score': 0.0,
                'recent_avg': 0.0,
                'older_avg': 0.0
            }
        
        # Split into recent and older periods
        mid_point = len(emotion_history) // 2
        older_scores = emotion_history[:mid_point]
        recent_scores = emotion_history[mid_point:]
        
        # Calculate averages
        recent_avg = np.mean(recent_scores)
        older_avg = np.mean(older_scores)
        
        # Calculate change
        change = recent_avg - older_avg
        
        # Determine trend
        if change > 0.15:
            trend = 'improving'
        elif change < -0.15:
            trend = 'deteriorating'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'change_score': round(change, 3),
            'recent_avg': round(recent_avg, 3),
            'older_avg': round(older_avg, 3)
        }


# Create global instance for import
emotion_detector = EmotionDetector()
