"""
ElderNest AI - Emotion Model Definition
CNN model architecture for emotion detection.
"""

from typing import Optional, List
import numpy as np

# Optional TensorFlow import
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import (
        Conv2D, MaxPooling2D, Dense, Dropout, 
        Flatten, BatchNormalization
    )
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


class EmotionModel:
    """
    CNN-based emotion detection model.
    Architecture designed for 48x48 grayscale face images.
    """
    
    EMOTION_LABELS = [
        'Angry', 'Disgust', 'Fear', 'Happy',
        'Sad', 'Surprise', 'Neutral'
    ]
    
    def __init__(self):
        self.model = None
        self.is_built = False
        
        if TF_AVAILABLE:
            self._build_model()
    
    def _build_model(self):
        """Build the CNN architecture."""
        if not TF_AVAILABLE:
            print("TensorFlow not available. Cannot build emotion model.")
            return
        
        self.model = Sequential([
            # First Convolutional Block
            Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
            BatchNormalization(),
            Conv2D(32, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),
            
            # Second Convolutional Block
            Conv2D(64, (3, 3), activation='relu'),
            BatchNormalization(),
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),
            
            # Third Convolutional Block
            Conv2D(128, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),
            
            # Fully Connected Layers
            Flatten(),
            Dense(256, activation='relu'),
            BatchNormalization(),
            Dropout(0.5),
            Dense(128, activation='relu'),
            Dropout(0.5),
            Dense(7, activation='softmax')  # 7 emotion classes
        ])
        
        self.model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.is_built = True
        print("✅ Emotion CNN model built successfully")
    
    def predict(self, face_image: np.ndarray) -> dict:
        """
        Predict emotion from preprocessed face image.
        
        Args:
            face_image: Preprocessed image (1, 48, 48, 1)
            
        Returns:
            Dictionary with emotion and confidence
        """
        if not TF_AVAILABLE or self.model is None:
            return {"emotion": "Neutral", "confidence": 0.5}
        
        # Get predictions
        predictions = self.model.predict(face_image, verbose=0)
        
        # Get top prediction
        emotion_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][emotion_idx])
        
        return {
            "emotion": self.EMOTION_LABELS[emotion_idx],
            "confidence": confidence
        }
    
    def load_weights(self, weights_path: str) -> bool:
        """Load pre-trained weights."""
        if not TF_AVAILABLE or self.model is None:
            return False
        
        try:
            self.model.load_weights(weights_path)
            print(f"✅ Loaded weights from {weights_path}")
            return True
        except Exception as e:
            print(f"⚠️ Could not load weights: {e}")
            return False
    
    def save_weights(self, weights_path: str) -> bool:
        """Save model weights."""
        if not TF_AVAILABLE or self.model is None:
            return False
        
        try:
            self.model.save_weights(weights_path)
            print(f"✅ Saved weights to {weights_path}")
            return True
        except Exception as e:
            print(f"⚠️ Could not save weights: {e}")
            return False
