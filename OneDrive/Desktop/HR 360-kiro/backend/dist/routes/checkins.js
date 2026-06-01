"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../utils/validators");
const entities_1 = require("../entities");
const server_1 = require("../websocket/server");
const userService_1 = require("../services/userService");
const router = (0, express_1.Router)();
/**
 * PUT /check-ins/:id
 * Update check-in status
 */
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { id } = req.params;
        const { status, notes } = req.body;
        if (!(0, validators_1.validateCheckInStatus)(status)) {
            return (0, response_1.sendError)(res, 'INVALID_STATUS', 'Invalid check-in status', 400);
        }
        // Get existing check-in
        const existingCheckIn = await entities_1.CheckInEntity.findById(id);
        if (!existingCheckIn) {
            return (0, response_1.sendError)(res, 'NOT_FOUND', 'Check-in not found', 404);
        }
        // Verify user owns this check-in
        if (existingCheckIn.userId !== req.user.id) {
            return (0, response_1.sendError)(res, 'FORBIDDEN', 'Cannot update check-in from another user', 403);
        }
        // Update check-in
        const updatedCheckIn = await entities_1.CheckInEntity.update(id, {
            status,
            notes: notes || existingCheckIn.notes,
        });
        // Broadcast via WebSocket
        try {
            const wsServer = (0, server_1.getWebSocketServer)();
            wsServer.broadcastCheckInUpdated(updatedCheckIn);
        }
        catch (wsError) {
            console.warn('WebSocket broadcast failed:', wsError);
            // Don't fail the request if WebSocket fails
        }
        return (0, response_1.sendSuccess)(res, updatedCheckIn, 'Check-in updated successfully', 200);
    }
    catch (error) {
        console.error('Update check-in error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to update check-in', 500);
    }
});
/**
 * GET /check-ins/:id
 * Get check-in by ID
 */
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const checkIn = await entities_1.CheckInEntity.findById(id);
        if (!checkIn) {
            return (0, response_1.sendError)(res, 'NOT_FOUND', 'Check-in not found', 404);
        }
        return (0, response_1.sendSuccess)(res, checkIn, 'Check-in retrieved', 200);
    }
    catch (error) {
        console.error('Get check-in error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve check-in', 500);
    }
});
/**
 * POST /check-ins
 * Submit check-in
 */
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { status, notes, location, incidentId, isDrill } = req.body;
        if (!(0, validators_1.validateCheckInStatus)(status)) {
            return (0, response_1.sendError)(res, 'INVALID_STATUS', 'Invalid check-in status', 400);
        }
        if (location && !(0, validators_1.validateCoordinates)(location.latitude, location.longitude)) {
            return (0, response_1.sendError)(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
        }
        const checkIn = await entities_1.CheckInEntity.create({
            userId: req.user.id,
            teamId: req.user.teamId || '',
            status,
            notes,
            latitude: location?.latitude,
            longitude: location?.longitude,
            incidentId,
            isDrill: isDrill || false,
        });
        // Broadcast via WebSocket
        try {
            const wsServer = (0, server_1.getWebSocketServer)();
            wsServer.broadcastCheckInCreated(checkIn);
        }
        catch (wsError) {
            console.warn('WebSocket broadcast failed:', wsError);
            // Don't fail the request if WebSocket fails
        }
        return (0, response_1.sendSuccess)(res, checkIn, 'Check-in submitted successfully', 201);
    }
    catch (error) {
        console.error('Submit check-in error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to submit check-in', 500);
    }
});
/**
 * GET /check-ins/team/:teamId
 * Get team check-ins
 */
router.get('/team/:teamId', auth_1.authMiddleware, auth_1.managerMiddleware, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { incidentId, isDrill } = req.query;
        const checkIns = await entities_1.CheckInEntity.findByTeamId(teamId, incidentId, isDrill === 'true');
        const formattedCheckIns = await Promise.all(checkIns.map(async (c) => {
            const user = await userService_1.userService.getUserById(c.userId);
            return {
                userId: c.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                status: c.status,
                timestamp: c.timestamp,
                notes: c.notes,
            };
        }));
        return (0, response_1.sendSuccess)(res, formattedCheckIns, 'Team check-ins retrieved', 200);
    }
    catch (error) {
        console.error('Get team check-ins error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve team check-ins', 500);
    }
});
/**
 * GET /check-ins/history
 * Get user check-in history
 */
router.get('/history', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        const userCheckIns = await entities_1.CheckInEntity.findByUserId(req.user.id);
        const total = userCheckIns.length;
        const paginatedCheckIns = userCheckIns.slice(offset, offset + limit);
        return (0, response_1.sendPaginated)(res, paginatedCheckIns, total, limit, offset, 200);
    }
    catch (error) {
        console.error('Get check-in history error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve check-in history', 500);
    }
});
/**
 * GET /check-ins/incident/:incidentId
 * Get incident check-ins
 */
router.get('/incident/:incidentId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { incidentId } = req.params;
        const incidentCheckIns = await entities_1.CheckInEntity.findByIncidentId(incidentId);
        const formattedCheckIns = await Promise.all(incidentCheckIns.map(async (c) => {
            const user = await userService_1.userService.getUserById(c.userId);
            return {
                userId: c.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                teamId: c.teamId,
                status: c.status,
                timestamp: c.timestamp,
                notes: c.notes,
            };
        }));
        return (0, response_1.sendSuccess)(res, formattedCheckIns, 'Incident check-ins retrieved', 200);
    }
    catch (error) {
        console.error('Get incident check-ins error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve incident check-ins', 500);
    }
});
exports.default = router;
//# sourceMappingURL=checkins.js.map