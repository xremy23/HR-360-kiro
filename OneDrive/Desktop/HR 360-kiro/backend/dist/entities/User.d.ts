/**
 * CICT Safety Portal - User Entity
 * Represents a user in the disaster preparedness and emergency response system
 */
export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    role: 'super_admin' | 'admin' | 'hr_admin' | 'safety_admin' | 'workplace_admin' | 'employee' | 'guest';
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
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'super_admin' | 'admin' | 'hr_admin' | 'safety_admin' | 'workplace_admin' | 'employee' | 'guest';
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
    role: 'super_admin' | 'admin' | 'hr_admin' | 'safety_admin' | 'workplace_admin' | 'employee' | 'guest';
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
     * Check if user is super admin
     */
    isSuperAdmin(): boolean;
    /**
     * Check if user is admin
     */
    isAdmin(): boolean;
    /**
     * Check if user is HR admin
     */
    isHRAdmin(): boolean;
    /**
     * Check if user is Safety admin
     */
    isSafetyAdmin(): boolean;
    /**
     * Check if user is Workplace admin
     */
    isWorkplaceAdmin(): boolean;
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
    /**
     * Static database method: Find user by ID
     */
    static findById(id: string): Promise<UserEntity | null>;
    /**
     * Static database method: Find user by email
     */
    static findByEmail(email: string): Promise<UserEntity | null>;
    /**
     * Static database method: Create user
     */
    static create(data: CreateUserInput): Promise<UserEntity>;
    /**
     * Static database method: Update user
     */
    static update(id: string, data: UpdateUserInput): Promise<UserEntity | null>;
    /**
     * Static database method: Find users by organization ID
     */
    static findByOrgId(orgId: string, limit?: number, offset?: number): Promise<UserEntity[]>;
    /**
     * Static database method: Get all emails for duplicate checking
     */
    static getAllEmails(): Promise<string[]>;
}
//# sourceMappingURL=User.d.ts.map