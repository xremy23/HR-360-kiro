export interface SOSEscalation {
    id: string;
    userId: string;
    initiatedAt: Date;
    status: string;
    managerNotifiedAt?: Date;
    emergencyContactsNotifiedAt?: Date;
    teamNotifiedAt?: Date;
    resolvedAt?: Date;
    notes?: string;
}
export declare class SOSEscalationEntity {
    static create(data: Omit<SOSEscalation, 'id' | 'initiatedAt'>): Promise<SOSEscalation>;
    static findById(id: string): Promise<SOSEscalation | null>;
    static findByOrgId(orgId: string): Promise<SOSEscalation[]>;
    static update(id: string, data: Partial<SOSEscalation>): Promise<SOSEscalation | null>;
}
//# sourceMappingURL=SOSEscalation.d.ts.map