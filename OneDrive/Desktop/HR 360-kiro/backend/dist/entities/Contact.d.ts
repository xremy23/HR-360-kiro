export interface Contact {
    id: string;
    userId: string;
    name: string;
    type: 'hotline' | 'personal' | 'location-based';
    phone: string;
    email?: string;
    category?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    isPinned: boolean;
    createdAt: Date;
}
export declare class ContactEntity {
    static create(data: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact>;
    static findById(id: string): Promise<Contact | null>;
    static findByUserId(userId: string): Promise<Contact[]>;
    static update(id: string, userId: string, data: Partial<Contact>): Promise<Contact | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static findNearby(latitude: number, longitude: number, radius?: number): Promise<Contact[]>;
}
//# sourceMappingURL=Contact.d.ts.map