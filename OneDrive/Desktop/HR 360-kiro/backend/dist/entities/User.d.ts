export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'hr' | 'manager' | 'employee';
    orgId: string;
    teamId?: string;
    departmentId?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    biometricEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserEntity {
    static create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
    static findById(id: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static findByOrgId(orgId: string, limit?: number, offset?: number): Promise<User[]>;
    static findByTeamId(teamId: string): Promise<User[]>;
    static update(id: string, data: Partial<User>): Promise<User | null>;
    static countByOrgId(orgId: string): Promise<number>;
}
//# sourceMappingURL=User.d.ts.map