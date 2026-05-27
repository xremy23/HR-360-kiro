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
export declare class AlertEntity {
    static create(data: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert>;
    static findById(id: string): Promise<Alert | null>;
    static findByOrgId(orgId: string, isDrill?: boolean, severity?: string, limit?: number, offset?: number): Promise<Alert[]>;
    static countByOrgId(orgId: string, isDrill?: boolean, severity?: string): Promise<number>;
}
//# sourceMappingURL=Alert.d.ts.map