"""
ElderNest AI - Utilities
========================

This package contains utility modules:
- logger: Centralized Loguru logging configuration
- firebase_client: Firebase Admin SDK utilities
- model_loader: ML model loading utilities
"""

from app.utils.logger import logger, get_logger, log_request, log_emergency, log_prediction, log_alert_sent
from app.utils.firebase_client import firebase_client, get_db, send_notification
from app.utils.model_loader import load_model, load_risk_model, save_model, get_model_path

__all__ = [
    # Logger
    'logger',
    'get_logger',
    'log_request',
    'log_emergency',
    'log_prediction',
    'log_alert_sent',
    
    # Firebase
    'firebase_client',
    'get_db',
    'send_notification',
    
    # Model loading
    'load_model',
    'load_risk_model',
    'save_model',
    'get_model_path'
]
