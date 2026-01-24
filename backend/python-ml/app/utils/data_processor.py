"""
ElderNest AI - Data Processing Utilities
Helper functions for data preprocessing and transformation.
"""

import numpy as np
import base64
import io
from typing import Dict, List, Any, Optional, Tuple
from PIL import Image


def decode_base64_image(image_base64: str) -> Optional[np.ndarray]:
    """
    Decode a base64 encoded image to numpy array.
    
    Args:
        image_base64: Base64 encoded image string
        
    Returns:
        Numpy array of image or None if decoding fails
    """
    try:
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_base64)
        
        # Open with PIL
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        return np.array(pil_image)
        
    except Exception as e:
        print(f"Image decode error: {e}")
        return None


def normalize_features(features: Dict[str, Any]) -> Dict[str, float]:
    """
    Normalize feature values to standard ranges.
    
    Args:
        features: Dictionary of raw features
        
    Returns:
        Dictionary of normalized features
    """
    normalized = {}
    
    # Mood score: already 0-1
    normalized['avgMoodScore'] = max(0, min(1, features.get('avgMoodScore', 0.5)))
    
    # Medicine adherence: already 0-1
    normalized['medicineAdherence'] = max(0, min(1, features.get('medicineAdherence', 1.0)))
    
    # Sentiment: -1 to 1
    normalized['avgSentiment'] = max(-1, min(1, features.get('avgSentiment', 0.0)))
    
    # Inactivity days: 0-7, normalize to 0-1
    inactivity = features.get('inactivityDays', 0)
    normalized['inactivityDays'] = max(0, min(7, inactivity)) / 7.0
    
    # Missed medicines: normalize by max expected (10)
    missed = features.get('missedMedicines', 0)
    normalized['missedMedicines'] = min(missed / 10.0, 1.0)
    
    # Negative chats: normalize by max expected (20)
    negative = features.get('negativeChatCount', 0)
    normalized['negativeChatCount'] = min(negative / 20.0, 1.0)
    
    return normalized


def calculate_risk_score(features: Dict[str, float], weights: Optional[Dict[str, float]] = None) -> float:
    """
    Calculate a weighted risk score from features.
    
    Args:
        features: Normalized feature dictionary
        weights: Optional custom weights for each feature
        
    Returns:
        Risk score between 0 and 1
    """
    if weights is None:
        weights = {
            'avgMoodScore': -0.25,        # Lower mood = higher risk
            'medicineAdherence': -0.25,   # Lower adherence = higher risk
            'avgSentiment': -0.15,        # Lower sentiment = higher risk
            'inactivityDays': 0.15,       # More inactive = higher risk
            'missedMedicines': 0.10,      # More missed = higher risk
            'negativeChatCount': 0.10,    # More negative = higher risk
        }
    
    score = 0.5  # Start at neutral
    
    for feature, weight in weights.items():
        if feature in features:
            value = features[feature]
            if weight < 0:
                # For negative weights, invert the contribution
                score += weight * (1 - value)
            else:
                score += weight * value
    
    # Clamp to 0-1 range
    return max(0, min(1, score))


def preprocess_face_image(image: np.ndarray, target_size: Tuple[int, int] = (48, 48)) -> np.ndarray:
    """
    Preprocess face image for emotion detection model.
    
    Args:
        image: RGB image array
        target_size: Target dimensions (width, height)
        
    Returns:
        Preprocessed grayscale image normalized to 0-1
    """
    # Convert to PIL Image for resizing
    pil_image = Image.fromarray(image)
    
    # Convert to grayscale
    gray_image = pil_image.convert('L')
    
    # Resize
    resized = gray_image.resize(target_size, Image.Resampling.LANCZOS)
    
    # Convert to numpy and normalize
    normalized = np.array(resized) / 255.0
    
    # Reshape for model input (batch, height, width, channels)
    return normalized.reshape(1, target_size[1], target_size[0], 1)


def aggregate_emotions(emotions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate multiple emotion detections into a summary.
    
    Args:
        emotions: List of emotion detection results
        
    Returns:
        Aggregated emotion summary
    """
    if not emotions:
        return {"dominant_emotion": "Neutral", "confidence": 0.5, "distribution": {}}
    
    emotion_counts: Dict[str, float] = {}
    total_confidence = 0
    
    for detection in emotions:
        emotion = detection.get('emotion', 'Neutral')
        confidence = detection.get('confidence', 0.5)
        
        if emotion not in emotion_counts:
            emotion_counts[emotion] = 0
        emotion_counts[emotion] += confidence
        total_confidence += confidence
    
    # Normalize distribution
    distribution = {
        e: c / total_confidence 
        for e, c in emotion_counts.items()
    }
    
    # Find dominant emotion
    dominant = max(emotion_counts, key=emotion_counts.get)
    
    return {
        "dominant_emotion": dominant,
        "confidence": emotion_counts[dominant] / len(emotions),
        "distribution": distribution
    }


def moving_average(values: List[float], window: int = 7) -> List[float]:
    """
    Calculate moving average for trend analysis.
    
    Args:
        values: List of numeric values
        window: Window size for averaging
        
    Returns:
        List of moving average values
    """
    if len(values) < window:
        return values
    
    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        window_values = values[start:i + 1]
        result.append(sum(window_values) / len(window_values))
    
    return result
