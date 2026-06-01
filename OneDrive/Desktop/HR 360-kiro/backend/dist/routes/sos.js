"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const entities_1 = require("../entities");
const server_1 = require("../websocket/server");
const pushNotificationService_1 = require("../services/pushNotificationService");
const userService_1 = require("../services/userService");
const organizationService_1 = require("../services/organizationService");
const router = (0, express_1.Router)();
/**
 * POST /sos
 * Trigger SOS
 */
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { notes } = req.body;
        const sos = await entities_1.SOSEscalationEntity.create({
            userId: req.user.id,
            notes,
            status: 'pending',
        });
        // Get user details for notification
        const user = await userService_1.userService.getUserById(req.user.id);
        const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
        // Get organization members for notification
        const org = await organizationService_1.organizationService.getOrganizationById(req.user.orgId);
        const { users: members } = await userService_1.userService.getOrganizationUsers(req.user.orgId, { page: 1, pageSize: 1000 });
        const memberIds = members
            .filter((m) => m.id !== req.user?.id) // Don't notify the SOS initiator
            .map((m) => m.id);
        // Send push notifications
        try {
            await pushNotificationService_1.pushNotificationService.sendSOSNotification(memberIds, req.user.id, userName);
            console.log(`SOS push notifications sent to ${memberIds.length} members`);
        }
        catch (pushError) {
            console.warn('Push notification failed:', pushError);
            // Don't fail the request if push notifications fail
        }
        // Broadcast via WebSocket
        try {
            const wsServer = (0, server_1.getWebSocketServer)();
            wsServer.broadcastSOSCreated(sos);
            wsServer.broadcastNotificationToOrganization(req.user.orgId, {
                type: 'sos',
                sosId: sos.id,
                userId: req.user.id,
                userName,
                notes,
            });
        }
        catch (wsError) {
            console.warn('WebSocket broadcast failed:', wsError);
            // Don't fail the request if WebSocket fails
        }
        return (0, response_1.sendSuccess)(res, sos, 'SOS triggered successfully', 201);
    }
    catch (error) {
        console.error('Trigger SOS error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to trigger SOS', 500);
    }
});
/**
 * GET /sos/escalations
 * Get SOS escalations (Admin)
 */
router.get('/escalations', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { orgId } = req.query;
        if (!orgId) {
            return (0, response_1.sendError)(res, 'INVALID_ORG', 'Organization ID required', 400);
        }
        const escalations = await entities_1.SOSEscalationEntity.findByOrgId(orgId);
        const formattedEscalations = await Promise.all(escalations.map(async (s) => {
            const user = await userService_1.userService.getUserById(s.userId);
            return {
                id: s.id,
                userId: s.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                initiatedAt: s.initiatedAt,
                status: s.status,
                managerNotifiedAt: s.managerNotifiedAt,
            };
        }));
        return (0, response_1.sendSuccess)(res, formattedEscalations, 'SOS escalations retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get SOS escalations error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve SOS escalations', 500);
    }
});
exports.default = router;
//# sourceMappingURL=sos.js.map