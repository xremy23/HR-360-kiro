export interface KBGuide {
    id: string;
    orgId: string;
    title: string;
    category: 'general' | 'org-specific';
    type: string;
    content: string;
    mediaUrls?: string[];
    isRequired: boolean;
    isArchived: boolean;
    version: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
}
export declare class KBGuideEntity {
    static create(data: Omit<KBGuide, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<KBGuide>;
    static findById(id: string): Promise<KBGuide | null>;
    static findByOrgId(orgId: string, category?: string, type?: string, limit?: number, offset?: number): Promise<KBGuide[]>;
    static countByOrgId(orgId: string, category?: string, type?: string): Promise<number>;
    static update(id: string, data: Partial<KBGuide>, updatedBy: string): Promise<KBGuide | null>;
    static delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=KBGuide.d.ts.map