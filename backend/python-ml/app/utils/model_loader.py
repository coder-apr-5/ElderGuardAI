#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Model Loader
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Utility for loading trained ML models.
"""

import os
from typing import Optional, Tuple, Any, List
from loguru import logger

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False


def get_model_path(model_name: str) -> Optional[str]:
    """
    Find path to trained model file.
    
    Args:
        model_name: Name of the model file (without extension)
        
    Returns:
        Full path if found, None otherwise
    """
    # Common locations
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    
    paths_to_try = [
        os.path.join(project_root, 'trained_models', f'{model_name}.pkl'),
        os.path.join(os.getcwd(), 'trained_models', f'{model_name}.pkl'),
        f'/app/trained_models/{model_name}.pkl',  # Docker
        os.path.join(os.path.expanduser('~'), '.eldernest', 'models', f'{model_name}.pkl')
    ]
    
    for path in paths_to_try:
        if os.path.exists(path):
            return path
    
    return None


def load_model(model_name: str) -> Optional[Any]:
    """
    Load a trained model by name.
    
    Args:
        model_name: Name of the model file (without extension)
        
    Returns:
        Loaded model or None
    """
    if not JOBLIB_AVAILABLE:
        logger.warning("Joblib not available. Cannot load models.")
        return None
    
    path = get_model_path(model_name)
    
    if path is None:
        logger.warning(f"Model not found: {model_name}")
        return None
    
    try:
        model = joblib.load(path)
        logger.info(f"Model loaded: {path}")
        return model
    except Exception as e:
        logger.error(f"Failed to load model {path}: {e}")
        return None


def load_risk_model() -> Tuple[Optional[Any], Optional[List[str]]]:
    """
    Load the risk prediction model and feature names.
    
    Returns:
        Tuple of (model, feature_names) or (None, None)
    """
    model = load_model('risk_prediction_model')
    
    if model is None:
        return None, None
    
    # Load feature names
    path = get_model_path('feature_names')
    feature_names = None
    
    if path:
        try:
            feature_names = joblib.load(path)
        except:
            pass
    
    if feature_names is None:
        # Default feature names
        feature_names = [
            'avg_sentiment_7days',
            'sad_mood_count',
            'lonely_mentions',
            'health_complaints',
            'inactive_days',
            'medicine_missed',
            'avg_facial_emotion_score',
            'fall_detected_count',
            'distress_episodes',
            'eating_irregularity',
            'sleep_quality_score',
            'days_without_eating',
            'emergency_button_presses',
            'camera_inactivity_hours',
            'pain_expression_count'
        ]
    
    return model, feature_names


def save_model(model: Any, model_name: str, save_dir: str = 'trained_models') -> bool:
    """
    Save a model to disk.
    
    Args:
        model: Model to save
        model_name: Name for the model file (without extension)
        save_dir: Directory to save to
        
    Returns:
        True if saved successfully
    """
    if not JOBLIB_AVAILABLE:
        logger.error("Joblib not available. Cannot save models.")
        return False
    
    try:
        os.makedirs(save_dir, exist_ok=True)
        path = os.path.join(save_dir, f'{model_name}.pkl')
        joblib.dump(model, path)
        logger.info(f"Model saved: {path}")
        return True
    except Exception as e:
        logger.error(f"Failed to save model: {e}")
        return False


__all__ = [
    'get_model_path',
    'load_model',
    'load_risk_model',
    'save_model'
]
