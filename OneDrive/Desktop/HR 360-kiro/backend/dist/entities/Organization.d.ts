/**
 * Organization Entity
 * Represents an organization in the system
 */
export interface Organization {
    id: string;
    name: string;
    emailDomain?: string;
    logoUrl?: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
export interface CreateOrganizationInput {
    name: string;
    emailDomain?: string;
    logoUrl?: string;
    description?: string;
    createdBy?: string;
}
export interface UpdateOrganizationInput {
    name?: string;
    emailDomain?: string;
    logoUrl?: string;
    description?: string;
    isActive?: boolean;
}
export declare class OrganizationEntity implements Organization {
    id: string;
    name: string;
    emailDomain?: string;
    logoUrl?: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    constructor(data: Organization);
    /**
     * Check if organization is active
     */
    isOrganizationActive(): boolean;
    /**
     * Check if email domain is configured
     */
    hasEmailDomain(): boolean;
    /**
     * Check if email matches organization domain
     */
    isEmailInDomain(email: string): boolean;
    /**
     * Convert to JSON
     */
    toJSON(): Organization;
    /**
     * Static database method: Find organization by ID
     */
    static findById(id: string): Promise<OrganizationEntity | null>;
    /**
     * Static database method: Find organization by invite code
     */
    static findByInviteCode(inviteCode: string): Promise<OrganizationEntity | null>;
    /**
     * Static database method: Create organization
     */
    static create(data: CreateOrganizationInput): Promise<OrganizationEntity>;
    /**
     * Static database method: Update organization
     */
    static update(id: string, data: UpdateOrganizationInput): Promise<OrganizationEntity | null>;
}
//# sourceMappingURL=Organization.d.ts.map