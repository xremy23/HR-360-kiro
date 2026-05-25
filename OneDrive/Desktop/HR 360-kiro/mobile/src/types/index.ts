// User & Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'hr' | 'employee' | 'manager';
  orgId: string;
  teamId?: string;
  departmentId?: string;
  emergencyContacts: EmergencyContact[];
  address?: string;
  latitude?: number;
  longitude?: number;
  biometricEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  emailDomain?: string;
  inviteCode?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  orgId: string;
  name: string;
  managerId: string;
  departmentId?: string;
  members: string[]; // User IDs
  createdAt: string;
}

export interface Department {
  id: string;
  orgId: string;
  name: string;
  teams: string[]; // Team IDs
  createdAt: string;
}

// Knowledge Base Types
export interface KBGuide {
  id: string;
  orgId: string;
  title: string;
  category: 'general' | 'org-specific';
  type: 'typhoon' | 'earthquake' | 'volcanic' | 'flood' | 'fire' | 'tornado' | 'data-breach' | 'intruder' | 'active-threat' | 'workplace-violence' | 'other';
  content: string;
  mediaUrls?: string[]; // Cached locally
  isRequired: boolean;
  version: number;
  previousVersions?: KBGuideVersion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface KBGuideVersion {
  version: number;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface GuideAcknowledgment {
  id: string;
  userId: string;
  guideId: string;
  acknowledgedAt: string;
}

// Check-in Types
export interface CheckIn {
  id: string;
  userId: string;
  teamId: string;
  status: 'safe' | 'need_help' | 'sos';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  incidentId?: string;
  isDrill: boolean;
  syncedToServer: boolean;
}

export interface CheckInHistory {
  id: string;
  userId: string;
  teamId: string;
  status: 'safe' | 'need_help' | 'sos';
  timestamp: string;
  incidentId: string;
  isDrill: boolean;
}

// Alert Types
export interface Alert {
  id: string;
  orgId: string;
  teamIds?: string[]; // If empty, broadcast to all
  title: string;
  message: string;
  severity: 'advisory' | 'watch' | 'emergency';
  type: 'typhoon' | 'earthquake' | 'volcanic' | 'flood' | 'fire' | 'tornado' | 'custom';
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isDrill: boolean;
  incidentId?: string;
}

export interface AlertNotification {
  id: string;
  userId: string;
  alertId: string;
  read: boolean;
  readAt?: string;
  receivedAt: string;
}

// Incident Types
export interface Incident {
  id: string;
  orgId: string;
  type: string;
  severity: 'advisory' | 'watch' | 'emergency';
  startTime: string;
  endTime?: string;
  isDrill: boolean;
  createdBy: string;
  checkIns: CheckInRecord[];
  alertsBroadcast: string[]; // Alert IDs
}

export interface CheckInRecord {
  userId: string;
  userName: string;
  teamId: string;
  status: 'safe' | 'need_help' | 'sos';
  timestamp: string;
  notes?: string;
}

// Contact Types
export interface Contact {
  id: string;
  userId: string;
  name: string;
  type: 'personal' | 'hotline' | 'location-based';
  phone: string;
  email?: string;
  category?: string; // e.g., "Fire Station", "Hospital", "Police"
  address?: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // In km
  isPinned: boolean;
  createdAt: string;
}

export interface LocationBasedContact {
  id: string;
  name: string;
  type: 'hospital' | 'fire_station' | 'police' | 'barangay' | 'other';
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

// To-Go Bag Types
export interface ToBagItem {
  id: string;
  userId: string;
  name: string;
  category: 'documents' | 'supplies' | 'electronics' | 'clothing' | 'other';
  quantity: number;
  isPacked: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// SOS Types
export interface SOSEscalation {
  id: string;
  userId: string;
  initiatedAt: string;
  status: 'pending' | 'notified_manager' | 'notified_contacts' | 'notified_team' | 'resolved';
  managerNotifiedAt?: string;
  emergencyContactsNotifiedAt?: string;
  teamNotifiedAt?: string;
  resolvedAt?: string;
  notes?: string;
}

// Sync Types
export interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: any;
  timestamp: string;
  synced: boolean;
}

// Offline Map Types
export interface OfflineMap {
  id: string;
  orgId: string;
  name: string;
  buildingName?: string;
  fileUrl: string; // Local file path
  fileType: 'pdf' | 'image';
  createdAt: string;
}

// Biometric Types
export interface BiometricSettings {
  userId: string;
  enabled: boolean;
  type: 'faceId' | 'fingerprint' | 'both';
  lastAuthAt?: string;
}

// Sync Status
export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt?: string;
  pendingItems: number;
  isSyncing: boolean;
}
