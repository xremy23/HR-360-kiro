"use strict";
/**
 * Check-in Routes
 * Handles employee check-ins during emergencies
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const checkInService_1 = require("../services/checkInService");
const userService_1 = require("../services/userService");
const monitoringService_1 = require("../services/monitoringService");
const router = express_1.default.Router();
/**
 * GET /api/check-ins
 * Get check-ins for organization
 */
router.get('/', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
            });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
            });
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const status = req.query.status;
        const incidentId = req.query.incidentId;
        const { checkIns, total } = await checkInService_1.checkInService.getCheckIns(user.organizationId, {
            page,
            pageSize,
            status,
            incidentId,
        });
        res.json({
            success: true,
            data: checkIns,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get check-ins', { error, userId: req.user?.userId });
        next(error);
    }
});
/**
 * GET /api/check-ins/:id
 * Get check-in by ID
 */
router.get('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        const { id } = req.params;
        const checkIn = await checkInService_1.checkInService.getCheckInById(id);
        if (!checkIn) {
            return res.status(404).json({
                success: false,
                error: { code: 'CHECK_IN_NOT_FOUND', message: 'Check-in not found' },
            });
        }
        res.json({ success: true, data: checkIn });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get check-in', { error, checkInId: req.params.id });
        next(error);
    }
});
/**
 * POST /api/check-ins
 * Create check-in
 */
router.post('/', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
            });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
            });
        }
        const { status, latitude, longitude, notes, incidentId } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_INPUT', message: 'Status is required' },
            });
        }
        const validStatuses = ['safe', 'injured', 'missing', 'unknown'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATUS', message: 'Invalid status' },
            });
        }
        const checkIn = await checkInService_1.checkInService.createCheckIn({
            userId: req.user.userId,
            organizationId: user.organizationId,
            teamId: user.teamId || '',
            status,
            latitude,
            longitude,
            notes,
            incidentId,
        });
        monitoringService_1.logger.info('Check-in created', { checkInId: checkIn.id, userId: req.user.userId });
        res.status(201).json({ success: true, data: checkIn });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to create check-in', { error, userId: req.user?.userId });
        next(error);
    }
});
/**
 * PUT /api/check-ins/:id
 * Update check-in
 */
router.put('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, latitude, longitude, notes } = req.body;
        if (status) {
            const validStatuses = ['safe', 'injured', 'missing', 'unknown'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_STATUS', message: 'Invalid status' },
                });
            }
        }
        const checkIn = await checkInService_1.checkInService.updateCheckIn(id, {
            status,
            latitude,
            longitude,
            notes,
        });
        if (!checkIn) {
            return res.status(404).json({
                success: false,
                error: { code: 'CHECK_IN_NOT_FOUND', message: 'Check-in not found' },
            });
        }
        monitoringService_1.logger.info('Check-in updated', { checkInId: id, updatedBy: req.user?.userId });
        res.json({ success: true, data: checkIn });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to update check-in', { error, checkInId: req.params.id });
        next(error);
    }
});
/**
 * DELETE /api/check-ins/:id
 * Delete check-in
 */
router.delete('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        await checkInService_1.checkInService.deleteCheckIn(id);
        monitoringService_1.logger.info('Check-in deleted', { checkInId: id, deletedBy: req.user?.userId });
        res.json({ success: true, message: 'Check-in deleted successfully' });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to delete check-in', { error, checkInId: req.params.id });
        next(error);
    }
});
/**
 * GET /api/check-ins/stats
 * Get check-in statistics
 */
router.get('/stats', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin', 'hr'), async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
            });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' },
            });
        }
        const incidentId = req.query.incidentId;
        const stats = await checkInService_1.checkInService.getCheckInStats(user.organizationId, incidentId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get check-in stats', { error, userId: req.user?.userId });
        next(error);
    }
});
/**
 * GET /api/check-ins/team/:teamId
 * Get check-ins for a team
 */
router.get('/team/:teamId', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const incidentId = req.query.incidentId;
        const checkIns = await checkInService_1.checkInService.getCheckIns('', {
            page: 1,
            pageSize: 50,
            incidentId,
        });
        // Enrich with user names
        const enrichedCheckIns = await Promise.all(checkIns.checkIns.map(async (checkIn) => {
            const user = await userService_1.userService.getUserById(checkIn.userId);
            return {
                userId: checkIn.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                status: checkIn.status,
                notes: checkIn.notes,
            };
        }));
        res.json({
            success: true,
            data: enrichedCheckIns,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get team check-ins', { error, teamId: req.params.teamId });
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to get team check-ins' },
        });
    }
});
/**
 * GET /api/check-ins/history
 * Get user check-in history
 */
router.get('/history', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' },
            });
        }
        const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 100);
        const page = parseInt(req.query.page) || 1;
        const checkIns = await checkInService_1.checkInService.getCheckInsByUser(req.user.userId, {
            page,
            pageSize,
        });
        res.json({
            success: true,
            data: checkIns.checkIns,
            pagination: {
                total: checkIns.total,
                page,
                pageSize,
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get check-in history', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to get check-in history' },
        });
    }
});
/**
 * GET /api/check-ins/incident/:incidentId
 * Get check-ins for an incident
 */
router.get('/incident/:incidentId', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        const { incidentId } = req.params;
        const checkIns = await checkInService_1.checkInService.getCheckInsByIncident(incidentId);
        res.json({
            success: true,
            data: checkIns,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get incident check-ins', { error, incidentId: req.params.incidentId });
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to get incident check-ins' },
        });
    }
});
exports.default = router;
//# sourceMappingURL=checkins.js.map