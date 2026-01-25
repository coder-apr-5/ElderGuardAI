#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Logger Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Centralized logging configuration using Loguru.
Provides structured logging for all ML service components.
"""

import os
import sys
from loguru import logger

# Remove default handler
logger.remove()

# Get log level from environment
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_FORMAT = os.getenv(
    'LOG_FORMAT',
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)

# Console handler (stdout)
logger.add(
    sys.stdout,
    format=LOG_FORMAT,
    level=LOG_LEVEL,
    colorize=True,
    backtrace=True,
    diagnose=True,
    enqueue=True  # Thread-safe
)

# File handler (rotating)
LOG_DIR = os.getenv('LOG_DIR', 'logs')
if LOG_DIR:
    os.makedirs(LOG_DIR, exist_ok=True)
    
    # General log file
    logger.add(
        os.path.join(LOG_DIR, 'eldernest_ml_{time:YYYY-MM-DD}.log'),
        format=LOG_FORMAT,
        level='DEBUG',
        rotation='00:00',  # Rotate at midnight
        retention='7 days',
        compression='zip',
        enqueue=True
    )
    
    # Error-only log file
    logger.add(
        os.path.join(LOG_DIR, 'errors_{time:YYYY-MM-DD}.log'),
        format=LOG_FORMAT,
        level='ERROR',
        rotation='00:00',
        retention='30 days',
        compression='zip',
        enqueue=True
    )
    
    # Critical alerts log (never deleted)
    logger.add(
        os.path.join(LOG_DIR, 'critical_alerts.log'),
        format=LOG_FORMAT,
        level='CRITICAL',
        rotation='10 MB',
        retention=None,  # Never delete
        enqueue=True
    )


def get_logger(name: str = None):
    """
    Get a logger instance with optional context name.
    
    Args:
        name: Optional name to add context
        
    Returns:
        Configured logger instance
    """
    if name:
        return logger.bind(name=name)
    return logger


def log_request(method: str, path: str, status: int, duration_ms: float):
    """Log HTTP request details."""
    logger.info(f"{method} {path} -> {status} ({duration_ms:.2f}ms)")


def log_emergency(emergency_type: str, user_id: str, severity: str, message: str):
    """Log emergency detection."""
    logger.critical(
        f"🚨 EMERGENCY | type={emergency_type} | user={user_id} | "
        f"severity={severity} | {message}"
    )


def log_prediction(user_id: str, risk_level: str, score: float):
    """Log risk prediction."""
    emoji = {'SAFE': '✅', 'MONITOR': '⚠️', 'HIGH_RISK': '🔴'}.get(risk_level, '❓')
    logger.info(f"{emoji} Risk: {risk_level} ({score:.2f}) | user={user_id}")


def log_alert_sent(elder_id: str, family_count: int, severity: str):
    """Log alert notification."""
    logger.info(
        f"📱 Alert sent | elder={elder_id} | "
        f"severity={severity} | families={family_count}"
    )


# Export configured logger
__all__ = [
    'logger',
    'get_logger',
    'log_request',
    'log_emergency',
    'log_prediction',
    'log_alert_sent'
]
