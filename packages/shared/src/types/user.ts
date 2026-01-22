import { Timestamp } from 'firebase/firestore';

export interface ElderUser {
  uid: string;
  email: string;
  fullName: string;
  age: number;
  emergencyContact: string;
  familyMembers: string[]; // Array of family UIDs
  connectionCode: string; // 6-digit code
  createdAt: Timestamp;
  lastActive: Timestamp;
  profileSetupComplete: boolean;
  role: 'elder';
}

export interface FamilyUser {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  relationship: 'son' | 'daughter' | 'caregiver' | 'other';
  eldersConnected: string[]; // Array of elder UIDs
  createdAt: Timestamp;
  lastLogin: Timestamp;
  role: 'family';
}

export type UserProfile = ElderUser | FamilyUser;
