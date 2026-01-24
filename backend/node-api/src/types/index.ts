/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ElderNest AI - TypeScript Type Definitions
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Request } from 'express';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type UserRole = 'elder' | 'family' | 'caregiver' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ElderUser extends User {
  role: 'elder';
  fullName: string;
  age: number;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  profilePicture?: string;
  emergencyContact: EmergencyContact;
  familyMembers: string[]; // Array of family member UIDs
  connectionCode: string; // Unique code for family to connect
  profileSetupComplete: boolean;
  medicalConditions?: string[];
  allergies?: string[];
  preferredLanguage?: string;
  timezone?: string;
  lastActive?: Date;
}

export interface FamilyUser extends User {
  role: 'family';
  fullName: string;
  phone: string;
  relationship: 'son' | 'daughter' | 'spouse' | 'sibling' | 'grandchild' | 'caregiver' | 'other';
  eldersConnected: string[]; // Array of elder UIDs
  notificationsEnabled: boolean;
  fcmToken?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHAT TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Chat {
  id?: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  sentiment: SentimentResult;
  timestamp: Date;
  metadata?: ChatMetadata;
}

export interface ChatMetadata {
  model: string;
  tokensUsed?: number;
  responseTime?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SentimentResult {
  label: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  confidence?: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEALTH & MOOD TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Mood {
  id?: string;
  userId: string;
  score: number; // 0-1 scale
  label: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  source: 'manual' | 'chat' | 'emotion_detection';
  notes?: string;
  timestamp: Date;
}

export interface Medicine {
  id?: string;
  userId: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: MedicineFrequency;
  schedule: MedicineSchedule[];
  instructions?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface MedicineSchedule {
  time: string; // HH:mm format
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export type MedicineFrequency = 'daily' | 'twice_daily' | 'weekly' | 'as_needed' | 'custom';

export interface MedicineLog {
  id?: string;
  medicineId: string;
  userId: string;
  scheduledTime: Date;
  takenAt?: Date;
  taken: boolean;
  skipped: boolean;
  skipReason?: string;
  timestamp: Date;
}

export interface Activity {
  id?: string;
  userId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type ActivityType = 
  | 'chat'
  | 'mood_log'
  | 'medicine_taken'
  | 'medicine_missed'
  | 'emergency_alert'
  | 'risk_detected'
  | 'emotion_detected'
  | 'login'
  | 'profile_update';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RISK ASSESSMENT TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type RiskLevel = 'safe' | 'monitor' | 'high';

export interface RiskScore {
  id?: string;
  userId: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-1 scale
  factors: RiskFactor[];
  features: MLFeatures;
  timestamp: Date;
}

export interface RiskFactor {
  factor: string;
  value: number;
  threshold: number;
  description: string;
}

export interface MLFeatures {
  avgMoodScore: number; // 0-1, higher better
  medicineAdherence: number; // 0-1, higher better
  avgSentiment: number; // -1 to 1, higher better
  inactivityDays: number; // 0-7, lower better
  missedMedicines: number; // count
  negativeChatCount: number; // count
}

export interface EmotionResult {
  id?: string;
  userId: string;
  emotion: EmotionLabel;
  confidence: number;
  source: 'camera' | 'upload';
  timestamp: Date;
}

export type EmotionLabel = 
  | 'Angry'
  | 'Disgust'
  | 'Fear'
  | 'Happy'
  | 'Sad'
  | 'Surprise'
  | 'Neutral';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATION TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Notification {
  id?: string;
  recipientId: string;
  elderId: string;
  elderName?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export type NotificationType = 
  | 'risk_alert'
  | 'emergency'
  | 'medicine_reminder'
  | 'medicine_missed'
  | 'mood_update'
  | 'inactivity'
  | 'wellness_report'
  | 'connection_request'
  | 'system';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API REQUEST/RESPONSE TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AuthenticatedRequest extends Request {
  user?: DecodedUser;
}

export interface DecodedUser {
  uid: string;
  email?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHAT API TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SendChatRequest {
  message: string;
}

export interface SendChatResponse {
  chatId: string;
  aiResponse: string;
  sentiment: SentimentResult;
}

export interface ChatHistoryResponse {
  chats: Chat[];
  total: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ML SERVICE TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RiskPredictionRequest {
  userId: string;
  features: MLFeatures;
}

export interface RiskPredictionResponse {
  riskLevel: RiskLevel;
  riskScore: number;
  factors: RiskFactor[];
}

export interface EmotionAnalysisRequest {
  userId: string;
  image: string; // base64
}

export interface EmotionAnalysisResponse {
  emotion: EmotionLabel;
  confidence: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ELDER STATUS TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ElderStatus {
  elder: ElderUser;
  currentMood?: Mood;
  latestRisk?: RiskScore;
  medicineAdherence: number;
  lastActivity?: Activity;
  todaysMedicines: {
    total: number;
    taken: number;
    pending: MedicineLog[];
  };
  recentEmotions: EmotionResult[];
}

export interface ElderDashboard {
  status: ElderStatus;
  activityTimeline: Activity[];
  riskHistory: RiskScore[];
  moodTrend: Mood[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMERGENCY TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface EmergencyAlert {
  id?: string;
  elderId: string;
  elderName: string;
  type: 'sos' | 'fall' | 'medical' | 'custom';
  message?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedAt?: Date;
  timestamp: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONNECTION TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ConnectionRequest {
  code: string;
  relationship: FamilyUser['relationship'];
}

export interface ConnectionResponse {
  elderId: string;
  elderName: string;
  connected: boolean;
}
