export interface Incident {
    id: string;
    orgId: string;
    type: string;
    severity: 'advisory' | 'watch' | 'emergency';
    startTime: Date;
    endTime?: Date;
    isDrill: boolean;
    createdBy: string;
}
export declare class IncidentEntity {
    static create(data: Omit<Incident, 'id'>): Promise<Incident>;
    static findById(id: string): Promise<Incident | null>;
    static findByOrgId(orgId: string, isDrill?: boolean, limit?: number, offset?: number): Promise<Incident[]>;
    static countByOrgId(orgId: string, isDrill?: boolean): Promise<number>;
    static update(id: string, data: Partial<Incident>): Promise<Incident | null>;
}
//# sourceMappingURL=Incident.d.ts.map