"""
ElderNest AI - Services
=======================

This package contains core services:
- VisionService: Camera analysis orchestrator
- MultiModalRiskPredictor: Risk assessment engine
- EmergencyDetector: Emergency situation detection
- AlertService: Family notification system
- DataAggregator: Firestore data fetching

These services work together to provide comprehensive
elderly care monitoring capabilities.
"""

from app.services.vision_service import VisionService, vision_service
from app.services.multi_modal_risk_predictor import MultiModalRiskPredictor, risk_predictor
from app.services.emergency_detector import EmergencyDetector, emergency_detector
from app.services.alert_service import AlertService, alert_service
from app.services.data_aggregator import DataAggregator, data_aggregator

__all__ = [
    'VisionService',
    'vision_service',
    'MultiModalRiskPredictor',
    'risk_predictor',
    'EmergencyDetector',
    'emergency_detector',
    'AlertService',
    'alert_service',
    'DataAggregator',
    'data_aggregator'
]
