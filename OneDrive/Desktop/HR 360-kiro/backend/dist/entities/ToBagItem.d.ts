export interface ToBagItem {
    id: string;
    userId: string;
    name: string;
    category: 'documents' | 'supplies' | 'electronics' | 'clothing' | 'other';
    quantity: number;
    isPacked: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ToBagItemEntity {
    static create(data: Omit<ToBagItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToBagItem>;
    static findById(id: string): Promise<ToBagItem | null>;
    static findByUserId(userId: string): Promise<ToBagItem[]>;
    static update(id: string, userId: string, data: Partial<ToBagItem>): Promise<ToBagItem | null>;
    static delete(id: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=ToBagItem.d.ts.map