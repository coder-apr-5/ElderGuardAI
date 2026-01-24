# ElderNest AI Mood Service

> 🤖 AI-powered mood detection and chat service for elderly care

A production-ready Node.js/Express microservice that provides empathetic AI conversations and emotional wellbeing analysis for elderly users.

## 🌟 Features

- **AI Chat Companion** - Warm, empathetic conversations optimized for elderly users
- **Sentiment Analysis** - Real-time emotional tone detection (positive/neutral/negative)
- **Mood Detection** - Multi-signal mood classification (happy, sad, anxious, lonely, distressed)
- **Risk Assessment** - Weighted rule-based scoring without ML dependencies
- **Pattern Recognition** - Behavioral pattern detection over time
- **Dual AI Support** - Works with both OpenAI (GPT-4o-mini) and Google Gemini

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [Integration Guide](#-integration-guide)
- [Deployment](#-deployment)
- [Testing](#-testing)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key and/or Google Gemini API key

### Installation

```bash
# Clone and navigate to the service
cd backend/ai-mood-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your API keys in .env
# OPENAI_API_KEY=your-key
# or
# GEMINI_API_KEY=your-key

# Start development server
npm run dev
```

The service will start at `http://localhost:4000`

### Health Check

```bash
curl http://localhost:4000/health
```

## 📡 API Endpoints

### Chat Endpoints

#### POST `/api/chat`

Main conversation endpoint with AI companion.

**Request:**
```json
{
  "userId": "elder123",
  "message": "I'm feeling really lonely today. Nobody called.",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How are you today?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "aiResponse": "I'm sorry you're feeling lonely. That can be really hard. Have you thought about calling one of your family members? I'm here to chat with you anytime.",
    "sentiment": {
      "score": -0.6,
      "label": "negative",
      "confidence": 0.85,
      "tokens": ["lonely", "nobody"]
    },
    "mood": {
      "primary": "lonely",
      "secondary": "sad",
      "confidence": 0.78,
      "indicators": ["lonely", "nobody", "feeling"]
    }
  }
}
```

#### GET `/api/chat/context/:userId`

Retrieve conversation context and mood history.

#### DELETE `/api/chat/context/:userId`

Clear conversation context for a user.

---

### Analysis Endpoints

#### POST `/api/analyze/sentiment`

Analyze emotional tone of text.

**Request:**
```json
{
  "text": "I had a wonderful day! My daughter visited and we had lunch together.",
  "useAI": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 0.75,
    "comparative": 0.15,
    "label": "positive",
    "confidence": 0.92,
    "tokens": ["wonderful", "day", "daughter", "visited", "lunch", "together"]
  }
}
```

#### POST `/api/analyze/mood`

Detect mood category from text.

**Request:**
```json
{
  "text": "I can't sleep. I keep worrying about everything.",
  "userId": "elder123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "primary": "anxious",
    "secondary": "distressed",
    "confidence": 0.82,
    "indicators": ["can't sleep", "worrying", "everything"]
  }
}
```

#### POST `/api/analyze/risk`

Calculate risk assessment for a user.

**Request:**
```json
{
  "userId": "elder123",
  "timeWindowDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "riskLevel": "monitor",
    "riskScore": 0.55,
    "factors": [
      "Persistent negative mood detected",
      "Signs of social isolation",
      "Some health mentions"
    ],
    "recommendations": [
      "Schedule check-in call with family member",
      "Encourage social activities or visits",
      "Increase monitoring frequency"
    ],
    "timestamp": "2026-01-24T10:30:00Z"
  }
}
```

#### POST `/api/analyze/patterns`

Analyze behavioral patterns over time.

#### POST `/api/analyze/quick-risk`

Quick risk assessment from a single message.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 4000 |
| `AI_PROVIDER` | Primary AI provider (openai/gemini) | openai |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_MODEL` | OpenAI model to use | gpt-4o-mini |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `GEMINI_MODEL` | Gemini model to use | gemini-pro |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | localhost:5000,5173 |
| `RISK_HIGH_THRESHOLD` | High risk threshold (0-1) | 0.7 |
| `RISK_MONITOR_THRESHOLD` | Monitor threshold (0-1) | 0.4 |
| `RATE_LIMIT_MAX` | Max requests per window | 100 |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window | 15 |
| `LOG_LEVEL` | Logging level | info |
| `MAX_CONTEXT_MESSAGES` | Max messages in context | 10 |
| `CONTEXT_EXPIRY_HOURS` | Context expiry time | 24 |

---

## 🏗️ Architecture

```
ai-mood-service/
├── src/
│   ├── config/
│   │   ├── env.ts          # Environment configuration
│   │   ├── openai.ts       # OpenAI client setup
│   │   └── gemini.ts       # Gemini client setup
│   ├── services/
│   │   ├── chat.service.ts      # AI conversation handling
│   │   ├── sentiment.service.ts # Sentiment analysis
│   │   ├── mood.service.ts      # Mood detection
│   │   ├── risk.service.ts      # Risk scoring
│   │   └── pattern.service.ts   # Pattern recognition
│   ├── controllers/
│   │   ├── chat.controller.ts
│   │   └── analysis.controller.ts
│   ├── routes/
│   │   ├── chat.routes.ts
│   │   └── analysis.routes.ts
│   ├── types/
│   │   └── index.ts        # TypeScript definitions
│   ├── utils/
│   │   ├── logger.ts       # Winston logging
│   │   ├── validators.ts   # Request validation
│   │   └── responses.ts    # API response helpers
│   ├── app.ts              # Express configuration
│   └── server.ts           # Entry point
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

### Key Components

1. **Chat Service** - Handles AI conversations with context management
2. **Sentiment Service** - Hybrid local + AI sentiment analysis
3. **Mood Service** - Multi-signal mood classification
4. **Risk Service** - Weighted rule-based risk assessment
5. **Pattern Service** - Behavioral pattern detection

---

## 🔌 Integration Guide

### From Main Backend

```typescript
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_MOOD_SERVICE_URL || 'http://localhost:4000';

// Chat with AI
async function chat(userId: string, message: string) {
  const response = await axios.post(`${AI_SERVICE_URL}/api/chat`, {
    userId,
    message,
  });
  return response.data;
}

// Get risk assessment
async function getRiskAssessment(userId: string) {
  const response = await axios.post(`${AI_SERVICE_URL}/api/analyze/risk`, {
    userId,
    timeWindowDays: 7,
  });
  return response.data;
}

// Quick mood check
async function quickMoodCheck(text: string) {
  const response = await axios.post(`${AI_SERVICE_URL}/api/analyze/mood`, {
    text,
  });
  return response.data;
}
```

### WebSocket Integration (Future)

The service can be extended to support WebSocket for real-time chat:

```typescript
// In main backend, forward WebSocket messages
socket.on('elderChat', async (data) => {
  const result = await chat(data.userId, data.message);
  socket.emit('aiResponse', result);
  
  // Check if intervention needed
  if (result.data.mood.primary === 'distressed') {
    notifyFamily(data.userId, result.data);
  }
});
```

---

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t eldernest-ai-mood-service .

# Run container
docker run -d \
  -p 4000:4000 \
  -e OPENAI_API_KEY=your-key \
  -e NODE_ENV=production \
  --name ai-mood-service \
  eldernest-ai-mood-service
```

### Railway.app

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Render.com

1. Create new Web Service
2. Connect repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

---

## 🧪 Testing

### Manual Testing with cURL

```bash
# Health check
curl http://localhost:4000/health

# Chat
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test123", "message": "Hello, how are you?"}'

# Sentiment analysis
curl -X POST http://localhost:4000/api/analyze/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel wonderful today!"}'

# Mood detection
curl -X POST http://localhost:4000/api/analyze/mood \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so lonely and sad", "userId": "test123"}'
```

### Sample Conversations

**Happy Elder:**
```json
{ "message": "My grandchildren visited today! We had such a wonderful time." }
// Expected: mood=happy, sentiment=positive, risk=safe
```

**Lonely Elder:**
```json
{ "message": "Nobody called me today. I've been sitting alone all day." }
// Expected: mood=lonely, sentiment=negative, risk=monitor
```

**Distressed Elder:**
```json
{ "message": "I fell down and I can't get up. My chest hurts." }
// Expected: mood=distressed, sentiment=negative, risk=high, urgent=true
```

---

## 📊 Risk Scoring Algorithm

The service uses a weighted rule-based algorithm:

| Factor | Weight | Description |
|--------|--------|-------------|
| Sentiment | 20% | Average sentiment score |
| Mood Pattern | 25% | Distribution of mood types |
| Isolation | 20% | Social isolation indicators |
| Health | 15% | Health concern mentions |
| Negative Patterns | 20% | Behavioral warning signs |

**Risk Levels:**
- **Safe** (< 0.4): Continue regular check-ins
- **Monitor** (0.4 - 0.7): Increase engagement frequency
- **High** (> 0.7): Immediate action required

---

## 📝 License

MIT License - see LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For issues and feature requests, please create a GitHub issue.

---

**Built with ❤️ for ElderNest AI**
