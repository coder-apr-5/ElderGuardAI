# ElderNest AI Backend

A hybrid backend architecture combining **Node.js Express API** with **Python FastAPI ML microservice** for the ElderNest elderly care platform.

```
┌─────────────────────────────────────────────────────────────────┐
│                      ElderNest Backend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐      REST API      ┌─────────────────┐   │
│   │   Node.js API   │◄──────────────────►│  Python ML      │   │
│   │   (Express)     │                    │  (FastAPI)      │   │
│   │   Port: 5000    │                    │  Port: 8000     │   │
│   └────────┬────────┘                    └────────┬────────┘   │
│            │                                      │            │
│            │  Firebase Admin SDK                  │  ML Models │
│            ▼                                      ▼            │
│   ┌─────────────────┐                    ┌─────────────────┐   │
│   │   Firebase      │                    │  Risk Predictor │   │
│   │   - Firestore   │                    │  Emotion Detect │   │
│   │   - Auth        │                    └─────────────────┘   │
│   │   - FCM         │                                         │
│   └─────────────────┘                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ Project Structure

```
backend/
├── node-api/                    # Node.js Express API
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── env.ts           # Environment variables
│   │   │   └── firebase.ts      # Firebase Admin SDK
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # Firebase auth verification
│   │   │   ├── errorHandler.ts  # Global error handling
│   │   │   └── validator.ts     # Request validation
│   │   ├── routes/              # API routes
│   │   │   ├── chat.routes.ts
│   │   │   ├── elder.routes.ts
│   │   │   ├── family.routes.ts
│   │   │   └── health.routes.ts
│   │   ├── controllers/         # Route controllers
│   │   │   ├── chat.controller.ts
│   │   │   ├── elder.controller.ts
│   │   │   └── family.controller.ts
│   │   ├── services/            # Business logic
│   │   │   ├── openai.service.ts
│   │   │   ├── gemini.service.ts
│   │   │   ├── sentiment.service.ts
│   │   │   ├── firestore.service.ts
│   │   │   ├── ml.service.ts
│   │   │   └── notification.service.ts
│   │   ├── types/               # TypeScript definitions
│   │   │   └── index.ts
│   │   ├── utils/               # Utility functions
│   │   │   ├── logger.ts
│   │   │   └── responses.ts
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── python-ml/                   # Python FastAPI ML Service
│   ├── app/
│   │   ├── models/              # ML model definitions
│   │   │   ├── risk_model.py
│   │   │   └── emotion_model.py
│   │   ├── services/            # ML services
│   │   │   ├── risk_predictor.py
│   │   │   └── emotion_analyzer.py
│   │   ├── utils/               # Utilities
│   │   │   └── data_processor.py
│   │   └── main.py              # FastAPI app
│   ├── trained_models/          # Saved ML models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
└── docker-compose.yml           # Docker orchestration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Firebase project with Firestore, Auth, and FCM enabled
- OpenAI API key (or Gemini API key)

### 1. Clone and Setup

```bash
cd backend

# Setup Node.js API
cd node-api
cp .env.example .env
# Edit .env with your credentials
npm install

# Setup Python ML Service
cd ../python-ml
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

**Node.js API (.env):**
```env
NODE_ENV=development
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
OPENAI_API_KEY=sk-your-openai-key
PYTHON_ML_SERVICE_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Run Services

**Development (separate terminals):**

```bash
# Terminal 1: Node.js API
cd node-api
npm run dev

# Terminal 2: Python ML Service
cd python-ml
uvicorn app.main:app --reload --port 8000
```

**Using Docker Compose:**

```bash
docker-compose up --build
```

## 📡 API Endpoints

### Node.js API (Port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Chat** |
| POST | `/api/v1/chat/send` | Send message to AI companion |
| GET | `/api/v1/chat/history` | Get chat history |
| DELETE | `/api/v1/chat/history` | Clear chat history |
| **Elder** |
| GET | `/api/v1/elder/profile` | Get elder profile |
| PUT | `/api/v1/elder/profile` | Update profile |
| POST | `/api/v1/elder/mood` | Log mood check-in |
| GET | `/api/v1/elder/medicines` | Get medicine schedule |
| POST | `/api/v1/elder/medicine/:id/take` | Mark medicine taken |
| POST | `/api/v1/elder/emergency` | Trigger emergency alert |
| POST | `/api/v1/elder/emotion` | Analyze emotion from image |
| **Family** |
| GET | `/api/v1/family/elders` | Get connected elders |
| GET | `/api/v1/family/elder/:id/status` | Get elder status |
| GET | `/api/v1/family/elder/:id/risk` | Get risk history |
| GET | `/api/v1/family/elder/:id/activity` | Get activity timeline |
| GET | `/api/v1/family/notifications` | Get notifications |
| POST | `/api/v1/family/connect` | Connect to elder via code |
| **Health** |
| GET | `/health` | API health check |
| GET | `/api/v1/health/risk` | Get current risk score |
| POST | `/api/v1/health/risk/predict` | Trigger risk prediction |

### Python ML API (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| POST | `/api/predict-risk` | Predict risk level |
| POST | `/api/analyze-emotion` | Detect emotion from image |

## 🔐 Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```bash
curl -X POST http://localhost:5000/api/v1/chat/send \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## 🧪 Testing with curl

```bash
# Health check
curl http://localhost:5000/health
curl http://localhost:8000/health

# Send chat message (requires auth token)
curl -X POST http://localhost:5000/api/v1/chat/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "How are you feeling today?"}'

# Risk prediction (internal API)
curl -X POST http://localhost:8000/api/predict-risk \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "features": {
      "avgMoodScore": 0.3,
      "medicineAdherence": 0.5,
      "avgSentiment": -0.4,
      "inactivityDays": 5,
      "missedMedicines": 3,
      "negativeChatCount": 5
    }
  }'
```

## 📚 API Documentation

- **Node.js API Swagger:** http://localhost:5000/api-docs
- **Python ML API Docs:** http://localhost:8000/docs

## 🚢 Deployment

### Railway / Render

1. **Node.js API:**
   - Connect GitHub repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add environment variables from `.env`

2. **Python ML Service:**
   - Connect GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. Update `PYTHON_ML_SERVICE_URL` in Node.js API to Python service URL

## 📊 ML Features

### Risk Prediction

Uses RandomForest classifier with features:
- Average mood score
- Medicine adherence rate
- Average chat sentiment
- Inactivity days
- Missed medicines count
- Negative chat count

Returns: `safe`, `monitor`, or `high` risk level with contributing factors.

### Emotion Detection

Analyzes facial images to detect emotions:
- Angry, Disgust, Fear, Happy, Sad, Surprise, Neutral

Uses OpenCV for face detection with heuristic analysis (CNN model optional).

## 🛠️ Development

```bash
# Node.js
npm run dev        # Start dev server
npm run build      # Build for production
npm run typecheck  # Type checking

# Python
uvicorn app.main:app --reload  # Start dev server
```

## 📝 License

MIT License - ElderNest Team
