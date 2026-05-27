"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const entities_1 = require("../entities");
const router = (0, express_1.Router)();
/**
 * GET /tobag
 * Get to-go bag items
 */
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const userItems = await entities_1.ToBagItemEntity.findByUserId(req.user.id);
        return (0, response_1.sendSuccess)(res, userItems, 'To-go bag items retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get tobag items error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve to-go bag items', 500);
    }
});
/**
 * POST /tobag
 * Create to-go bag item
 */
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { name, category, quantity, isPacked, notes } = req.body;
        if (!name || !category) {
            return (0, response_1.sendError)(res, 'INVALID_INPUT', 'Name and category required', 400);
        }
        const validCategories = ['documents', 'supplies', 'electronics', 'clothing', 'other'];
        if (!validCategories.includes(category)) {
            return (0, response_1.sendError)(res, 'INVALID_CATEGORY', 'Invalid category', 400);
        }
        const item = await entities_1.ToBagItemEntity.create({
            userId: req.user.id,
            name,
            category,
            quantity: quantity || 1,
            isPacked: isPacked || false,
            notes,
        });
        return (0, response_1.sendSuccess)(res, item, 'To-go bag item created successfully', 201);
    }
    catch (error) {
        console.error('Create tobag item error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to create to-go bag item', 500);
    }
});
/**
 * PUT /tobag/:id
 * Update to-go bag item
 */
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { id } = req.params;
        const { name, quantity, isPacked } = req.body;
        const item = await entities_1.ToBagItemEntity.findById(id);
        if (!item || item.userId !== req.user.id) {
            return (0, response_1.sendError)(res, 'ITEM_NOT_FOUND', 'Item not found', 404);
        }
        const updated = await entities_1.ToBagItemEntity.update(id, req.user.id, {
            name: name || item.name,
            quantity: quantity !== undefined ? quantity : item.quantity,
            isPacked: isPacked !== undefined ? isPacked : item.isPacked,
        });
        return (0, response_1.sendSuccess)(res, updated, 'To-go bag item updated successfully', 200);
    }
    catch (error) {
        console.error('Update tobag item error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to update to-go bag item', 500);
    }
});
/**
 * DELETE /tobag/:id
 * Delete to-go bag item
 */
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { id } = req.params;
        const item = await entities_1.ToBagItemEntity.findById(id);
        if (!item || item.userId !== req.user.id) {
            return (0, response_1.sendError)(res, 'ITEM_NOT_FOUND', 'Item not found', 404);
        }
        await entities_1.ToBagItemEntity.delete(id, req.user.id);
        return (0, response_1.sendSuccess)(res, {}, 'To-go bag item deleted successfully', 200);
    }
    catch (error) {
        console.error('Delete tobag item error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to delete to-go bag item', 500);
    }
});
exports.default = router;
//# sourceMappingURL=tobag.js.map