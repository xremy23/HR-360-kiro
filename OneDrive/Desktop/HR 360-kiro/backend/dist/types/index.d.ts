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
    createdAt: Date;
    updatedAt: Date;
}
export interface EmergencyContact {
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary: boolean;
}
export interface Organization {
    id: string;
    name: string;
    emailDomain?: string;
    inviteCode?: string;
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Team {
    id: string;
    orgId: string;
    name: string;
    managerId: string;
    departmentId?: string;
    members: string[];
    createdAt: Date;
}
export interface Department {
    id: string;
    orgId: string;
    name: string;
    teams: string[];
    createdAt: Date;
}
export interface KBGuide {
    id: string;
    orgId: string;
    title: string;
    category: 'general' | 'org-specific';
    type: string;
    content: string;
    mediaUrls?: string[];
    isRequired: boolean;
    version: number;
    previousVersions?: KBGuideVersion[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
}
export interface KBGuideVersion {
    version: number;
    content: string;
    createdAt: Date;
    createdBy: string;
}
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
    timestamp: Date;
    incidentId?: string;
    isDrill: boolean;
}
export interface Alert {
    id: string;
    orgId: string;
    teamIds?: string[];
    title: string;
    message: string;
    severity: 'advisory' | 'watch' | 'emergency';
    type: string;
    createdBy: string;
    createdAt: Date;
    expiresAt?: Date;
    isDrill: boolean;
    incidentId?: string;
}
export interface Incident {
    id: string;
    orgId: string;
    type: string;
    severity: 'advisory' | 'watch' | 'emergency';
    startTime: Date;
    endTime?: Date;
    isDrill: boolean;
    createdBy: string;
    checkIns: CheckInRecord[];
    alertsBroadcast: string[];
}
export interface CheckInRecord {
    userId: string;
    userName: string;
    teamId: string;
    status: 'safe' | 'need_help' | 'sos';
    timestamp: Date;
    notes?: string;
}
export interface AuthRequest {
    email: string;
    code?: string;
    inviteCode?: string;
    emailDomain?: string;
}
export interface AuthResponse {
    token: string;
    user: User;
}
export interface CheckInRequest {
    status: 'safe' | 'need_help' | 'sos';
    notes?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    incidentId?: string;
    isDrill: boolean;
}
export interface AlertBroadcastRequest {
    title: string;
    message: string;
    severity: 'advisory' | 'watch' | 'emergency';
    type: string;
    teamIds?: string[];
    isDrill: boolean;
}
export interface SOSRequest {
    notes?: string;
}
export interface ApiError {
    code: string;
    message: string;
    statusCode: number;
}
//# sourceMappingURL=index.d.ts.map