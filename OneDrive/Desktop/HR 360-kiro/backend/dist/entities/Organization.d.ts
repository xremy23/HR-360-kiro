export interface Organization {
    id: string;
    name: string;
    emailDomain?: string;
    inviteCode?: string;
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class OrganizationEntity {
    static create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;
    static findById(id: string): Promise<Organization | null>;
    static findByInviteCode(inviteCode: string): Promise<Organization | null>;
    static update(id: string, data: Partial<Organization>): Promise<Organization | null>;
}
//# sourceMappingURL=Organization.d.ts.map