#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Emergency Detector
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL COMPONENT: Detects emergency situations requiring
IMMEDIATE family notification.

Emergency Scenarios:
1. Fall detected + no movement for 5+ minutes
2. Extreme distress emotion (critical level) for 10+ minutes
3. Pain expression + health complaint keywords
4. No eating for 2+ days
5. Emergency button pressed
6. Prolonged inactivity (>18 hours no camera movement)
7. Multiple risk factors combined

This service can SAVE LIVES by detecting emergencies early.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from loguru import logger


class EmergencyDetector:
    """
    Emergency detector for elderly care.
    
    Combines multiple signals to detect life-threatening
    situations requiring immediate intervention.
    """
    
    # Emergency thresholds (tuned for safety - prefer false positives over misses)
    THRESHOLDS = {
        'fall_no_movement_minutes': 5,      # Critical if no movement after fall
        'critical_distress_duration_min': 10,
        'days_without_eating': 2,           # Medical emergency threshold
        'inactivity_hours': 18,             # Prolonged absence of activity
        'pain_score_threshold': 0.7,        # High pain indication
        'combined_risk_factors': 3          # Number of factors to trigger alert
    }
    
    def __init__(self):
        """Initialize EmergencyDetector."""
        logger.info("✅ EmergencyDetector initialized")
        logger.info(f"   Thresholds: {self.THRESHOLDS}")
    
    def detect_emergency(
        self,
        vision_data: Optional[Dict] = None,
        activity_data: Optional[Dict] = None,
        health_data: Optional[Dict] = None,
        recent_events: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Detect if elder is in emergency situation.
        
        Args:
            vision_data: Camera analysis results (emotion, fall detection)
            activity_data: Activity pattern analysis
            health_data: Health metrics and medicine adherence
            recent_events: Recent notable events
            
        Returns:
            Emergency detection result:
            {
                'emergency': True,
                'emergency_type': 'fall_detected',
                'severity': 'critical',  # low, medium, high, critical
                'alert_message': 'Fall detected! No movement for 5 minutes.',
                'recommended_action': 'Call immediately or contact emergency services',
                'all_concerns': [...],
                'timestamp': '2026-01-25T10:45:00'
            }
        """
        vision_data = vision_data or {}
        activity_data = activity_data or {}
        health_data = health_data or {}
        recent_events = recent_events or []
        
        emergencies = []
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CHECK 1: Fall Detection
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        fall_emergency = self._check_fall_emergency(vision_data, recent_events)
        if fall_emergency:
            emergencies.append(fall_emergency)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CHECK 2: Critical Emotional Distress
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        distress_emergency = self._check_distress_emergency(vision_data)
        if distress_emergency:
            emergencies.append(distress_emergency)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CHECK 3: Severe Pain Detection
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        pain_emergency = self._check_pain_emergency(vision_data, health_data)
        if pain_emergency:
            emergencies.append(pain_emergency)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CHECK 4: No Eating for Extended Period
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        eating_emergency = self._check_eating_emergency(activity_data)
        if eating_emergency:
            emergencies.append(eating_emergency)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CHECK 5: Prolonged Inactivity
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        inactivity_emergency = self._check_inactivity_emergency(activity_data)
        if inactivity_emergency:
            emergencies.append(inactivity_emergency)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CHECK 6: Emergency Button Pressed
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        button_emergency = self._check_emergency_button(health_data)
        if button_emergency:
            emergencies.append(button_emergency)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # CHECK 7: Multiple Risk Factors Combined
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        combined_emergency = self._check_combined_risks(
            vision_data, activity_data, health_data
        )
        if combined_emergency:
            emergencies.append(combined_emergency)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # Return Result
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if not emergencies:
            return {
                'emergency': False,
                'emergency_type': None,
                'severity': 'none',
                'alert_message': None,
                'recommended_action': None,
                'all_concerns': [],
                'timestamp': datetime.now().isoformat()
            }
        
        # Sort by severity and return highest priority
        severity_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        emergencies.sort(
            key=lambda x: severity_order.get(x['severity'], 0),
            reverse=True
        )
        
        top_emergency = emergencies[0]
        
        # Log emergency
        logger.critical(
            f"🚨 EMERGENCY DETECTED: {top_emergency['type']} "
            f"(severity: {top_emergency['severity']})"
        )
        
        return {
            'emergency': True,
            'emergency_type': top_emergency['type'],
            'severity': top_emergency['severity'],
            'alert_message': top_emergency['message'],
            'recommended_action': top_emergency['action'],
            'all_concerns': emergencies,
            'total_emergencies': len(emergencies),
            'timestamp': datetime.now().isoformat()
        }
    
    def _check_fall_emergency(
        self,
        vision_data: Dict,
        recent_events: List[Dict]
    ) -> Optional[Dict]:
        """
        Check for fall-related emergencies.
        
        CRITICAL if fall detected with no subsequent movement.
        """
        if not vision_data.get('fall_detected'):
            return None
        
        # Check if there's a fall timestamp
        fall_timestamp = vision_data.get('fall_timestamp')
        
        if fall_timestamp:
            try:
                fall_time = datetime.fromisoformat(fall_timestamp)
                time_since_fall = (datetime.now() - fall_time).total_seconds() / 60
                
                if time_since_fall >= self.THRESHOLDS['fall_no_movement_minutes']:
                    return {
                        'type': 'fall_no_movement',
                        'severity': 'critical',
                        'message': (
                            f'🚨 URGENT: Fall detected {int(time_since_fall)} minutes ago '
                            f'with no movement detected!'
                        ),
                        'action': (
                            'Call immediately or contact emergency services (911). '
                            'Elder may be unable to get up or be unconscious.'
                        )
                    }
            except (ValueError, TypeError) as e:
                logger.warning(f"Could not parse fall timestamp: {e}")
        
        # Fall just detected (immediate alert)
        return {
            'type': 'fall_detected',
            'severity': 'critical',
            'message': '🚨 FALL DETECTED! Elder appears to have fallen.',
            'action': (
                'Contact immediately to verify safety. '
                'Be prepared to call emergency services if no response.'
            )
        }
    
    def _check_distress_emergency(self, vision_data: Dict) -> Optional[Dict]:
        """Check for extreme emotional distress."""
        distress_level = vision_data.get('distress_level', 'low')
        
        if distress_level == 'critical':
            return {
                'type': 'extreme_distress',
                'severity': 'critical',
                'message': (
                    '🚨 URGENT: Extreme emotional distress detected! '
                    'Facial expressions indicate severe distress.'
                ),
                'action': 'Contact immediately to check on wellbeing and provide support.'
            }
        
        if distress_level == 'high':
            return {
                'type': 'high_distress',
                'severity': 'high',
                'message': 'High emotional distress detected in facial expressions.',
                'action': 'Schedule immediate check-in call or visit.'
            }
        
        return None
    
    def _check_pain_emergency(
        self,
        vision_data: Dict,
        health_data: Dict
    ) -> Optional[Dict]:
        """Check for severe pain indicators."""
        pain_detected = vision_data.get('pain_detected', False)
        pain_score = health_data.get('pain_score', 0)
        pain_expressions = vision_data.get('pain_expression_count', 0)
        health_complaints = health_data.get('health_complaints', 0)
        
        # Critical: High pain score with visible pain expressions
        if (pain_detected and 
            pain_score > self.THRESHOLDS['pain_score_threshold']):
            return {
                'type': 'severe_pain',
                'severity': 'high',
                'message': (
                    f'Severe pain detected (score: {pain_score:.1f}). '
                    f'Visible pain expressions count: {pain_expressions}'
                ),
                'action': (
                    'Contact to assess pain level. '
                    'Consider arranging medical consultation if persistent.'
                )
            }
        
        # High: Multiple pain indicators
        if pain_expressions > 3 and health_complaints > 2:
            return {
                'type': 'pain_indicators',
                'severity': 'medium',
                'message': (
                    f'Multiple pain indicators: {pain_expressions} pain expressions, '
                    f'{health_complaints} health complaints.'
                ),
                'action': 'Monitor closely and check in about health status.'
            }
        
        return None
    
    def _check_eating_emergency(self, activity_data: Dict) -> Optional[Dict]:
        """Check for eating-related emergencies."""
        days_without_eating = activity_data.get('days_without_eating', 0)
        
        if days_without_eating >= self.THRESHOLDS['days_without_eating']:
            return {
                'type': 'no_eating',
                'severity': 'critical',
                'message': f'🚨 URGENT: No meals detected for {days_without_eating} days!',
                'action': (
                    'Contact IMMEDIATELY to ensure food access, appetite, and ability to eat. '
                    'This may indicate serious health issues or inability to prepare food.'
                )
            }
        
        # Warning if approaching threshold
        if days_without_eating == 1:
            return {
                'type': 'missed_meals',
                'severity': 'medium',
                'message': 'No meals detected for the past day.',
                'action': 'Check in to verify eating status and food availability.'
            }
        
        return None
    
    def _check_inactivity_emergency(self, activity_data: Dict) -> Optional[Dict]:
        """Check for prolonged inactivity emergencies."""
        max_inactivity = activity_data.get('max_inactivity_hours', 0)
        
        if max_inactivity >= self.THRESHOLDS['inactivity_hours']:
            return {
                'type': 'prolonged_inactivity',
                'severity': 'high',
                'message': f'No movement detected for {max_inactivity:.1f} hours.',
                'action': (
                    'Contact immediately to verify safety. '
                    'Prolonged inactivity may indicate medical emergency or inability to move.'
                )
            }
        
        # Warning at 12 hours
        if max_inactivity >= 12:
            return {
                'type': 'extended_inactivity',
                'severity': 'medium',
                'message': f'Extended inactivity: no movement for {max_inactivity:.1f} hours.',
                'action': 'Schedule check-in to verify wellbeing.'
            }
        
        return None
    
    def _check_emergency_button(self, health_data: Dict) -> Optional[Dict]:
        """Check if emergency button was pressed."""
        emergency_presses = health_data.get('emergency_button_presses', 0)
        
        if emergency_presses > 0:
            return {
                'type': 'emergency_button',
                'severity': 'critical',
                'message': f'🚨 EMERGENCY BUTTON PRESSED ({emergency_presses} times)!',
                'action': (
                    'Contact IMMEDIATELY or call emergency services. '
                    'Elder has actively requested help.'
                )
            }
        
        return None
    
    def _check_combined_risks(
        self,
        vision_data: Dict,
        activity_data: Dict,
        health_data: Dict
    ) -> Optional[Dict]:
        """Check for multiple risk factors that together indicate emergency."""
        risk_factors = []
        
        # Vision risks
        if vision_data.get('distress_level') in ['high', 'critical']:
            risk_factors.append('emotional distress')
        if vision_data.get('pain_detected'):
            risk_factors.append('pain expressions')
        if vision_data.get('unusual_posture'):
            risk_factors.append('unusual posture')
        
        # Activity risks
        if activity_data.get('prolonged_inactivity'):
            risk_factors.append('prolonged inactivity')
        if activity_data.get('concerning'):
            risk_factors.append('concerning activity patterns')
        if activity_data.get('days_without_eating', 0) > 0:
            risk_factors.append('missed meals')
        
        # Health risks
        if health_data.get('health_complaints', 0) > 3:
            risk_factors.append('multiple health complaints')
        if health_data.get('medicine_missed', 0) > 3:
            risk_factors.append('missed medications')
        
        # Trigger on threshold
        if len(risk_factors) >= self.THRESHOLDS['combined_risk_factors']:
            return {
                'type': 'multiple_risk_factors',
                'severity': 'high',
                'message': (
                    f'Multiple concerning signals detected: '
                    f'{", ".join(risk_factors[:5])}'
                    f'{"..." if len(risk_factors) > 5 else ""}'
                ),
                'action': (
                    'Schedule urgent check-in or visit. '
                    'Multiple indicators suggest declining wellbeing.'
                ),
                'risk_factors': risk_factors
            }
        
        return None
    
    def get_emergency_priority_score(self, emergency_result: Dict) -> int:
        """
        Calculate priority score for emergency routing.
        
        Returns score from 0-100 where higher = more urgent.
        """
        if not emergency_result.get('emergency'):
            return 0
        
        severity_scores = {
            'critical': 100,
            'high': 75,
            'medium': 50,
            'low': 25
        }
        
        base_score = severity_scores.get(emergency_result.get('severity'), 0)
        
        # Boost for certain emergency types
        emergency_type = emergency_result.get('emergency_type', '')
        
        if 'fall' in emergency_type or 'emergency_button' in emergency_type:
            base_score = min(100, base_score + 10)
        
        if 'no_eating' in emergency_type:
            base_score = min(100, base_score + 5)
        
        return base_score


# Create global instance for import
emergency_detector = EmergencyDetector()
