"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const entities_1 = require("../entities");
const router = (0, express_1.Router)();
/**
 * GET /kb/guides
 * Get KB guides
 */
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { orgId, category, type } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        if (!orgId) {
            return (0, response_1.sendError)(res, 'INVALID_ORG', 'Organization ID required', 400);
        }
        const guides = await entities_1.KBGuideEntity.findByOrgId(orgId, category, type);
        const total = guides.length;
        const paginated = guides.slice(offset, offset + limit);
        return (0, response_1.sendPaginated)(res, paginated, total, limit, offset, 200);
    }
    catch (error) {
        console.error('Get guides error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve guides', 500);
    }
});
/**
 * GET /kb/guides/:id
 * Get guide details
 */
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const guide = await entities_1.KBGuideEntity.findById(id);
        if (!guide) {
            return (0, response_1.sendError)(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
        }
        return (0, response_1.sendSuccess)(res, guide, 'Guide retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get guide error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve guide', 500);
    }
});
/**
 * GET /kb/guides/:id/versions
 * Get guide version history
 */
router.get('/:id/versions', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const guide = await entities_1.KBGuideEntity.findById(id);
        if (!guide) {
            return (0, response_1.sendError)(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
        }
        // Note: Version history would require additional entity methods
        // For now, returning the current guide as a single version
        const versions = [guide];
        return (0, response_1.sendSuccess)(res, versions, 'Guide versions retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get guide versions error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve guide versions', 500);
    }
});
/**
 * POST /kb/guides
 * Create KB guide (Admin)
 */
router.post('/', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { title, category, type, content, mediaUrls, isRequired } = req.body;
        if (!title || !category || !type || !content) {
            return (0, response_1.sendError)(res, 'INVALID_INPUT', 'Missing required fields', 400);
        }
        const guide = await entities_1.KBGuideEntity.create({
            orgId: req.user.orgId,
            title,
            category,
            type,
            content,
            mediaUrls: mediaUrls || [],
            isRequired: isRequired || false,
            createdBy: req.user.id,
            updatedBy: req.user.id,
        });
        return (0, response_1.sendSuccess)(res, guide, 'Guide created successfully', 201);
    }
    catch (error) {
        console.error('Create guide error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to create guide', 500);
    }
});
/**
 * PUT /kb/guides/:id
 * Update KB guide (Admin)
 */
router.put('/:id', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { id } = req.params;
        const { title, content, isRequired } = req.body;
        const guide = await entities_1.KBGuideEntity.findById(id);
        if (!guide) {
            return (0, response_1.sendError)(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
        }
        const updated = await entities_1.KBGuideEntity.update(id, {
            title: title || guide.title,
            content: content || guide.content,
            isRequired: isRequired !== undefined ? isRequired : guide.isRequired,
        }, req.user.id);
        return (0, response_1.sendSuccess)(res, updated, 'Guide updated successfully', 200);
    }
    catch (error) {
        console.error('Update guide error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to update guide', 500);
    }
});
/**
 * DELETE /kb/guides/:id
 * Delete KB guide (Admin)
 */
router.delete('/:id', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await entities_1.KBGuideEntity.delete(id);
        if (!deleted) {
            return (0, response_1.sendError)(res, 'GUIDE_NOT_FOUND', 'Guide not found', 404);
        }
        return (0, response_1.sendSuccess)(res, {}, 'Guide deleted successfully', 200);
    }
    catch (error) {
        console.error('Delete guide error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to delete guide', 500);
    }
});
/**
 * POST /kb/guides/:id/acknowledge
 * Acknowledge guide
 */
router.post('/:id/acknowledge', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { id } = req.params;
        // Note: Guide acknowledgment would require additional entity methods
        // For now, returning success as placeholder
        return (0, response_1.sendSuccess)(res, {}, 'Guide acknowledged', 200);
    }
    catch (error) {
        console.error('Acknowledge guide error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to acknowledge guide', 500);
    }
});
exports.default = router;
//# sourceMappingURL=kb.js.map