"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../utils/validators");
const entities_1 = require("../entities");
const server_1 = require("../websocket/server");
const pushNotificationService_1 = require("../services/pushNotificationService");
const organizationService_1 = require("../services/organizationService");
const userService_1 = require("../services/userService");
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
        // Get organization members for notification
        const org = await organizationService_1.organizationService.getOrganizationById(req.user.orgId);
        const { users: members } = await userService_1.userService.getOrganizationUsers(req.user.orgId, { page: 1, pageSize: 1000 });
        const memberIds = members.map((m) => m.id);
        // Send push notifications
        try {
            await pushNotificationService_1.pushNotificationService.sendAlertNotification(memberIds, title, message, severity);
            console.log(`Push notifications sent to ${memberIds.length} members for alert ${alert.id}`);
        }
        catch (pushError) {
            console.warn('Push notification failed:', pushError);
            // Don't fail the request if push notifications fail
        }
        // Broadcast via WebSocket
        try {
            const wsServer = (0, server_1.getWebSocketServer)();
            wsServer.broadcastAlertCreated(alert);
            wsServer.broadcastNotificationToOrganization(req.user.orgId, {
                type: 'alert',
                alertId: alert.id,
                title,
                message,
                severity,
            });
        }
        catch (wsError) {
            console.warn('WebSocket broadcast failed:', wsError);
            // Don't fail the request if WebSocket fails
        }
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
        const notifications = await entities_1.NotificationEntity.findByAlertId(id);
        const formattedNotifications = await Promise.all(notifications.map(async (n) => {
            const user = await userService_1.userService.getUserById(n.userId);
            return {
                id: n.id,
                userId: n.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                isRead: n.isRead,
                readAt: n.readAt,
                createdAt: n.createdAt,
            };
        }));
        return (0, response_1.sendSuccess)(res, formattedNotifications, 'Notifications retrieved successfully', 200);
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
        const notification = await entities_1.NotificationEntity.findById(nId);
        if (!notification) {
            return (0, response_1.sendError)(res, 'NOTIFICATION_NOT_FOUND', 'Notification not found', 404);
        }
        const updated = await entities_1.NotificationEntity.markAsRead(nId);
        return (0, response_1.sendSuccess)(res, updated, 'Notification marked as read', 200);
    }
    catch (error) {
        console.error('Mark notification error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to mark notification', 500);
    }
});
exports.default = router;
//# sourceMappingURL=alerts.js.map