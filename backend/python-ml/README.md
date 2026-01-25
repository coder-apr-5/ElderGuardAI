# 🧠 ElderNest AI - ML Service

> **Production-Ready Multi-Modal Risk Assessment System for Elderly Care**

This microservice provides AI-powered monitoring for elderly care, combining multiple data sources to detect emergencies, assess risk, and alert family members when intervention is needed.

---

## 🚨 **This System Can SAVE LIVES**

By detecting emergencies early—falls, distress, missed meals—this service enables faster response times that can make the difference between life and death for elderly individuals living alone.

---

## ✨ Features

### 🎭 **Emotion Detection** (DeepFace)
- Real-time facial emotion analysis
- 7 emotions: happy, sad, angry, fear, surprise, disgust, neutral
- Pain and distress detection
- Emotion trend analysis over time

### 🚨 **Fall Detection** (MediaPipe)
- Body posture analysis
- Fall detection with confidence scores
- Posture classification (standing, sitting, lying, fallen)
- Unusual posture detection

### 📊 **Activity Pattern Analysis**
- Eating pattern monitoring
- Sleep quality tracking
- Camera activity/inactivity detection
- Daily routine consistency analysis

### 🎯 **Multi-Modal Risk Prediction** (Random Forest)
- Combines 15 features from all data sources
- Risk levels: SAFE, MONITOR, HIGH_RISK
- Contributing factor identification
- Actionable recommendations

### 🚑 **Emergency Detection**
- Fall + no movement alerts
- Critical distress detection
- No eating for extended periods
- Prolonged inactivity
- Emergency button support

### 📱 **Family Notifications**
- Firebase Cloud Messaging (FCM) push notifications
- Twilio SMS for critical emergencies
- Rate limiting to prevent alert fatigue
- Alert logging for audit trail

---

## 🏗️ Architecture

```
ml-service/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── models/
│   │   ├── emotion_detector.py # DeepFace emotion analysis
│   │   ├── fall_detector.py    # MediaPipe pose detection
│   │   └── activity_analyzer.py # Activity pattern analysis
│   ├── services/
│   │   ├── vision_service.py   # Camera analysis orchestrator
│   │   ├── multi_modal_risk_predictor.py
│   │   ├── emergency_detector.py
│   │   ├── alert_service.py    # FCM + Twilio
│   │   └── data_aggregator.py  # Firestore data fetching
│   └── utils/
│       ├── logger.py
│       ├── firebase_client.py
│       └── model_loader.py
├── training/
│   └── train_risk_model.py     # Model training script
├── trained_models/             # Saved ML models
├── tests/
│   └── test_ml_service.py
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- pip

### 1. Clone and Navigate
```bash
cd backend/python-ml
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Train the Risk Model
```bash
python training/train_risk_model.py
```

Expected output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 ElderNest AI - Risk Model Training
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Generating 5000 training samples...
📈 Dataset Statistics:
   Training samples: 4000
   Test samples: 1000

🔄 Training Random Forest classifier...
   Training Accuracy: 97.25%
   Test Accuracy: 92.80%

✅ Model saved to trained_models/risk_prediction_model.pkl
```

### 5. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Firebase and Twilio credentials
```

### 6. Run the Service
```bash
uvicorn app.main:app --reload --port 8000
```

### 7. Access API
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📡 API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service information |
| GET | `/health` | Health check |

### Vision
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze-vision` | Full vision analysis (emotion + fall) |
| POST | `/api/analyze-emotion` | Emotion-only analysis |
| POST | `/api/detect-fall` | Fall-only detection |

### Risk
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict-risk` | Multi-modal risk prediction (fetches from Firestore) |
| POST | `/api/predict-risk-manual` | Risk prediction with manual features |
| GET | `/api/risk-feature-importance` | Feature importance scores |

### Emergency
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/check-emergency` | Check for emergency conditions |
| POST | `/api/send-alert` | Send alert to family members |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze-activity` | Analyze activity patterns |

---

## 📊 Risk Model Features

The Random Forest model uses 15 features:

| Feature | Source | Description |
|---------|--------|-------------|
| `avg_sentiment_7days` | Chat | Average sentiment (-1 to 1) |
| `sad_mood_count` | Mood | Number of sad moods (0-10) |
| `lonely_mentions` | Chat | Loneliness keyword count (0-10) |
| `health_complaints` | Chat | Health complaint count (0-10) |
| `inactive_days` | Mood | Days without check-in (0-7) |
| `medicine_missed` | Health | Missed medications (0-10) |
| `avg_facial_emotion_score` | Vision | Average emotion score (-1 to 1) |
| `fall_detected_count` | Vision | Number of falls (0-5) |
| `distress_episodes` | Vision | Distress event count (0-5) |
| `eating_irregularity` | Activity | Eating pattern variance (0-1) |
| `sleep_quality_score` | Activity | Sleep quality (0-1) |
| `days_without_eating` | Activity | Days with no meals (0-7) |
| `emergency_button_presses` | Health | Emergency button uses (0-5) |
| `camera_inactivity_hours` | Vision | Max inactivity hours (0-24) |
| `pain_expression_count` | Vision | Pain expression count (0-10) |

---

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

---

## 🐳 Docker

### Build
```bash
docker build -t eldernest-ml:latest .
```

### Run
```bash
docker run -p 8000:8000 \
  -e FIREBASE_PROJECT_ID=your-project \
  -e FIREBASE_PRIVATE_KEY="..." \
  -e FIREBASE_CLIENT_EMAIL="..." \
  eldernest-ml:latest
```

### Docker Compose
```yaml
services:
  ml-service:
    build: ./python-ml
    ports:
      - "8000:8000"
    environment:
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 📱 Example Usage

### Analyze Vision (Full)
```bash
curl -X POST http://localhost:8000/api/analyze-vision \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "elder-123",
    "image": "BASE64_IMAGE_DATA",
    "detectEmotion": true,
    "detectFall": true
  }'
```

### Predict Risk (Manual)
```bash
curl -X POST http://localhost:8000/api/predict-risk-manual \
  -H "Content-Type: application/json" \
  -d '{
    "avgSentiment7days": -0.3,
    "sadMoodCount": 5,
    "lonelyMentions": 3,
    "healthComplaints": 2,
    "inactiveDays": 2,
    "medicineMissed": 1,
    "avgFacialEmotionScore": -0.2,
    "fallDetectedCount": 0,
    "distressEpisodes": 1,
    "eatingIrregularity": 0.4,
    "sleepQualityScore": 0.5,
    "daysWithoutEating": 0,
    "emergencyButtonPresses": 0,
    "cameraInactivityHours": 8.0,
    "painExpressionCount": 2
  }'
```

### Response Example
```json
{
  "risk_level": "MONITOR",
  "risk_score": 0.65,
  "risk_probability": {
    "safe": 0.15,
    "monitor": 0.65,
    "high_risk": 0.20
  },
  "contributing_factors": [
    "Frequent sad moods (5 times)",
    "Repeated mentions of loneliness",
    "⚠️ 1 distress episode(s)"
  ],
  "recommendations": [
    "📊 Increase check-in frequency",
    "💬 Arrange family visit or video call",
    "😴 Assess sleep environment and habits"
  ]
}
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HOST` | No | Server host (default: 0.0.0.0) |
| `PORT` | No | Server port (default: 8000) |
| `DEBUG` | No | Enable debug mode (default: true) |
| `LOG_LEVEL` | No | Logging level (default: INFO) |
| `FIREBASE_PROJECT_ID` | Yes* | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Yes* | Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | Yes* | Firebase client email |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Twilio phone number |

*Required for production with real data. Service works in mock mode without Firebase.

---

## 🛡️ Security

- Non-root Docker user
- No video storage (privacy protection)
- Rate limiting on alerts
- Input validation on all endpoints
- CORS configuration
- Health checks for monitoring

---

## 📈 Performance

- Response time: <3 seconds on CPU
- Memory: ~500MB for full stack
- CPU: Works on single core (multi-core for training)
- Startup time: ~10 seconds (model loading)

---

## 📞 Support

For issues or questions:
1. Check the API docs at `/docs`
2. Review logs in `/logs` directory
3. Run tests to diagnose issues

---

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ for families caring for elderly loved ones.**
