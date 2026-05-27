import { ContactEntity, Contact } from '../Contact';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('ContactEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new contact successfully', async () => {
      const contactData = {
        userId: 'user-123',
        name: 'Emergency Hotline',
        type: 'hotline' as const,
        phone: '+1-555-0123',
        email: 'emergency@company.com',
        category: 'Emergency',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        isPinned: true,
      };

      const expectedContact: Contact = {
        id: 'contact-123',
        ...contactData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.create(contactData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        [
          contactData.userId,
          contactData.name,
          contactData.type,
          contactData.phone,
          contactData.email,
          contactData.category,
          contactData.address,
          contactData.latitude,
          contactData.longitude,
          contactData.isPinned,
        ]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should create a contact with minimal required fields', async () => {
      const contactData = {
        userId: 'user-123',
        name: 'John Doe',
        type: 'personal' as const,
        phone: '+1-555-0123',
        isPinned: false,
      };

      const expectedContact: Contact = {
        id: 'contact-456',
        ...contactData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.create(contactData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        [
          contactData.userId,
          contactData.name,
          contactData.type,
          contactData.phone,
          undefined, // email
          undefined, // category
          undefined, // address
          undefined, // latitude
          undefined, // longitude
          contactData.isPinned,
        ]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should handle database errors during creation', async () => {
      const contactData = {
        userId: 'user-123',
        name: 'Test Contact',
        type: 'personal' as const,
        phone: '+1-555-0123',
        isPinned: false,
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ContactEntity.create(contactData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find contact by id successfully', async () => {
      const contactId = 'contact-123';
      const expectedContact: Contact = {
        id: contactId,
        userId: 'user-123',
        name: 'Emergency Hotline',
        type: 'hotline',
        phone: '+1-555-0123',
        email: 'emergency@company.com',
        category: 'Emergency',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        isPinned: true,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.findById(contactId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [contactId]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should return null when contact not found', async () => {
      const contactId = 'nonexistent-contact';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ContactEntity.findById(contactId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [contactId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const contactId = 'contact-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ContactEntity.findById(contactId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should find all contacts for a user', async () => {
      const userId = 'user-123';
      const expectedContacts: Contact[] = [
        {
          id: 'contact-1',
          userId,
          name: 'Emergency Hotline',
          type: 'hotline',
          phone: '+1-555-0123',
          isPinned: true,
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'contact-2',
          userId,
          name: 'John Doe',
          type: 'personal',
          phone: '+1-555-0456',
          isPinned: false,
          createdAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedContacts,
        rowCount: 2,
      } as any);

      const result = await ContactEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM contacts WHERE user_id = $1 ORDER BY is_pinned DESC'),
        [userId]
      );
      expect(result).toEqual(expectedContacts);
    });

    it('should return empty array when user has no contacts', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ContactEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM contacts WHERE user_id = $1'),
        [userId]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ContactEntity.findByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update contact name successfully', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';
      const updateData = { name: 'Updated Name' };

      const expectedContact: Contact = {
        id: contactId,
        userId,
        name: 'Updated Name',
        type: 'personal',
        phone: '+1-555-0123',
        isPinned: false,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.update(contactId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts SET name = $1'),
        ['Updated Name', contactId, userId]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should update contact phone successfully', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';
      const updateData = { phone: '+1-555-9999' };

      const expectedContact: Contact = {
        id: contactId,
        userId,
        name: 'Test Contact',
        type: 'personal',
        phone: '+1-555-9999',
        isPinned: false,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.update(contactId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts SET phone = $1'),
        ['+1-555-9999', contactId, userId]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should update contact pin status successfully', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';
      const updateData = { isPinned: true };

      const expectedContact: Contact = {
        id: contactId,
        userId,
        name: 'Test Contact',
        type: 'personal',
        phone: '+1-555-0123',
        isPinned: true,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.update(contactId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts SET is_pinned = $1'),
        [true, contactId, userId]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should update multiple fields successfully', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';
      const updateData = { 
        name: 'Updated Name',
        phone: '+1-555-9999',
        isPinned: true 
      };

      const expectedContact: Contact = {
        id: contactId,
        userId,
        name: 'Updated Name',
        type: 'personal',
        phone: '+1-555-9999',
        isPinned: true,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.update(contactId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts SET name = $1, phone = $2, is_pinned = $3'),
        ['Updated Name', '+1-555-9999', true, contactId, userId]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should return existing contact when no updates provided', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';
      const updateData = {};

      const expectedContact: Contact = {
        id: contactId,
        userId,
        name: 'Test Contact',
        type: 'personal',
        phone: '+1-555-0123',
        isPinned: false,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      // Mock findById call
      mockQuery.mockResolvedValue({
        rows: [expectedContact],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.update(contactId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [contactId]
      );
      expect(result).toEqual(expectedContact);
    });

    it('should return null when contact not found for update', async () => {
      const contactId = 'nonexistent-contact';
      const userId = 'user-123';
      const updateData = { name: 'Updated Name' };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ContactEntity.update(contactId, userId, updateData);

      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';
      const updateData = { name: 'Updated Name' };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ContactEntity.update(contactId, userId, updateData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('delete', () => {
    it('should delete contact successfully', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      const result = await ContactEntity.delete(contactId, userId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM contacts WHERE id = $1 AND user_id = $2',
        [contactId, userId]
      );
      expect(result).toBe(true);
    });

    it('should return false when contact not found for deletion', async () => {
      const contactId = 'nonexistent-contact';
      const userId = 'user-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ContactEntity.delete(contactId, userId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM contacts WHERE id = $1 AND user_id = $2',
        [contactId, userId]
      );
      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      const contactId = 'contact-123';
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ContactEntity.delete(contactId, userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findNearby', () => {
    it('should find nearby contacts within default radius', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const expectedContacts: Contact[] = [
        {
          id: 'contact-1',
          userId: 'user-123',
          name: 'Nearby Hospital',
          type: 'location-based',
          phone: '+1-555-0123',
          address: '456 Health St',
          latitude: 40.7130,
          longitude: -74.0058,
          isPinned: false,
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedContacts,
        rowCount: 1,
      } as any);

      const result = await ContactEntity.findNearby(latitude, longitude);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('6371 * acos'),
        [latitude, longitude, 5] // default radius
      );
      expect(result).toEqual(expectedContacts);
    });

    it('should find nearby contacts within custom radius', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const radius = 10;
      const expectedContacts: Contact[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedContacts,
        rowCount: 0,
      } as any);

      const result = await ContactEntity.findNearby(latitude, longitude, radius);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('6371 * acos'),
        [latitude, longitude, radius]
      );
      expect(result).toEqual(expectedContacts);
    });

    it('should handle database errors during findNearby', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ContactEntity.findNearby(latitude, longitude)).rejects.toThrow('Database connection failed');
    });
  });
});