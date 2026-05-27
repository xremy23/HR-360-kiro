/**
 * ToBag Route Tests
 * Tests for emergency bag item management endpoints
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import tobagRouter from '../tobag';
import { authMiddleware } from '../../middleware/auth';
import { ToBagItemEntity } from '../../entities';

// Mock dependencies
jest.mock('../../entities');
jest.mock('../../middleware/auth');

const mockedToBagItemEntity = ToBagItemEntity as jest.Mocked<typeof ToBagItemEntity>;
const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/tobag', tobagRouter);

describe('ToBag Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth middleware to add user to request
    mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
      req.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        orgId: 'org-123',
        teamId: 'team-123',
      };
      next();
    }) as any);
  });

  describe('GET /tobag', () => {
    const mockToBagItems = [
      {
        id: 'item-1',
        userId: 'user-123',
        name: 'Emergency Water',
        category: 'supplies' as const,
        quantity: 3,
        isPacked: true,
        notes: '1 gallon per person',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-2',
        userId: 'user-123',
        name: 'First Aid Kit',
        category: 'supplies' as const,
        quantity: 1,
        isPacked: false,
        notes: 'Check expiration dates',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-3',
        userId: 'user-123',
        name: 'Important Documents',
        category: 'documents' as const,
        quantity: 1,
        isPacked: true,
        notes: 'ID, insurance, bank info',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedToBagItemEntity.findByUserId.mockResolvedValue(mockToBagItems);
    });

    it('should get to-go bag items successfully', async () => {
      const response = await request(app)
        .get('/tobag')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('To-go bag items retrieved successfully');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].name).toBe('Emergency Water');
      expect(response.body.data[0].category).toBe('supplies');

      expect(mockedToBagItemEntity.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should handle empty to-go bag', async () => {
      mockedToBagItemEntity.findByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get('/tobag')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockedToBagItemEntity.findByUserId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/tobag')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve to-go bag items');
    });
  });

  describe('POST /tobag', () => {
    const mockToBagItem = {
      id: 'item-123',
      userId: 'user-123',
      name: 'Emergency Radio',
      category: 'electronics' as const,
      quantity: 1,
      isPacked: false,
      notes: 'Battery powered or hand crank',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockedToBagItemEntity.create.mockResolvedValue(mockToBagItem);
    });

    it('should create to-go bag item successfully', async () => {
      const itemData = {
        name: 'Emergency Radio',
        category: 'electronics',
        quantity: 1,
        isPacked: false,
        notes: 'Battery powered or hand crank',
      };

      const response = await request(app)
        .post('/tobag')
        .set('Authorization', 'Bearer valid-token')
        .send(itemData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('To-go bag item created successfully');
      expect(response.body.data.id).toBe(mockToBagItem.id);

      expect(mockedToBagItemEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Emergency Radio',
        category: 'electronics',
        quantity: 1,
        isPacked: false,
        notes: 'Battery powered or hand crank',
      });
    });

    it('should create item with minimal data', async () => {
      const itemData = {
        name: 'Flashlight',
        category: 'electronics',
      };

      const response = await request(app)
        .post('/tobag')
        .set('Authorization', 'Bearer valid-token')
        .send(itemData);

      expect(response.status).toBe(201);
      expect(mockedToBagItemEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Flashlight',
        category: 'electronics',
        quantity: 1,
        isPacked: false,
        notes: undefined,
      });
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        name: 'Test Item',
        // Missing category
      };

      const response = await request(app)
        .post('/tobag')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toBe('Name and category required');
    });

    it('should reject invalid category', async () => {
      const invalidData = {
        name: 'Test Item',
        category: 'invalid-category',
      };

      const response = await request(app)
        .post('/tobag')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CATEGORY');
      expect(response.body.error.message).toBe('Invalid category');
    });

    it('should accept all valid categories', async () => {
      const validCategories = ['documents', 'supplies', 'electronics', 'clothing', 'other'];
      
      for (const category of validCategories) {
        const itemData = {
          name: `Test ${category}`,
          category,
        };

        const response = await request(app)
          .post('/tobag')
          .set('Authorization', 'Bearer valid-token')
          .send(itemData);

        expect(response.status).toBe(201);
      }
    });

    it('should handle database errors', async () => {
      mockedToBagItemEntity.create.mockRejectedValue(new Error('Database error'));

      const itemData = {
        name: 'Test Item',
        category: 'supplies',
      };

      const response = await request(app)
        .post('/tobag')
        .set('Authorization', 'Bearer valid-token')
        .send(itemData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to create to-go bag item');
    });
  });

  describe('PUT /tobag/:id', () => {
    const mockItem = {
      id: 'item-123',
      userId: 'user-123',
      name: 'Emergency Water',
      category: 'supplies' as const,
      quantity: 2,
      isPacked: false,
      notes: 'Original notes',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedItem = {
      ...mockItem,
      name: 'Updated Water Supply',
      quantity: 3,
      isPacked: true,
    };

    beforeEach(() => {
      mockedToBagItemEntity.findById.mockResolvedValue(mockItem);
      mockedToBagItemEntity.update.mockResolvedValue(updatedItem);
    });

    it('should update to-go bag item successfully', async () => {
      const updateData = {
        name: 'Updated Water Supply',
        quantity: 3,
        isPacked: true,
      };

      const response = await request(app)
        .put('/tobag/item-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('To-go bag item updated successfully');
      expect(response.body.data.name).toBe('Updated Water Supply');

      expect(mockedToBagItemEntity.update).toHaveBeenCalledWith('item-123', 'user-123', {
        name: 'Updated Water Supply',
        quantity: 3,
        isPacked: true,
      });
    });

    it('should update item with partial data', async () => {
      const updateData = {
        isPacked: true,
      };

      const response = await request(app)
        .put('/tobag/item-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(mockedToBagItemEntity.update).toHaveBeenCalledWith('item-123', 'user-123', {
        name: 'Emergency Water',
        quantity: 2,
        isPacked: true,
      });
    });

    it('should handle item not found', async () => {
      mockedToBagItemEntity.findById.mockResolvedValue(null);

      const updateData = {
        name: 'Updated Item',
      };

      const response = await request(app)
        .put('/tobag/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ITEM_NOT_FOUND');
      expect(response.body.error.message).toBe('Item not found');
    });

    it('should handle unauthorized item access', async () => {
      const unauthorizedItem = {
        ...mockItem,
        userId: 'other-user-456',
      };
      mockedToBagItemEntity.findById.mockResolvedValue(unauthorizedItem);

      const updateData = {
        name: 'Updated Item',
      };

      const response = await request(app)
        .put('/tobag/item-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ITEM_NOT_FOUND');
      expect(response.body.error.message).toBe('Item not found');
    });

    it('should handle database errors', async () => {
      mockedToBagItemEntity.update.mockRejectedValue(new Error('Database error'));

      const updateData = {
        name: 'Updated Item',
      };

      const response = await request(app)
        .put('/tobag/item-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to update to-go bag item');
    });
  });

  describe('DELETE /tobag/:id', () => {
    const mockItem = {
      id: 'item-123',
      userId: 'user-123',
      name: 'Item to Delete',
      category: 'supplies' as const,
      quantity: 1,
      isPacked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockedToBagItemEntity.findById.mockResolvedValue(mockItem);
      mockedToBagItemEntity.delete.mockResolvedValue(true);
    });

    it('should delete to-go bag item successfully', async () => {
      const response = await request(app)
        .delete('/tobag/item-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('To-go bag item deleted successfully');
      expect(response.body.data).toEqual({});

      expect(mockedToBagItemEntity.delete).toHaveBeenCalledWith('item-123', 'user-123');
    });

    it('should handle item not found for deletion', async () => {
      mockedToBagItemEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/tobag/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ITEM_NOT_FOUND');
      expect(response.body.error.message).toBe('Item not found');
    });

    it('should handle unauthorized item deletion', async () => {
      const unauthorizedItem = {
        ...mockItem,
        userId: 'other-user-456',
      };
      mockedToBagItemEntity.findById.mockResolvedValue(unauthorizedItem);

      const response = await request(app)
        .delete('/tobag/item-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ITEM_NOT_FOUND');
      expect(response.body.error.message).toBe('Item not found');
    });

    it('should handle database errors during deletion', async () => {
      mockedToBagItemEntity.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/tobag/item-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to delete to-go bag item');
    });
  });
});

/**
 * Test Coverage Summary for ToBag Routes:
 * 
 * ✅ GET /tobag - Get user's to-go bag items
 * ✅ POST /tobag - Create new to-go bag item with category validation
 * ✅ PUT /tobag/:id - Update to-go bag item with ownership check
 * ✅ DELETE /tobag/:id - Delete to-go bag item with authorization
 * 
 * Coverage includes:
 * - CRUD operations for emergency bag items
 * - Category validation (documents, supplies, electronics, clothing, other)
 * - User ownership validation for all operations
 * - Quantity and packing status management
 * - Notes field for additional item information
 * - Database error handling and edge cases
 * - Authorization checks to prevent cross-user access
 */