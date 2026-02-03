# ElderGuard AI

**Empowering Independence. Ensuring Peace of Mind.**

ElderGuard AI is a next-generation elder care monitoring platform designed to bridge the gap between aging independence and family oversight. By leveraging advanced AI and real-time data, we provide a safety net that respects privacy while offering immediate protection.

## Business View & Startup Pitch

### Mission
To revolutionize elder care by providing intelligent, non-intrusive monitoring that enhances the quality of life for seniors and brings peace of mind to their families.

### Vision
A world where aging loved ones can live independently in their own homes for longer, supported by technology that predicts risks before they become emergencies.

### Problem Statement
The global population is aging rapidly. Families struggle to balance their own lives with the constant worry of their elders' safety. Traditional monitoring solutions are either too intrusive (cameras everywhere), too passive (panic buttons that require manual activation), or too expensive.

### Why ElderGuard AI? (The Solution)
ElderGuard AI offers a balanced approach. We use smart technology—voice assistants, mood detection, and real-time risk scoring—to monitor well-being without stripping away dignity. We move from *reactive* partial safety to *proactive* full-spectrum care.

---

## Key Features

### 🛡️ Real-Time Risk Analysis & SOS
- **Live Risk Scoring**: Our ML engine constantly evaluates risk levels based on user activity and mood.
- **Instant SOS**: A dedicated emergency button that immediately flags the user profile as "High Risk" and alerts caregivers.
- **Automated Alerts**: Critical events trigger immediate notifications to family members.

### 😊 AI-Powered Mood Trends
- **Camera-Based Detection**: Uses advanced computer vision to analyze facial cues and detect mood shifts over time.
- **Emotional Health Tracking**: Helps families understand not just physical safety, but emotional well-being.
- **Privacy First**: Analysis is performed securely, respecting the user's home environment.

### 🗣️ Multilingual Voice Assistant
- **Natural Interaction**: Elders can converse naturally with the AI companion.
- **Language Support**: Breaks down language barriers, making technology accessible to diverse demographic groups.

### 🔒 Military-Grade Admin Security
- **Secure Portal**: A dedicated environment for system administrators.
- **Robust Protection**: Features IP whitelisting, audit logging, and encrypted credentials to ensure patient data remains inviolable.

---

## Structure

This is a monorepo managed by NPM Workspaces.

- **packages/elder-app**: A simplified, accessible tablet application for elders.
- **packages/family-dashboard**: A data-rich dashboard for family members and caregivers.
- **packages/admin-portal**: A secure portal for system administration and oversight.
- **packages/shared**: Shared utilities, types, and constants.

## Tech Stack

### Frontend
- **Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State/Data**: React Query
- **Routing**: React Router v6

### Backend & Services
- **Microservices Architecture**:
    - `auth-service`: HAndles authentication and session management.
    - `ai-chat-service`: Powered by LLMs for the voice assistant.
    - `ai-mood-service`: Python-based service for mood analysis.
    - `node-api`: Core business logic and data aggregation.
- **ML & AI**: Python, Computer Vision libraries.
- **Database & Realtime**: Firebase (Firestore, Realtime Database).

---

## Getting Started

### 1. Install Dependencies
Run the following in the root directory:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the respective package directories (`packages/elder-app`, `packages/family-dashboard`, `packages/admin-portal`) with your Firebase and service credentials.

### 3. Run Development Servers
To run the entire suite appropriately, use the specific commands for each package:

**Elder App:**
```bash
npm run dev:elder
```

**Family Dashboard:**
```bash
npm run dev:family
```

**Backend Services:**
(Ensure your backend services/Docker containers are running as per the `backend/README.md` instructions).
