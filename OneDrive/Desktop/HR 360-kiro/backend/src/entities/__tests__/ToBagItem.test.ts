import { ToBagItemEntity, ToBagItem } from '../ToBagItem';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('ToBagItemEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new to-bag item successfully', async () => {
      const itemData = {
        userId: 'user-123',
        name: 'First Aid Kit',
        category: 'supplies' as const,
        quantity: 1,
        isPacked: false,
        notes: 'Check expiration dates',
      };

      const expectedItem: ToBagItem = {
        id: 'item-123',
        ...itemData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.create(itemData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tobag_items'),
        [
          itemData.userId,
          itemData.name,
          itemData.category,
          itemData.quantity,
          itemData.isPacked,
          itemData.notes,
        ]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should create an item without notes', async () => {
      const itemData = {
        userId: 'user-456',
        name: 'Flashlight',
        category: 'electronics' as const,
        quantity: 2,
        isPacked: true,
      };

      const expectedItem: ToBagItem = {
        id: 'item-456',
        ...itemData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.create(itemData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tobag_items'),
        [
          itemData.userId,
          itemData.name,
          itemData.category,
          itemData.quantity,
          itemData.isPacked,
          undefined, // notes
        ]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should handle database errors during creation', async () => {
      const itemData = {
        userId: 'user-123',
        name: 'Test Item',
        category: 'other' as const,
        quantity: 1,
        isPacked: false,
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ToBagItemEntity.create(itemData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find to-bag item by id successfully', async () => {
      const itemId = 'item-123';
      const expectedItem: ToBagItem = {
        id: itemId,
        userId: 'user-123',
        name: 'First Aid Kit',
        category: 'supplies',
        quantity: 1,
        isPacked: false,
        notes: 'Check expiration dates',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.findById(itemId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [itemId]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should return null when item not found', async () => {
      const itemId = 'nonexistent-item';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ToBagItemEntity.findById(itemId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [itemId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const itemId = 'item-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ToBagItemEntity.findById(itemId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should find all to-bag items for a user', async () => {
      const userId = 'user-123';
      const expectedItems: ToBagItem[] = [
        {
          id: 'item-1',
          userId,
          name: 'Passport',
          category: 'documents',
          quantity: 1,
          isPacked: true,
          createdAt: new Date('2026-05-27T10:00:00Z'),
          updatedAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'item-2',
          userId,
          name: 'Water Bottles',
          category: 'supplies',
          quantity: 3,
          isPacked: false,
          notes: 'Fill before leaving',
          createdAt: new Date('2026-05-27T09:00:00Z'),
          updatedAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedItems,
        rowCount: 2,
      } as any);

      const result = await ToBagItemEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM tobag_items WHERE user_id = $1 ORDER BY category, name'),
        [userId]
      );
      expect(result).toEqual(expectedItems);
    });

    it('should return empty array when user has no items', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ToBagItemEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM tobag_items WHERE user_id = $1'),
        [userId]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ToBagItemEntity.findByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update item name successfully', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';
      const updateData = { name: 'Updated First Aid Kit' };

      const expectedItem: ToBagItem = {
        id: itemId,
        userId,
        name: 'Updated First Aid Kit',
        category: 'supplies',
        quantity: 1,
        isPacked: false,
        notes: 'Check expiration dates',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.update(itemId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tobag_items SET name = $1, updated_at = CURRENT_TIMESTAMP'),
        ['Updated First Aid Kit', itemId, userId]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should update item quantity successfully', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';
      const updateData = { quantity: 5 };

      const expectedItem: ToBagItem = {
        id: itemId,
        userId,
        name: 'Water Bottles',
        category: 'supplies',
        quantity: 5,
        isPacked: false,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.update(itemId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tobag_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP'),
        [5, itemId, userId]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should update item packed status successfully', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';
      const updateData = { isPacked: true };

      const expectedItem: ToBagItem = {
        id: itemId,
        userId,
        name: 'First Aid Kit',
        category: 'supplies',
        quantity: 1,
        isPacked: true,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.update(itemId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tobag_items SET is_packed = $1, updated_at = CURRENT_TIMESTAMP'),
        [true, itemId, userId]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should update item notes successfully', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';
      const updateData = { notes: 'Updated notes' };

      const expectedItem: ToBagItem = {
        id: itemId,
        userId,
        name: 'First Aid Kit',
        category: 'supplies',
        quantity: 1,
        isPacked: false,
        notes: 'Updated notes',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.update(itemId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tobag_items SET notes = $1, updated_at = CURRENT_TIMESTAMP'),
        ['Updated notes', itemId, userId]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should update multiple fields successfully', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';
      const updateData = { 
        name: 'Updated Kit',
        quantity: 2,
        isPacked: true,
        notes: 'All updated'
      };

      const expectedItem: ToBagItem = {
        id: itemId,
        userId,
        name: 'Updated Kit',
        category: 'supplies',
        quantity: 2,
        isPacked: true,
        notes: 'All updated',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.update(itemId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tobag_items SET name = $1, quantity = $2, is_packed = $3, notes = $4, updated_at = CURRENT_TIMESTAMP'),
        ['Updated Kit', 2, true, 'All updated', itemId, userId]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should return existing item when no updates provided', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';
      const updateData = {};

      const expectedItem: ToBagItem = {
        id: itemId,
        userId,
        name: 'First Aid Kit',
        category: 'supplies',
        quantity: 1,
        isPacked: false,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      // Mock findById call
      mockQuery.mockResolvedValue({
        rows: [expectedItem],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.update(itemId, userId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [itemId]
      );
      expect(result).toEqual(expectedItem);
    });

    it('should return null when item not found for update', async () => {
      const itemId = 'nonexistent-item';
      const userId = 'user-123';
      const updateData = { name: 'Updated Name' };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ToBagItemEntity.update(itemId, userId, updateData);

      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';
      const updateData = { name: 'Updated Name' };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ToBagItemEntity.update(itemId, userId, updateData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('delete', () => {
    it('should delete item successfully', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      const result = await ToBagItemEntity.delete(itemId, userId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM tobag_items WHERE id = $1 AND user_id = $2',
        [itemId, userId]
      );
      expect(result).toBe(true);
    });

    it('should return false when item not found for deletion', async () => {
      const itemId = 'nonexistent-item';
      const userId = 'user-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await ToBagItemEntity.delete(itemId, userId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM tobag_items WHERE id = $1 AND user_id = $2',
        [itemId, userId]
      );
      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      const itemId = 'item-123';
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(ToBagItemEntity.delete(itemId, userId)).rejects.toThrow('Database connection failed');
    });
  });
});