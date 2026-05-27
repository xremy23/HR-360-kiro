import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ToBagItemEntity } from '../entities';

const router = Router();

/**
 * GET /tobag
 * Get to-go bag items
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const userItems = await ToBagItemEntity.findByUserId(req.user.id);

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
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const item = await ToBagItemEntity.create({
      userId: req.user.id,
      name,
      category,
      quantity: quantity || 1,
      isPacked: isPacked || false,
      notes,
    });

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
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;
    const { name, quantity, isPacked } = req.body;

    const item = await ToBagItemEntity.findById(id);

    if (!item || item.userId !== req.user.id) {
      return sendError(res, 'ITEM_NOT_FOUND', 'Item not found', 404);
    }

    const updated = await ToBagItemEntity.update(id, req.user.id, {
      name: name || item.name,
      quantity: quantity !== undefined ? quantity : item.quantity,
      isPacked: isPacked !== undefined ? isPacked : item.isPacked,
    });

    return sendSuccess(res, updated, 'To-go bag item updated successfully', 200);
  } catch (error) {
    console.error('Update tobag item error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update to-go bag item', 500);
  }
});

/**
 * DELETE /tobag/:id
 * Delete to-go bag item
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { id } = req.params;

    const item = await ToBagItemEntity.findById(id);

    if (!item || item.userId !== req.user.id) {
      return sendError(res, 'ITEM_NOT_FOUND', 'Item not found', 404);
    }

    await ToBagItemEntity.delete(id, req.user.id);

    return sendSuccess(res, {}, 'To-go bag item deleted successfully', 200);
  } catch (error) {
    console.error('Delete tobag item error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to delete to-go bag item', 500);
  }
});

export default router;
