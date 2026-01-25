#!/usr/bin/env python3
"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ElderNest AI - Risk Prediction Model Training
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This script trains a Random Forest classifier for multi-modal risk prediction.
The model combines 15 features from camera, chat, mood, activity, and health data.

FEATURES:
1. avg_sentiment_7days (float: -1 to 1)
2. sad_mood_count (int: 0-10)
3. lonely_mentions (int: 0-10)
4. health_complaints (int: 0-10)
5. inactive_days (int: 0-7)
6. medicine_missed (int: 0-10)
7. avg_facial_emotion_score (float: -1 to 1)
8. fall_detected_count (int: 0-5)
9. distress_episodes (int: 0-5)
10. eating_irregularity (float: 0-1)
11. sleep_quality_score (float: 0-1)
12. days_without_eating (int: 0-7)
13. emergency_button_presses (int: 0-5)
14. camera_inactivity_hours (float: 0-24)
15. pain_expression_count (int: 0-10)

TARGET LABELS:
- 0 = SAFE (green - no concerns)
- 1 = MONITOR (yellow - watch closely)
- 2 = HIGH_RISK (red - immediate attention needed)

Usage:
    python training/train_risk_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os
import sys

# Constants
FEATURE_NAMES = [
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

RISK_LABELS = ['SAFE', 'MONITOR', 'HIGH_RISK']


def generate_realistic_training_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generate synthetic but realistic elderly care scenarios.
    Based on medical research and elder care best practices.
    
    The data is generated with correlated features to simulate
    realistic scenarios:
    - Healthy elders (40%)
    - Moderate concern (35%)
    - High risk (25%)
    
    Args:
        n_samples: Number of training samples to generate
        
    Returns:
        DataFrame with features and labels
    """
    np.random.seed(42)
    
    data = []
    
    for _ in range(n_samples):
        rand = np.random.random()
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # Scenario 1: Healthy Elder (40% of data)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if rand < 0.4:
            avg_sentiment = np.random.uniform(0.2, 0.8)
            sad_mood_count = np.random.randint(0, 2)
            lonely_mentions = np.random.randint(0, 2)
            health_complaints = np.random.randint(0, 2)
            inactive_days = np.random.randint(0, 2)
            medicine_missed = np.random.randint(0, 1)
            avg_facial_emotion = np.random.uniform(0.3, 0.9)
            fall_detected = 0
            distress_episodes = 0
            eating_irregularity = np.random.uniform(0, 0.2)
            sleep_quality = np.random.uniform(0.6, 1.0)
            days_without_eating = 0
            emergency_presses = 0
            camera_inactivity = np.random.uniform(0, 6)
            pain_expressions = np.random.randint(0, 1)
            label = 0  # SAFE
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # Scenario 2: Moderate Concern (35% of data)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        elif rand < 0.75:
            avg_sentiment = np.random.uniform(-0.3, 0.3)
            sad_mood_count = np.random.randint(2, 6)
            lonely_mentions = np.random.randint(2, 5)
            health_complaints = np.random.randint(1, 4)
            inactive_days = np.random.randint(2, 5)
            medicine_missed = np.random.randint(1, 3)
            avg_facial_emotion = np.random.uniform(-0.2, 0.4)
            fall_detected = np.random.choice([0, 0, 0, 1])  # Occasional fall
            distress_episodes = np.random.randint(0, 2)
            eating_irregularity = np.random.uniform(0.2, 0.5)
            sleep_quality = np.random.uniform(0.3, 0.7)
            days_without_eating = np.random.randint(0, 2)
            emergency_presses = np.random.randint(0, 1)
            camera_inactivity = np.random.uniform(6, 14)
            pain_expressions = np.random.randint(1, 4)
            label = 1  # MONITOR
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # Scenario 3: High Risk (25% of data)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        else:
            avg_sentiment = np.random.uniform(-0.8, -0.2)
            sad_mood_count = np.random.randint(5, 10)
            lonely_mentions = np.random.randint(4, 10)
            health_complaints = np.random.randint(3, 10)
            inactive_days = np.random.randint(4, 7)
            medicine_missed = np.random.randint(3, 10)
            avg_facial_emotion = np.random.uniform(-0.8, -0.1)
            fall_detected = np.random.randint(1, 5)
            distress_episodes = np.random.randint(1, 5)
            eating_irregularity = np.random.uniform(0.5, 1.0)
            sleep_quality = np.random.uniform(0, 0.4)
            days_without_eating = np.random.randint(1, 4)
            emergency_presses = np.random.randint(0, 3)
            camera_inactivity = np.random.uniform(14, 24)
            pain_expressions = np.random.randint(3, 10)
            label = 2  # HIGH_RISK
        
        data.append([
            avg_sentiment,
            sad_mood_count,
            lonely_mentions,
            health_complaints,
            inactive_days,
            medicine_missed,
            avg_facial_emotion,
            fall_detected,
            distress_episodes,
            eating_irregularity,
            sleep_quality,
            days_without_eating,
            emergency_presses,
            camera_inactivity,
            pain_expressions,
            label
        ])
    
    df = pd.DataFrame(data, columns=FEATURE_NAMES + ['risk_level'])
    
    return df


def train_risk_model(n_samples: int = 5000, save_path: str = 'trained_models'):
    """
    Train Random Forest classifier for risk prediction.
    
    Args:
        n_samples: Number of training samples to generate
        save_path: Directory to save the trained model
        
    Returns:
        Trained RandomForestClassifier model
    """
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🧠 ElderNest AI - Risk Model Training")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    # Generate training data
    print(f"\n📊 Generating {n_samples} training samples...")
    df = generate_realistic_training_data(n_samples)
    
    # Features and target
    X = df.drop('risk_level', axis=1)
    y = df['risk_level']
    
    # Train-test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n📈 Dataset Statistics:")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    print(f"\n📊 Class Distribution (Training):")
    for label_idx, label_name in enumerate(RISK_LABELS):
        count = (y_train == label_idx).sum()
        pct = count / len(y_train) * 100
        print(f"   {label_name}: {count} ({pct:.1f}%)")
    
    # Train Random Forest
    print("\n🔄 Training Random Forest classifier...")
    print("   - n_estimators: 200")
    print("   - max_depth: 15")
    print("   - class_weight: balanced")
    
    model = RandomForestClassifier(
        n_estimators=200,          # More trees for better accuracy
        max_depth=15,              # Prevent overfitting
        min_samples_split=10,
        min_samples_leaf=5,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1,                 # Use all CPU cores
        class_weight='balanced'    # Handle class imbalance
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    print("\n📊 Model Evaluation:")
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    print(f"   Training Accuracy: {train_score * 100:.2f}%")
    print(f"   Test Accuracy: {test_score * 100:.2f}%")
    
    # Cross-validation
    print("\n🔄 Cross-validation (5-fold)...")
    cv_scores = cross_val_score(model, X_train, y_train, cv=5)
    print(f"   CV Scores: {cv_scores.round(3)}")
    print(f"   Mean CV Score: {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 2 * 100:.2f}%)")
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # Detailed metrics
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=RISK_LABELS))
    
    print("📊 Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"            Predicted")
    print(f"         SAFE MON HIGH")
    for i, label in enumerate(['SAFE  ', 'MON   ', 'HIGH  ']):
        print(f"Actual {label} {cm[i][0]:4d} {cm[i][1]:4d} {cm[i][2]:4d}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🎯 Top 10 Most Important Features:")
    for idx, row in feature_importance.head(10).iterrows():
        bar = '█' * int(row['importance'] * 50)
        print(f"   {row['feature']:<30} {row['importance']:.4f} {bar}")
    
    # Save model
    os.makedirs(save_path, exist_ok=True)
    
    model_path = os.path.join(save_path, 'risk_prediction_model.pkl')
    features_path = os.path.join(save_path, 'feature_names.pkl')
    importance_path = os.path.join(save_path, 'feature_importance.csv')
    
    joblib.dump(model, model_path)
    joblib.dump(X.columns.tolist(), features_path)
    feature_importance.to_csv(importance_path, index=False)
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ Model Training Complete!")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"\n📁 Saved Files:")
    print(f"   - Model: {model_path}")
    print(f"   - Features: {features_path}")
    print(f"   - Importance: {importance_path}")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    return model


def main():
    """Main entry point for training script."""
    # Determine save path based on script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    save_path = os.path.join(project_root, 'trained_models')
    
    print(f"📂 Project root: {project_root}")
    print(f"📂 Save path: {save_path}")
    
    # Train the model
    model = train_risk_model(n_samples=5000, save_path=save_path)
    
    return model


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Training interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
