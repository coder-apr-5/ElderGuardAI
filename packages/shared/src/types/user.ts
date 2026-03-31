// Using string for ISO dates instead of Firestore Timestamp
export interface FamilyMemberManual {
  name: string;
  relation?: string;
  phone: string;
  photoURL?: string;
}

export interface ElderUser {
  uid: string;
  email: string;
  fullName: string;
  age?: number; // kept for backward compatibility
  dob?: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  state?: string;
  nationality?: string;
  diseases?: string[];
  bloodGroup?: string;

  emergencyContact: string; // Primary emergency number
  familyMembers: string[]; // Array of family UIDs (App users)
  manualFamilyMembers?: FamilyMemberManual[]; // Manually added members

  connectionCode: string; // 6-digit code
  createdAt: string;
  lastActive: string;
  profileSetupComplete: boolean;
  role: 'elder';
}

export interface FamilyUser {
  uid: string;
  email: string;
  fullName: string;
  dob?: string;
  photoURL?: string;
  phone: string;
  address?: string;
  state?: string;
  nationality?: string;

  relationship: 'son' | 'daughter' | 'caregiver' | 'other' | string;
  eldersConnected: string[]; // Array of elder UIDs

  manualOtherFamilyMembers?: FamilyMemberManual[]; // Other family members added manually

  createdAt: string;
  lastLogin: string;
  role: 'family';
}

export type UserProfile = ElderUser | FamilyUser;
