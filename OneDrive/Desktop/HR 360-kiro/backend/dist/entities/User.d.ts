/**
 * User Entity
 * Represents a user in the system
 */
export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    role: 'admin' | 'hr' | 'employee' | 'guest';
    organizationId?: string;
    departmentId?: string;
    teamId?: string;
    position?: string;
    address?: string;
    personalEmergencyContact?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserInput {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'admin' | 'hr' | 'employee' | 'guest';
    organizationId?: string;
    departmentId?: string;
    teamId?: string;
    position?: string;
    address?: string;
    personalEmergencyContact?: string;
}
export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    organizationId?: string;
    departmentId?: string;
    teamId?: string;
    position?: string;
    address?: string;
    personalEmergencyContact?: string;
    isActive?: boolean;
}
export interface UserProfile extends User {
    organizationName?: string;
    departmentName?: string;
    teamName?: string;
    teamHeadName?: string;
}
export declare class UserEntity implements User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    role: 'admin' | 'hr' | 'employee' | 'guest';
    organizationId?: string;
    departmentId?: string;
    teamId?: string;
    position?: string;
    address?: string;
    personalEmergencyContact?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    constructor(data: User);
    /**
     * Get full name
     */
    getFullName(): string;
    /**
     * Check if user is admin
     */
    isAdmin(): boolean;
    /**
     * Check if user is HR
     */
    isHR(): boolean;
    /**
     * Check if user is employee
     */
    isEmployee(): boolean;
    /**
     * Check if user is guest
     */
    isGuest(): boolean;
    /**
     * Convert to JSON (exclude sensitive data)
     */
    toJSON(): Partial<User>;
}
//# sourceMappingURL=User.d.ts.map