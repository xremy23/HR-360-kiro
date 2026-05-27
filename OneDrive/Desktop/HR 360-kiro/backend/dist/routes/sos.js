"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const entities_1 = require("../entities");
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
            const user = await entities_1.UserEntity.findById(s.userId);
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