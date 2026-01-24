# 🤖 ElderNest AI Chat Service

> 24/7 Caring AI Companion for Elders - Always available, always caring

## 💝 What is This?

This is **Mira** (or your chosen companion name) - an AI-powered companion that provides:

- 💬 **Real-time conversations** - Always ready to chat
- ⏰ **Gentle reminders** - Medications, meals, exercises
- 🧠 **Memory** - Remembers names, preferences, past conversations
- 🎭 **Mood awareness** - Detects emotions and responds appropriately
- 🌅 **Proactive engagement** - Morning greetings, evening wind-downs, check-ins

## ✨ Personality Traits

Mira is designed to be:

| Trait | Description |
|-------|-------------|
| **Warm** | Like a caring family member |
| **Patient** | Never rushed, happy to repeat |
| **Empathetic** | Validates feelings, never dismissive |
| **Encouraging** | Gently motivating, not pushy |
| **Respectful** | Treats elders with dignity |
| **Adaptive** | Adjusts to mood and needs |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend/ai-chat-service
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
# Choose AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key

# Companion Name
COMPANION_NAME=Mira
```

### 3. Start the Service

```bash
npm run dev
```

### 4. Connect from Frontend

```tsx
import { AICompanionChat } from './components/chat';

function App() {
  return (
    <AICompanionChat
      elderId="elder-123"
      elderName="Grandma Mary"
      companionName="Mira"
    />
  );
}
```

## 📡 WebSocket Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `elder:join` | `{ elderId, profile }` | Elder joins chat |
| `chat:message` | `{ content, elderId }` | Send message |
| `routine:acknowledge` | `{ routineId, elderId }` | Mark routine done |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `chat:response` | `ChatMessage` | AI response |
| `companion:proactive` | `ChatMessage` | Proactive message |
| `routine:reminder` | `RoutineReminder` | Reminder alert |
| `chat:typing` | `{ isTyping }` | Typing indicator |

## ⏰ Routine Scheduling

The companion can remind elders about:

- 💊 **Medications** - Critical reminders
- 🍽️ **Meals** - Lunch, dinner check-ins
- 🏃 **Exercise** - Gentle encouragement
- 📅 **Appointments** - Doctor visits, etc.
- 👥 **Social** - Family calls, activities

### Adding Routines

Routines can be configured in the database or via API:

```json
{
  "type": "medication",
  "title": "Morning Medicine",
  "time": "08:00",
  "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  "reminderMinutesBefore": 15,
  "importance": "critical"
}
```

## 🎭 Mood Detection

The companion analyzes messages for emotional indicators:

| Mood | Triggers | Response |
|------|----------|----------|
| 😊 Happy | "wonderful", "love", "blessed" | Celebrate with them |
| 😢 Sad | "sad", "miss", "lonely" | Offer comfort |
| 😰 Anxious | "worried", "scared", "can't sleep" | Calming techniques |
| 💔 Lonely | "nobody visits", "forgotten" | Extra engagement |

**Family Alerts**: When concerning moods are detected, family members connected to the elder receive real-time notifications.

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health |
| `/api/companion` | GET | Companion info |
| `/api/routines/:elderId` | GET | Get routines |
| `/api/elder/:elderId/profile` | GET | Get profile |

## 🔐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5001 | Server port |
| `AI_PROVIDER` | gemini | AI provider (gemini/openai) |
| `GEMINI_API_KEY` | - | Google Gemini API key |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `COMPANION_NAME` | Mira | Companion's name |
| `AI_TEMPERATURE` | 0.8 | Response creativity |
| `MAX_CONVERSATION_HISTORY` | 20 | Messages to remember |

## 📱 Frontend Integration

### Using the Hook

```tsx
import { useAICompanion } from './hooks/useAICompanion';

function ChatWidget() {
  const {
    messages,
    sendMessage,
    isConnected,
    isTyping,
    currentMood,
    upcomingRoutines,
  } = useAICompanion({
    elderId: 'elder-123',
    elderName: 'Mary',
  });

  return (
    <div>
      {messages.map(msg => (
        <p key={msg.id}>{msg.content}</p>
      ))}
      
      {isTyping && <p>Mira is typing...</p>}
      
      <input 
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value);
          }
        }}
      />
    </div>
  );
}
```

### Using the Component

```tsx
import { AICompanionChat } from './components/chat';

<AICompanionChat
  elderId="elder-123"
  elderName="Mary"
  fontSize="large"  // normal | large | extra-large
  onMoodDetected={(mood) => console.log('Mood:', mood)}
/>
```

## 🌟 Best Practices

1. **Personalization**: Always set `elderName` for personalized greetings
2. **Font Size**: Default to `large` for better accessibility 
3. **Mood Monitoring**: Connect `onMoodDetected` to your alert system
4. **Routine Setup**: Configure routines based on elder's actual schedule
5. **Family Dashboard**: Connect family members to receive updates

## 💖 The Heart of ElderNest

This AI companion isn't just a chatbot - it's designed to be a genuine friend. Every response is crafted with:

- **Warmth** - Like talking to a caring grandchild
- **Patience** - Never rushed, always understanding
- **Respect** - Honoring the elder's wisdom and experience
- **Safety** - Prioritizing wellbeing always

Remember: We're not replacing human connection, we're supplementing it with 24/7 caring presence.

---

Made with 💝 for the elders who deserve the best care.
