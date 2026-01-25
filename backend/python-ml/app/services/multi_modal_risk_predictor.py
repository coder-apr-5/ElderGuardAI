#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Multi-Modal Risk Predictor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Combines ALL data sources into unified risk prediction:
1. Chat sentiment
2. Mood check-ins
3. Camera emotions
4. Fall detection
5. Activity patterns
6. Medicine adherence
7. Eating habits
8. Sleep quality

Uses trained Random Forest model for accurate risk classification.
"""

import os
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime
from loguru import logger

# Joblib for model loading
try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False
    logger.warning("Joblib not available. Using fallback predictions.")


class MultiModalRiskPredictor:
    """
    Multi-modal risk predictor using trained Random Forest model.
    
    Combines 15 features from multiple data sources to predict
    risk level: SAFE, MONITOR, or HIGH_RISK.
    """
    
    # Risk level labels
    RISK_LABELS = ['SAFE', 'MONITOR', 'HIGH_RISK']
    
    # Feature order (must match training)
    FEATURE_ORDER = [
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
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize MultiModalRiskPredictor.
        
        Args:
            model_path: Path to trained model file. If None, attempts to load
                       from default locations.
        """
        self.model = None
        self.feature_names = None
        self.model_loaded = False
        
        self._load_model(model_path)
        
        logger.info(f"✅ MultiModalRiskPredictor initialized (model: {self.model_loaded})")
    
    def _load_model(self, model_path: Optional[str] = None):
        """Load trained Random Forest model."""
        if not JOBLIB_AVAILABLE:
            logger.warning("Joblib not available. Using rule-based fallback.")
            return
        
        # Try multiple paths
        paths_to_try = []
        
        if model_path:
            paths_to_try.append(model_path)
        
        # Default paths
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(script_dir))
        
        paths_to_try.extend([
            os.path.join(project_root, 'trained_models', 'risk_prediction_model.pkl'),
            os.path.join(os.getcwd(), 'trained_models', 'risk_prediction_model.pkl'),
            '/app/trained_models/risk_prediction_model.pkl',  # Docker
        ])
        
        for path in paths_to_try:
            try:
                if os.path.exists(path):
                    self.model = joblib.load(path)
                    
                    # Try to load feature names
                    feature_path = path.replace('risk_prediction_model.pkl', 'feature_names.pkl')
                    if os.path.exists(feature_path):
                        self.feature_names = joblib.load(feature_path)
                    else:
                        self.feature_names = self.FEATURE_ORDER
                    
                    self.model_loaded = True
                    logger.info(f"Model loaded from {path}")
                    return
            except Exception as e:
                logger.debug(f"Failed to load from {path}: {e}")
        
        logger.warning("No trained model found. Using rule-based fallback.")
    
    def predict_risk(
        self,
        chat_data: Optional[Dict] = None,
        mood_data: Optional[Dict] = None,
        vision_data: Optional[Dict] = None,
        activity_data: Optional[Dict] = None,
        health_data: Optional[Dict] = None
    ) -> Dict:
        """
        Predict risk level from ALL data sources.
        
        Args:
            chat_data: Chat sentiment analysis
            mood_data: Mood check-in data
            vision_data: Camera/vision analysis
            activity_data: Activity pattern data
            health_data: Health metrics
            
        Returns:
            Comprehensive risk assessment:
            {
                'risk_level': 'SAFE' | 'MONITOR' | 'HIGH_RISK',
                'risk_score': 0.85,
                'risk_probability': {
                    'safe': 0.1,
                    'monitor': 0.05,
                    'high_risk': 0.85
                },
                'contributing_factors': [...],
                'recommendations': [...],
                'data_sources_used': {...},
                'timestamp': '2026-01-25T10:45:00'
            }
        """
        try:
            # Extract features
            features = self._extract_features(
                chat_data or {},
                mood_data or {},
                vision_data or {},
                activity_data or {},
                health_data or {}
            )
            
            # Use model or fallback
            if self.model_loaded and self.model is not None:
                result = self._predict_with_model(features)
            else:
                result = self._predict_with_rules(features)
            
            # Get contributing factors
            factors = self._identify_risk_factors(features)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                result['risk_level'],
                factors
            )
            
            return {
                'risk_level': result['risk_level'],
                'risk_score': result['risk_score'],
                'risk_probability': result['probabilities'],
                'contributing_factors': factors,
                'recommendations': recommendations,
                'features': features,
                'data_sources_used': {
                    'chat': chat_data is not None,
                    'mood': mood_data is not None,
                    'vision': vision_data is not None,
                    'activity': activity_data is not None,
                    'health': health_data is not None
                },
                'model_used': 'random_forest' if self.model_loaded else 'rule_based',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Risk prediction error: {e}")
            return {
                'risk_level': 'UNKNOWN',
                'risk_score': 0.0,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _extract_features(
        self,
        chat_data: Dict,
        mood_data: Dict,
        vision_data: Dict,
        activity_data: Dict,
        health_data: Dict
    ) -> Dict:
        """
        Extract all 15 features from data sources.
        
        Returns dict with all feature values.
        """
        return {
            # From chat
            'avg_sentiment_7days': chat_data.get('avg_sentiment', 0.0),
            'lonely_mentions': chat_data.get('lonely_mentions', 0),
            'health_complaints': chat_data.get('health_complaints', 0),
            
            # From mood check-ins
            'sad_mood_count': mood_data.get('sad_count', 0),
            'inactive_days': mood_data.get('inactive_days', 0),
            
            # From vision/camera
            'avg_facial_emotion_score': vision_data.get('emotion_score', 0.0),
            'fall_detected_count': vision_data.get('fall_count', 0),
            'distress_episodes': vision_data.get('distress_count', 0),
            'pain_expression_count': vision_data.get('pain_count', 0),
            'camera_inactivity_hours': vision_data.get('inactivity_hours', 0.0),
            
            # From activity logs
            'eating_irregularity': activity_data.get('eating_irregularity', 0.0),
            'sleep_quality_score': activity_data.get('sleep_quality', 1.0),
            'days_without_eating': activity_data.get('days_without_eating', 0),
            
            # From health data
            'medicine_missed': health_data.get('medicine_missed', 0),
            'emergency_button_presses': health_data.get('emergency_button_presses', 0)
        }
    
    def _predict_with_model(self, features: Dict) -> Dict:
        """Make prediction using trained Random Forest model."""
        # Create feature array in correct order
        X = np.array([[features[f] for f in self.FEATURE_ORDER]])
        
        # Predict
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        risk_level = self.RISK_LABELS[prediction]
        risk_score = probabilities[prediction]
        
        return {
            'risk_level': risk_level,
            'risk_score': round(float(risk_score), 3),
            'probabilities': {
                'safe': round(float(probabilities[0]), 3),
                'monitor': round(float(probabilities[1]), 3),
                'high_risk': round(float(probabilities[2]), 3)
            }
        }
    
    def _predict_with_rules(self, features: Dict) -> Dict:
        """
        Rule-based fallback when model unavailable.
        
        Uses weighted scoring based on feature importance.
        """
        # Weight factors based on importance
        score = 0.0
        
        # Critical factors (high weight)
        if features['fall_detected_count'] > 0:
            score += 3.0 * features['fall_detected_count']
        
        if features['emergency_button_presses'] > 0:
            score += 4.0 * features['emergency_button_presses']
        
        if features['days_without_eating'] > 0:
            score += 2.5 * features['days_without_eating']
        
        # High importance factors
        if features['distress_episodes'] > 0:
            score += 1.5 * features['distress_episodes']
        
        if features['camera_inactivity_hours'] > 12:
            score += 2.0
        
        if features['pain_expression_count'] > 2:
            score += 1.0 * (features['pain_expression_count'] - 2)
        
        # Medium importance factors
        score += -features['avg_sentiment_7days'] * 1.5  # Negative sentiment adds risk
        score += features['sad_mood_count'] * 0.3
        score += features['lonely_mentions'] * 0.2
        score += features['health_complaints'] * 0.3
        score += features['medicine_missed'] * 0.4
        score += features['inactive_days'] * 0.3
        
        # Lower importance factors
        score += -features['avg_facial_emotion_score'] * 0.5
        score += features['eating_irregularity'] * 0.5
        score += (1 - features['sleep_quality_score']) * 0.5
        
        # Normalize to probabilities
        # Score typically ranges from -2 to 10+
        normalized = min(1.0, max(0.0, (score + 2) / 12))
        
        if normalized < 0.3:
            risk_level = 'SAFE'
            probabilities = {
                'safe': round(1 - normalized, 3),
                'monitor': round(normalized * 0.7, 3),
                'high_risk': round(normalized * 0.3, 3)
            }
        elif normalized < 0.6:
            risk_level = 'MONITOR'
            probabilities = {
                'safe': round((1 - normalized) * 0.5, 3),
                'monitor': round(0.5 + (normalized - 0.3) * 0.5, 3),
                'high_risk': round(normalized * 0.3, 3)
            }
        else:
            risk_level = 'HIGH_RISK'
            probabilities = {
                'safe': round((1 - normalized) * 0.3, 3),
                'monitor': round((1 - normalized) * 0.5, 3),
                'high_risk': round(normalized, 3)
            }
        
        return {
            'risk_level': risk_level,
            'risk_score': round(normalized, 3),
            'probabilities': probabilities
        }
    
    def _identify_risk_factors(self, features: Dict) -> List[str]:
        """
        Identify which features are contributing to risk.
        
        Returns list of human-readable factor descriptions.
        """
        factors = []
        
        if features['avg_sentiment_7days'] < -0.3:
            factors.append('Persistent negative mood in conversations')
        
        if features['sad_mood_count'] > 4:
            factors.append(f'Frequent sad moods ({features["sad_mood_count"]} times)')
        
        if features['lonely_mentions'] > 3:
            factors.append('Repeated mentions of loneliness')
        
        if features['health_complaints'] > 2:
            factors.append(f'{features["health_complaints"]} health complaints reported')
        
        if features['medicine_missed'] > 2:
            factors.append(f'{features["medicine_missed"]} missed medications')
        
        if features['fall_detected_count'] > 0:
            factors.append(f'⚠️ {features["fall_detected_count"]} fall(s) detected')
        
        if features['distress_episodes'] > 0:
            factors.append(f'⚠️ {features["distress_episodes"]} distress episode(s)')
        
        if features['pain_expression_count'] > 2:
            factors.append('Frequent pain expressions detected')
        
        if features['days_without_eating'] > 0:
            factors.append(f'⚠️ No meals for {features["days_without_eating"]} day(s)')
        
        if features['camera_inactivity_hours'] > 12:
            hours = features['camera_inactivity_hours']
            factors.append(f'Prolonged inactivity ({hours:.1f} hours)')
        
        if features['sleep_quality_score'] < 0.5:
            factors.append('Poor sleep quality')
        
        if features['eating_irregularity'] > 0.5:
            factors.append('Irregular eating patterns')
        
        if features['inactive_days'] > 3:
            factors.append(f'{features["inactive_days"]} inactive days')
        
        if features['avg_facial_emotion_score'] < -0.3:
            factors.append('Consistently negative facial expressions')
        
        if features['emergency_button_presses'] > 0:
            factors.append(f'🚨 Emergency button pressed {features["emergency_button_presses"]} time(s)')
        
        return factors if factors else ['No major concerns detected']
    
    def _generate_recommendations(
        self,
        risk_level: str,
        factors: List[str]
    ) -> List[str]:
        """
        Generate actionable recommendations based on risk.
        
        Returns prioritized list of recommendations.
        """
        if risk_level == 'SAFE':
            return [
                '✅ Continue regular monitoring',
                'Maintain current care routine',
                'Encourage social activities and engagement'
            ]
        
        elif risk_level == 'MONITOR':
            recs = ['📊 Increase check-in frequency']
            
            factors_lower = ' '.join(factors).lower()
            
            if 'lonely' in factors_lower:
                recs.append('💬 Arrange family visit or video call')
            
            if 'health' in factors_lower or 'pain' in factors_lower:
                recs.append('🏥 Schedule medical consultation')
            
            if 'eating' in factors_lower or 'meal' in factors_lower:
                recs.append('🍽️ Verify food availability and appetite')
            
            if 'medicine' in factors_lower or 'medication' in factors_lower:
                recs.append('💊 Set up medication reminders or assistance')
            
            if 'sleep' in factors_lower:
                recs.append('😴 Assess sleep environment and habits')
            
            if 'inactive' in factors_lower:
                recs.append('🚶 Encourage light physical activity')
            
            return recs[:5]  # Limit to top 5
        
        else:  # HIGH_RISK
            recs = ['⚠️ IMMEDIATE ACTION REQUIRED']
            
            factors_str = ' '.join(factors).lower()
            
            if 'fall' in factors_str:
                recs.append('🚨 Contact IMMEDIATELY to verify safety after fall')
            
            if 'eating' in factors_str and 'day' in factors_str:
                recs.append('🚨 URGENT: Check food situation immediately')
            
            if 'distress' in factors_str:
                recs.append('🚨 Contact immediately - emotional distress detected')
            
            if 'inactivity' in factors_str:
                recs.append('🚨 Verify wellbeing - prolonged inactivity detected')
            
            if 'emergency' in factors_str:
                recs.append('🚨 RESPOND TO EMERGENCY BUTTON - contact now')
            
            recs.extend([
                '📞 Schedule immediate check-in or visit',
                '📋 Evaluate need for increased care level',
                '📊 Monitor closely for next 24-48 hours'
            ])
            
            return recs[:7]  # Return all important recommendations
    
    def get_feature_importance(self) -> Dict:
        """
        Get feature importance from trained model.
        
        Returns dict of feature names to importance scores.
        """
        if not self.model_loaded or self.model is None:
            # Return default importance based on domain knowledge
            return {
                'fall_detected_count': 0.15,
                'emergency_button_presses': 0.14,
                'days_without_eating': 0.12,
                'distress_episodes': 0.10,
                'camera_inactivity_hours': 0.09,
                'pain_expression_count': 0.08,
                'medicine_missed': 0.07,
                'avg_sentiment_7days': 0.06,
                'sad_mood_count': 0.05,
                'avg_facial_emotion_score': 0.04,
                'sleep_quality_score': 0.03,
                'eating_irregularity': 0.03,
                'health_complaints': 0.02,
                'inactive_days': 0.01,
                'lonely_mentions': 0.01
            }
        
        importance = self.model.feature_importances_
        return {
            name: round(float(score), 4)
            for name, score in zip(self.FEATURE_ORDER, importance)
        }


# Create global instance for import
risk_predictor = MultiModalRiskPredictor()
