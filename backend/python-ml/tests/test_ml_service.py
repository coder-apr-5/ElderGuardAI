#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - ML Service Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Comprehensive test suite for the ML service.

Run with: pytest tests/ -v
"""

import pytest
import numpy as np
import base64
from io import BytesIO
from PIL import Image

# Test utilities
def create_test_image(width: int = 200, height: int = 200) -> str:
    """Create a test image and return base64 encoded string."""
    # Create a simple test image
    img = Image.new('RGB', (width, height), color=(128, 128, 128))
    
    # Add some variation
    pixels = img.load()
    for i in range(width):
        for j in range(height):
            pixels[i, j] = (
                (i * 2) % 256,
                (j * 2) % 256,
                ((i + j)) % 256
            )
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


class TestEmotionDetector:
    """Tests for EmotionDetector."""
    
    def test_emotion_detector_init(self):
        """Test emotion detector initialization."""
        from app.models.emotion_detector import EmotionDetector
        
        detector = EmotionDetector()
        assert detector is not None
    
    def test_analyze_emotion_with_image(self):
        """Test emotion analysis with a test image."""
        from app.models.emotion_detector import emotion_detector
        
        image_b64 = create_test_image()
        result = emotion_detector.analyze_emotion(image_b64)
        
        assert 'emotion' in result
        assert 'confidence' in result
        assert 'emotion_score' in result
        assert 'distress_level' in result
        assert 'timestamp' in result
    
    def test_emotion_score_mapping(self):
        """Test emotion to score mapping."""
        from app.models.emotion_detector import EmotionDetector
        
        detector = EmotionDetector()
        
        assert detector.EMOTION_SCORES['happy'] == 1.0
        assert detector.EMOTION_SCORES['sad'] < 0
        assert detector.EMOTION_SCORES['neutral'] == 0.0
    
    def test_emotion_trend_analysis(self):
        """Test emotion trend analysis."""
        from app.models.emotion_detector import emotion_detector
        
        # Improving trend
        history = [-0.5, -0.3, -0.1, 0.2, 0.4, 0.6]
        result = emotion_detector.analyze_emotion_trend(history)
        
        assert result['trend'] == 'improving'
        assert result['change_score'] > 0
        
        # Deteriorating trend
        history = [0.6, 0.4, 0.2, -0.1, -0.3, -0.5]
        result = emotion_detector.analyze_emotion_trend(history)
        
        assert result['trend'] == 'deteriorating'
        assert result['change_score'] < 0


class TestFallDetector:
    """Tests for FallDetector."""
    
    def test_fall_detector_init(self):
        """Test fall detector initialization."""
        from app.models.fall_detector import FallDetector
        
        detector = FallDetector()
        assert detector is not None
    
    def test_detect_fall_with_image(self):
        """Test fall detection with a test image."""
        from app.models.fall_detector import fall_detector
        
        image_b64 = create_test_image()
        result = fall_detector.detect_fall(image_b64)
        
        assert 'fall_detected' in result
        assert 'posture' in result
        assert 'confidence' in result
        assert 'timestamp' in result
    
    def test_posture_thresholds(self):
        """Test posture angle thresholds."""
        from app.models.fall_detector import FallDetector
        
        detector = FallDetector()
        
        assert detector.FALLEN_THRESHOLD == 30
        assert detector.LYING_THRESHOLD == 45
        assert detector.SITTING_THRESHOLD == 70


class TestActivityAnalyzer:
    """Tests for ActivityAnalyzer."""
    
    def test_activity_analyzer_init(self):
        """Test activity analyzer initialization."""
        from app.models.activity_analyzer import ActivityAnalyzer
        
        analyzer = ActivityAnalyzer()
        assert analyzer is not None
    
    def test_eating_pattern_analysis(self):
        """Test eating pattern analysis."""
        from app.models.activity_analyzer import activity_analyzer
        
        meal_logs = [
            {'timestamp': '2026-01-24T08:00:00', 'meal_type': 'breakfast'},
            {'timestamp': '2026-01-24T12:30:00', 'meal_type': 'lunch'},
            {'timestamp': '2026-01-24T19:00:00', 'meal_type': 'dinner'},
        ]
        
        result = activity_analyzer.analyze_eating_pattern(meal_logs, days=1)
        
        assert 'meals_per_day_avg' in result
        assert result['meals_per_day_avg'] == 3.0
        assert result['concerning'] == False
    
    def test_empty_eating_pattern(self):
        """Test eating pattern with no data."""
        from app.models.activity_analyzer import activity_analyzer
        
        result = activity_analyzer.analyze_eating_pattern([], days=7)
        
        assert result['concerning'] == True
        assert result['days_without_eating'] == 7
    
    def test_sleep_pattern_analysis(self):
        """Test sleep pattern analysis."""
        from app.models.activity_analyzer import activity_analyzer
        
        sleep_logs = [
            {'date': '2026-01-24', 'sleep_hours': 7.5, 'interruptions': 1},
            {'date': '2026-01-23', 'sleep_hours': 8.0, 'interruptions': 2},
        ]
        
        result = activity_analyzer.analyze_sleep_pattern(sleep_logs)
        
        assert 'avg_sleep_hours' in result
        assert 'sleep_quality_score' in result
        assert result['avg_sleep_hours'] > 0


class TestEmergencyDetector:
    """Tests for EmergencyDetector."""
    
    def test_emergency_detector_init(self):
        """Test emergency detector initialization."""
        from app.services.emergency_detector import EmergencyDetector
        
        detector = EmergencyDetector()
        assert detector is not None
    
    def test_no_emergency(self):
        """Test when no emergency exists."""
        from app.services.emergency_detector import emergency_detector
        
        result = emergency_detector.detect_emergency(
            vision_data={'fall_detected': False, 'distress_level': 'low'},
            activity_data={'days_without_eating': 0, 'max_inactivity_hours': 6},
            health_data={'emergency_button_presses': 0}
        )
        
        assert result['emergency'] == False
        assert result['severity'] == 'none'
    
    def test_fall_emergency(self):
        """Test fall emergency detection."""
        from app.services.emergency_detector import emergency_detector
        
        result = emergency_detector.detect_emergency(
            vision_data={'fall_detected': True},
            activity_data={},
            health_data={}
        )
        
        assert result['emergency'] == True
        assert result['severity'] == 'critical'
        assert 'fall' in result['emergency_type'].lower()
    
    def test_eating_emergency(self):
        """Test no eating emergency."""
        from app.services.emergency_detector import emergency_detector
        
        result = emergency_detector.detect_emergency(
            vision_data={},
            activity_data={'days_without_eating': 3},
            health_data={}
        )
        
        assert result['emergency'] == True
        assert 'eating' in result['emergency_type'].lower()
    
    def test_emergency_button(self):
        """Test emergency button press."""
        from app.services.emergency_detector import emergency_detector
        
        result = emergency_detector.detect_emergency(
            vision_data={},
            activity_data={},
            health_data={'emergency_button_presses': 1}
        )
        
        assert result['emergency'] == True
        assert result['severity'] == 'critical'


class TestMultiModalRiskPredictor:
    """Tests for MultiModalRiskPredictor."""
    
    def test_risk_predictor_init(self):
        """Test risk predictor initialization."""
        from app.services.multi_modal_risk_predictor import MultiModalRiskPredictor
        
        predictor = MultiModalRiskPredictor()
        assert predictor is not None
    
    def test_risk_prediction_safe(self):
        """Test risk prediction for safe scenario."""
        from app.services.multi_modal_risk_predictor import risk_predictor
        
        result = risk_predictor.predict_risk(
            chat_data={'avg_sentiment': 0.5, 'lonely_mentions': 0, 'health_complaints': 0},
            mood_data={'sad_count': 0, 'inactive_days': 0},
            vision_data={'emotion_score': 0.5, 'fall_count': 0, 'distress_count': 0, 'pain_count': 0, 'inactivity_hours': 2},
            activity_data={'eating_irregularity': 0.1, 'sleep_quality': 0.8, 'days_without_eating': 0},
            health_data={'medicine_missed': 0, 'emergency_button_presses': 0}
        )
        
        assert result['risk_level'] == 'SAFE'
        assert result['risk_score'] < 0.5
    
    def test_risk_prediction_high_risk(self):
        """Test risk prediction for high risk scenario."""
        from app.services.multi_modal_risk_predictor import risk_predictor
        
        result = risk_predictor.predict_risk(
            chat_data={'avg_sentiment': -0.7, 'lonely_mentions': 5, 'health_complaints': 5},
            mood_data={'sad_count': 7, 'inactive_days': 5},
            vision_data={'emotion_score': -0.5, 'fall_count': 2, 'distress_count': 3, 'pain_count': 5, 'inactivity_hours': 16},
            activity_data={'eating_irregularity': 0.8, 'sleep_quality': 0.2, 'days_without_eating': 2},
            health_data={'medicine_missed': 5, 'emergency_button_presses': 0}
        )
        
        assert result['risk_level'] == 'HIGH_RISK'
        assert result['risk_score'] > 0.5
    
    def test_risk_factors_identification(self):
        """Test that risk factors are identified."""
        from app.services.multi_modal_risk_predictor import risk_predictor
        
        result = risk_predictor.predict_risk(
            chat_data={'avg_sentiment': -0.5, 'lonely_mentions': 5, 'health_complaints': 3},
            mood_data={'sad_count': 6, 'inactive_days': 0},
            vision_data={'emotion_score': 0, 'fall_count': 1, 'distress_count': 0, 'pain_count': 0, 'inactivity_hours': 0},
            activity_data={'eating_irregularity': 0, 'sleep_quality': 0.8, 'days_without_eating': 0},
            health_data={'medicine_missed': 0, 'emergency_button_presses': 0}
        )
        
        assert 'contributing_factors' in result
        assert len(result['contributing_factors']) > 0
    
    def test_recommendations_generated(self):
        """Test that recommendations are generated."""
        from app.services.multi_modal_risk_predictor import risk_predictor
        
        result = risk_predictor.predict_risk(
            chat_data={},
            mood_data={},
            vision_data={},
            activity_data={},
            health_data={}
        )
        
        assert 'recommendations' in result
        assert len(result['recommendations']) > 0


class TestVisionService:
    """Tests for VisionService."""
    
    def test_vision_service_init(self):
        """Test vision service initialization."""
        from app.services.vision_service import VisionService
        
        service = VisionService()
        assert service is not None
    
    @pytest.mark.asyncio
    async def test_analyze_frame(self):
        """Test full frame analysis."""
        from app.services.vision_service import vision_service
        
        image_b64 = create_test_image()
        result = await vision_service.analyze_frame(
            image_base64=image_b64,
            user_id='test-user'
        )
        
        assert 'emotion' in result
        assert 'pose' in result
        assert 'user_id' in result
        assert result['user_id'] == 'test-user'


class TestAPIEndpoints:
    """Tests for FastAPI endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)
    
    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data['service'] == 'ElderNest ML Service'
        assert 'capabilities' in data
    
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'healthy'
    
    def test_analyze_emotion_endpoint(self, client):
        """Test emotion analysis endpoint."""
        image_b64 = create_test_image()
        
        response = client.post(
            "/api/analyze-emotion",
            json={"image": image_b64}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'emotion' in data
    
    def test_detect_fall_endpoint(self, client):
        """Test fall detection endpoint."""
        image_b64 = create_test_image()
        
        response = client.post(
            "/api/detect-fall",
            json={"image": image_b64}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'fall_detected' in data
    
    def test_predict_risk_manual_endpoint(self, client):
        """Test manual risk prediction endpoint."""
        response = client.post(
            "/api/predict-risk-manual",
            json={
                "avgSentiment7days": 0.3,
                "sadMoodCount": 2,
                "lonelyMentions": 1,
                "healthComplaints": 1,
                "inactiveDays": 1,
                "medicineMissed": 0,
                "avgFacialEmotionScore": 0.2,
                "fallDetectedCount": 0,
                "distressEpisodes": 0,
                "eatingIrregularity": 0.2,
                "sleepQualityScore": 0.7,
                "daysWithoutEating": 0,
                "emergencyButtonPresses": 0,
                "cameraInactivityHours": 6.0,
                "painExpressionCount": 0
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'risk_level' in data
        assert data['risk_level'] in ['SAFE', 'MONITOR', 'HIGH_RISK']
    
    def test_check_emergency_endpoint(self, client):
        """Test emergency check endpoint."""
        response = client.post(
            "/api/check-emergency",
            json={
                "userId": "test-user",
                "visionData": {"fall_detected": False},
                "activityData": {"days_without_eating": 0},
                "healthData": {"emergency_button_presses": 0}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'emergency' in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
