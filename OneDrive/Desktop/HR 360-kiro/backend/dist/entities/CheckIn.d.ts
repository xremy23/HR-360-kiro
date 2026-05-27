export interface CheckIn {
    id: string;
    userId: string;
    teamId: string;
    status: 'safe' | 'need_help' | 'sos';
    notes?: string;
    latitude?: number;
    longitude?: number;
    timestamp: Date;
    incidentId?: string;
    isDrill: boolean;
}
export declare class CheckInEntity {
    static create(data: Omit<CheckIn, 'id' | 'timestamp'>): Promise<CheckIn>;
    static findById(id: string): Promise<CheckIn | null>;
    static findByUserId(userId: string, limit?: number, offset?: number): Promise<CheckIn[]>;
    static findByTeamId(teamId: string, incidentId?: string, isDrill?: boolean): Promise<CheckIn[]>;
    static findByIncidentId(incidentId: string): Promise<CheckIn[]>;
    static countByIncidentIdAndStatus(incidentId: string, status: string): Promise<number>;
    static getIncidentSummary(incidentId: string): Promise<any>;
}
//# sourceMappingURL=CheckIn.d.ts.map