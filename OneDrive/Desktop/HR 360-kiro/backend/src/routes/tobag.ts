import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Mock database
const tobagItems: any[] = [];

/**
 * GET /tobag
 * Get to-go bag items
 */
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // TODO: Fetch from database
    const userItems = tobagItems.filter((item) => item.userId === req.user!.id);

    return sendSuccess(res, userItems, 'To-go bag items retrieved successfully', 200);
  } catch (error) {
    console.error('Get tobag items error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve to-go bag items', 500);
  }
});

/**
 * POST /tobag
 * Create to-go bag item
 */
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { name, category, quantity, isPacked, notes } = req.body;

    if (!name || !category) {
      return sendError(res, 'INVALID_INPUT', 'Name and category required', 400);
    }

    const validCategories = ['documents', 'supplies', 'electronics', 'clothing', 'other'];
    if (!validCategories.includes(category)) {
      return sendError(res, 'INVALID_CATEGORY', 'Invalid category', 400);
    }

    const item = {
      id: uuidv4(),
      userId: req.user.id,
      name,
      category,
      quantity: quantity || 1,
      isPacked: isPacked || false,
      notes,
      createdAt: new Date(),
    };

    tobagItems.push(item);

    // TODO: Save to database

    return sendSuccess(res, item, 'To-go bag item created successfully', 201);
  } catch (error) {
    console.error('Create tobag item error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to create to-go bag item', 500);
  }
});

/**
 * PUT /tobag/:id
 * Update to-go bag item
 */
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { name, quantity, isPacked } = req.body;

    // TODO: Fetch from database
    const item = tobagItems.find((i) => i.id === id && i.userId === req.user!.id);

    if (!item) {
      return sendError(res, 'ITEM_NOT_FOUND', 'Item not found', 404);
    }

    item.name = name || item.name;
    item.quantity = quantity !== undefined ? quantity : item.quantity;
    item.isPacked = isPacked !== undefined ? isPacked : item.isPacked;
    item.updatedAt = new Date();

    // TODO: Save to database

    return sendSuccess(res, item, 'To-go bag item updated successfully', 200);
  } catch (error) {
    console.error('Update tobag item error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update to-go bag item', 500);
  }
});

/**
 * DELETE /tobag/:id
 * Delete to-go bag item
 */
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;

    // TODO: Delete from database
    const index = tobagItems.findIndex((i) => i.id === id && i.userId === req.user!.id);

    if (index === -1) {
      return sendError(res, 'ITEM_NOT_FOUND', 'Item not found', 404);
    }

    tobagItems.splice(index, 1);

    return sendSuccess(res, {}, 'To-go bag item deleted successfully', 200);
  } catch (error) {
    console.error('Delete tobag item error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to delete to-go bag item', 500);
  }
});

export default router;
