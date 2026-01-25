#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Vision Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Camera analysis orchestrator combining:
- Emotion detection (DeepFace)
- Fall detection (MediaPipe)
- Activity monitoring

Provides unified vision analysis API.
"""

from typing import Dict, Optional
from datetime import datetime
from loguru import logger

from app.models.emotion_detector import emotion_detector
from app.models.fall_detector import fall_detector


class VisionService:
    """
    Vision service orchestrator.
    
    Combines multiple vision analysis capabilities into
    a unified interface for camera-based monitoring.
    """
    
    def __init__(self):
        """Initialize VisionService."""
        self.emotion_detector = emotion_detector
        self.fall_detector = fall_detector
        
        logger.info("✅ VisionService initialized")
    
    async def analyze_frame(
        self,
        image_base64: str,
        user_id: str,
        detect_emotion: bool = True,
        detect_fall: bool = True,
        detect_quality: bool = True
    ) -> Dict:
        """
        Perform comprehensive analysis on a camera frame.
        
        Args:
            image_base64: Base64-encoded image
            user_id: User ID for tracking
            detect_emotion: Whether to run emotion detection
            detect_fall: Whether to run fall detection
            detect_quality: Whether to assess image quality
            
        Returns:
            Combined analysis result:
            {
                'user_id': 'user-123',
                'emotion': {...},
                'pose': {...},
                'alert': {...} or None,
                'quality': {...},
                'timestamp': '2026-01-25T10:45:00'
            }
        """
        result = {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat()
        }
        
        # Emotion detection
        if detect_emotion:
            try:
                emotion_result = self.emotion_detector.analyze_emotion(
                    image_base64,
                    detect_face_quality=detect_quality
                )
                result['emotion'] = emotion_result
            except Exception as e:
                logger.error(f"Emotion detection error: {e}")
                result['emotion'] = {'error': str(e), 'face_detected': False}
        
        # Fall detection
        if detect_fall:
            try:
                fall_result = self.fall_detector.detect_fall(image_base64)
                result['pose'] = fall_result
            except Exception as e:
                logger.error(f"Fall detection error: {e}")
                result['pose'] = {'error': str(e), 'pose_detected': False}
        
        # Check for alerts
        result['alert'] = self._check_alerts(result)
        
        # Image quality (from emotion detector if available)
        if detect_quality and 'emotion' in result:
            result['quality'] = {
                'image_quality': result['emotion'].get('image_quality', 'unknown'),
                'face_detected': result['emotion'].get('face_detected', False),
                'pose_detected': result.get('pose', {}).get('pose_detected', False)
            }
        
        return result
    
    def _check_alerts(self, analysis: Dict) -> Optional[Dict]:
        """
        Check if analysis results warrant an alert.
        
        Returns alert dict if triggered, None otherwise.
        """
        alerts = []
        
        # Fall alert (CRITICAL)
        pose = analysis.get('pose', {})
        if pose.get('fall_detected'):
            alerts.append({
                'type': 'fall_detected',
                'severity': 'critical',
                'message': 'Fall detected! Person appears to be on the ground.',
                'confidence': pose.get('confidence', 0.0)
            })
        
        # Critical distress alert
        emotion = analysis.get('emotion', {})
        if emotion.get('distress_level') == 'critical':
            alerts.append({
                'type': 'critical_distress',
                'severity': 'critical',
                'message': 'Extreme emotional distress detected.',
                'emotion': emotion.get('emotion'),
                'confidence': emotion.get('confidence', 0.0)
            })
        
        # High distress alert
        if emotion.get('distress_level') == 'high':
            alerts.append({
                'type': 'high_distress',
                'severity': 'high',
                'message': 'High emotional distress detected.',
                'emotion': emotion.get('emotion'),
                'confidence': emotion.get('confidence', 0.0)
            })
        
        # Pain detected alert
        if emotion.get('pain_detected'):
            alerts.append({
                'type': 'pain_detected',
                'severity': 'high',
                'message': 'Pain indicators detected in facial expression.',
                'emotion': emotion.get('emotion')
            })
        
        # Unusual posture alert
        if pose.get('unusual_posture'):
            alerts.append({
                'type': 'unusual_posture',
                'severity': 'medium',
                'message': 'Unusual posture detected (leaning, slouching).',
                'posture': pose.get('posture')
            })
        
        # Return highest severity alert
        if not alerts:
            return None
        
        severity_order = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0}
        alerts.sort(key=lambda x: severity_order.get(x['severity'], 0), reverse=True)
        
        return alerts[0]
    
    async def analyze_emotion_only(
        self,
        image_base64: str
    ) -> Dict:
        """
        Perform only emotion detection.
        
        Faster than full analysis when fall detection not needed.
        """
        return self.emotion_detector.analyze_emotion(image_base64)
    
    async def detect_fall_only(
        self,
        image_base64: str
    ) -> Dict:
        """
        Perform only fall detection.
        
        Faster than full analysis when emotion not needed.
        """
        return self.fall_detector.detect_fall(image_base64)
    
    def get_movement_pattern(self) -> Dict:
        """Get movement pattern analysis from fall detector."""
        return self.fall_detector.analyze_movement_pattern()
    
    def analyze_emotion_trend(
        self,
        emotion_history: list
    ) -> Dict:
        """
        Analyze emotion trend over time.
        
        Args:
            emotion_history: List of emotion scores (-1 to 1)
            
        Returns:
            Trend analysis dict
        """
        return self.emotion_detector.analyze_emotion_trend(emotion_history)


# Create global instance for import
vision_service = VisionService()
