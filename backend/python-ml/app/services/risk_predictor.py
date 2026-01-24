"""
ElderNest AI - Risk Predictor Service
Uses ML model to predict risk level based on behavioral features.
"""

import numpy as np
import joblib
import os
from typing import Dict, List, Any
from sklearn.ensemble import RandomForestClassifier


class RiskPredictor:
    """
    Risk prediction service using RandomForest classifier.
    Predicts risk level (safe/monitor/high) based on elder behavioral features.
    """
    
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(
            os.path.dirname(__file__), 
            '..', '..', 'trained_models', 'risk_model.pkl'
        )
        self.feature_names = [
            'avgMoodScore',
            'medicineAdherence', 
            'avgSentiment',
            'inactivityDays'
        ]
        self.risk_labels = ['safe', 'monitor', 'high']
        
        # Load or train model
        self._load_or_train_model()
    
    def _load_or_train_model(self):
        """Load existing model or train a new one."""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                print("✅ Risk model loaded successfully")
            else:
                self._train_mock_model()
        except Exception as e:
            print(f"⚠️ Could not load model: {e}. Training new model...")
            self._train_mock_model()
    
    def _train_mock_model(self):
        """
        Train a mock RandomForest model with synthetic data.
        This is for hackathon/demo purposes.
        """
        print("🔄 Training mock risk prediction model...")
        
        # Synthetic training data
        # Features: [avgMoodScore, medicineAdherence, avgSentiment, inactivityDays]
        X = np.array([
            # Safe scenarios
            [0.8, 0.95, 0.5, 0],    # High mood, great adherence, positive sentiment
            [0.7, 0.85, 0.3, 1],    # Good mood, good adherence
            [0.6, 0.9, 0.2, 0],     # Decent mood, good adherence
            [0.75, 0.8, 0.4, 1],    # Good overall
            
            # Monitor scenarios
            [0.5, 0.7, 0.0, 2],     # Average mood, moderate adherence
            [0.45, 0.65, -0.1, 3],  # Below average mood
            [0.4, 0.75, -0.2, 2],   # Low mood, okay adherence
            [0.55, 0.6, 0.1, 3],    # Moderate with some inactivity
            
            # High risk scenarios
            [0.3, 0.5, -0.5, 5],    # Low mood, poor adherence, negative
            [0.2, 0.4, -0.6, 6],    # Very low mood, bad adherence
            [0.25, 0.3, -0.4, 7],   # Critical levels
            [0.35, 0.45, -0.7, 4],  # Bad sentiment, some inactivity
        ])
        
        # Labels: 0=safe, 1=monitor, 2=high
        y = np.array([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2])
        
        # Train RandomForest classifier
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self.model.fit(X, y)
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print(f"✅ Risk model trained and saved to {self.model_path}")
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict risk level based on input features.
        
        Args:
            features: Dictionary containing behavioral features
            
        Returns:
            Dictionary with riskLevel, riskScore, and contributing factors
        """
        # Extract features
        feature_vector = np.array([[
            features.get('avgMoodScore', 0.5),
            features.get('medicineAdherence', 1.0),
            features.get('avgSentiment', 0.0),
            features.get('inactivityDays', 0),
        ]])
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba(feature_vector)[0]
        predicted_class = self.model.predict(feature_vector)[0]
        
        # Calculate risk score (weighted average toward high risk)
        risk_score = (
            probabilities[0] * 0.0 +   # safe contributes 0
            probabilities[1] * 0.5 +   # monitor contributes 0.5
            probabilities[2] * 1.0     # high contributes 1.0
        )
        
        # Identify risk factors
        factors = self._identify_risk_factors(features)
        
        return {
            "riskLevel": self.risk_labels[predicted_class],
            "riskScore": round(float(risk_score), 3),
            "factors": factors
        }
    
    def _identify_risk_factors(self, features: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify which features are contributing to risk."""
        factors = []
        
        # Check mood score
        mood = features.get('avgMoodScore', 0.5)
        if mood < 0.4:
            factors.append({
                "factor": "avgMoodScore",
                "value": mood,
                "threshold": 0.4,
                "description": "Low mood scores detected"
            })
        
        # Check medicine adherence
        adherence = features.get('medicineAdherence', 1.0)
        if adherence < 0.7:
            factors.append({
                "factor": "medicineAdherence",
                "value": adherence,
                "threshold": 0.7,
                "description": "Poor medicine adherence"
            })
        
        # Check sentiment
        sentiment = features.get('avgSentiment', 0.0)
        if sentiment < -0.3:
            factors.append({
                "factor": "avgSentiment",
                "value": sentiment,
                "threshold": -0.3,
                "description": "Negative chat sentiment detected"
            })
        
        # Check inactivity
        inactivity = features.get('inactivityDays', 0)
        if inactivity > 3:
            factors.append({
                "factor": "inactivityDays",
                "value": inactivity,
                "threshold": 3,
                "description": "High inactivity period"
            })
        
        # Check missed medicines
        missed = features.get('missedMedicines', 0)
        if missed > 2:
            factors.append({
                "factor": "missedMedicines",
                "value": missed,
                "threshold": 2,
                "description": "Multiple missed medicines"
            })
        
        # Check negative chat count
        negative_chats = features.get('negativeChatCount', 0)
        if negative_chats > 3:
            factors.append({
                "factor": "negativeChatCount",
                "value": negative_chats,
                "threshold": 3,
                "description": "Frequent negative conversations"
            })
        
        return factors
