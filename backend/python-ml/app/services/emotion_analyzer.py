"""
ElderNest AI - Emotion Analyzer Service
Analyzes facial emotions from images using CV/ML.
"""

import numpy as np
import base64
import io
from typing import Dict, Any, Optional
from PIL import Image

# Attempt to import OpenCV and TensorFlow
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("⚠️ OpenCV not available. Using simplified emotion detection.")

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️ TensorFlow not available. Using heuristic emotion detection.")


class EmotionAnalyzer:
    """
    Emotion analysis service for facial emotion detection.
    Supports both ML-based and heuristic-based analysis.
    """
    
    EMOTION_LABELS = [
        'Angry', 'Disgust', 'Fear', 'Happy', 
        'Sad', 'Surprise', 'Neutral'
    ]
    
    def __init__(self):
        self.model = None
        self.face_cascade = None
        
        # Initialize face detection if OpenCV is available
        if CV2_AVAILABLE:
            try:
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                print("✅ Face detection initialized")
            except Exception as e:
                print(f"⚠️ Could not load face cascade: {e}")
        
        # Try to load pre-trained emotion model
        self._load_model()
    
    def _load_model(self):
        """Attempt to load a pre-trained emotion detection model."""
        # For hackathon, we'll use heuristic-based detection
        # In production, load a trained CNN model here
        print("ℹ️ Using heuristic-based emotion detection (demo mode)")
    
    def analyze(self, image_base64: str) -> Dict[str, Any]:
        """
        Analyze emotion from a base64-encoded image.
        
        Args:
            image_base64: Base64 encoded image string
            
        Returns:
            Dictionary with detected emotion and confidence
        """
        try:
            # Decode base64 image
            image = self._decode_image(image_base64)
            
            if image is None:
                return {"emotion": "Neutral", "confidence": 0.5}
            
            # Use face detection if available
            if CV2_AVAILABLE and self.face_cascade is not None:
                return self._analyze_with_opencv(image)
            
            # Fallback to simple heuristic
            return self._analyze_heuristic(image)
            
        except Exception as e:
            print(f"Emotion analysis error: {e}")
            return {"emotion": "Neutral", "confidence": 0.5}
    
    def _decode_image(self, image_base64: str) -> Optional[np.ndarray]:
        """Decode base64 image to numpy array."""
        try:
            # Remove data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_base64)
            
            # Open with PIL
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to numpy array
            image = np.array(pil_image)
            
            return image
            
        except Exception as e:
            print(f"Image decode error: {e}")
            return None
    
    def _analyze_with_opencv(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze emotion using OpenCV face detection + heuristics."""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return {"emotion": "Neutral", "confidence": 0.6}
        
        # Get the largest face
        face = max(faces, key=lambda f: f[2] * f[3])
        x, y, w, h = face
        
        # Extract face region
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize for analysis
        face_resized = cv2.resize(face_roi, (48, 48))
        
        # Analyze using image brightness and variance as heuristics
        mean_brightness = np.mean(face_resized)
        variance = np.var(face_resized)
        
        # Heuristic emotion detection based on image characteristics
        emotion, confidence = self._heuristic_emotion(mean_brightness, variance)
        
        return {"emotion": emotion, "confidence": confidence}
    
    def _analyze_heuristic(self, image: np.ndarray) -> Dict[str, Any]:
        """Simple heuristic-based emotion detection."""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = np.mean(image, axis=2)
        else:
            gray = image
        
        mean_brightness = np.mean(gray)
        variance = np.var(gray)
        
        emotion, confidence = self._heuristic_emotion(mean_brightness, variance)
        return {"emotion": emotion, "confidence": confidence}
    
    def _heuristic_emotion(self, brightness: float, variance: float) -> tuple:
        """
        Heuristic emotion detection based on image characteristics.
        This is a simplified demo version.
        """
        # Normalize values
        brightness_norm = brightness / 255.0
        variance_norm = min(variance / 5000.0, 1.0)
        
        # Simple heuristic rules (for demo purposes)
        if brightness_norm > 0.6 and variance_norm > 0.3:
            return ("Happy", 0.75)
        elif brightness_norm < 0.3:
            return ("Sad", 0.65)
        elif variance_norm > 0.5:
            return ("Surprise", 0.60)
        elif brightness_norm < 0.4 and variance_norm < 0.2:
            return ("Angry", 0.55)
        else:
            return ("Neutral", 0.70)
    
    def preprocess_for_model(self, face_image: np.ndarray) -> np.ndarray:
        """
        Preprocess face image for CNN model input.
        Standard preprocessing for emotion detection models.
        """
        # Resize to 48x48 (standard for emotion detection)
        resized = cv2.resize(face_image, (48, 48)) if CV2_AVAILABLE else face_image
        
        # Convert to grayscale if needed
        if len(resized.shape) == 3:
            gray = cv2.cvtColor(resized, cv2.COLOR_RGB2GRAY) if CV2_AVAILABLE else np.mean(resized, axis=2)
        else:
            gray = resized
        
        # Normalize
        normalized = gray / 255.0
        
        # Reshape for model input (1, 48, 48, 1)
        return normalized.reshape(1, 48, 48, 1)
