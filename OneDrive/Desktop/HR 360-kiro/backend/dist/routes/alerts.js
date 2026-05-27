"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../utils/validators");
const entities_1 = require("../entities");
const router = (0, express_1.Router)();
/**
 * GET /alerts
 * Get alerts
 */
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { orgId, isDrill, severity } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        if (!orgId) {
            return (0, response_1.sendError)(res, 'INVALID_ORG', 'Organization ID required', 400);
        }
        const alerts = await entities_1.AlertEntity.findByOrgId(orgId, isDrill === 'true', severity);
        const total = alerts.length;
        const paginated = alerts.slice(offset, offset + limit);
        return (0, response_1.sendPaginated)(res, paginated, total, limit, offset, 200);
    }
    catch (error) {
        console.error('Get alerts error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve alerts', 500);
    }
});
/**
 * POST /alerts/broadcast
 * Broadcast alert (Admin)
 */
router.post('/broadcast', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { title, message, severity, type, teamIds, isDrill } = req.body;
        if (!title || !message || !severity || !type) {
            return (0, response_1.sendError)(res, 'INVALID_INPUT', 'Missing required fields', 400);
        }
        if (!(0, validators_1.validateAlertSeverity)(severity)) {
            return (0, response_1.sendError)(res, 'INVALID_SEVERITY', 'Invalid severity level', 400);
        }
        const alert = await entities_1.AlertEntity.create({
            orgId: req.user.orgId,
            teamIds: teamIds || [],
            title,
            message,
            severity,
            type,
            createdBy: req.user.id,
            isDrill: isDrill || false,
        });
        return (0, response_1.sendSuccess)(res, alert, 'Alert broadcast successfully', 201);
    }
    catch (error) {
        console.error('Broadcast alert error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to broadcast alert', 500);
    }
});
/**
 * GET /alerts/:id/notifications
 * Get alert notifications
 */
router.get('/:id/notifications', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Note: Notification retrieval would require additional entity methods
        // For now, returning empty array as placeholder
        const notifications = [];
        return (0, response_1.sendSuccess)(res, notifications, 'Notifications retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve notifications', 500);
    }
});
/**
 * PUT /alerts/:id/notifications/:nId
 * Mark notification as read
 */
router.put('/:id/notifications/:nId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id, nId } = req.params;
        // Note: Notification update would require additional entity methods
        // For now, returning success as placeholder
        return (0, response_1.sendSuccess)(res, {}, 'Notification marked as read', 200);
    }
    catch (error) {
        console.error('Mark notification error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to mark notification', 500);
    }
});
exports.default = router;
//# sourceMappingURL=alerts.js.map