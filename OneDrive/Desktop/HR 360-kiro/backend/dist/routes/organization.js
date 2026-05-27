"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const entities_1 = require("../entities");
const router = (0, express_1.Router)();
/**
 * GET /org
 * Get organization
 */
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const org = await entities_1.OrganizationEntity.findById(req.user.orgId);
        if (!org) {
            return (0, response_1.sendError)(res, 'ORG_NOT_FOUND', 'Organization not found', 404);
        }
        return (0, response_1.sendSuccess)(res, org, 'Organization retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get organization error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve organization', 500);
    }
});
/**
 * GET /org/teams
 * Get organization teams
 */
router.get('/teams', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const orgTeams = await entities_1.UserEntity.findByOrgId(req.user.orgId);
        // Group users by team
        const teamMap = new Map();
        orgTeams.forEach((user) => {
            if (user.teamId) {
                if (!teamMap.has(user.teamId)) {
                    teamMap.set(user.teamId, []);
                }
                teamMap.get(user.teamId).push(user);
            }
        });
        const teams = Array.from(teamMap.entries()).map(([teamId, members]) => ({
            id: teamId,
            memberCount: members.length,
        }));
        return (0, response_1.sendSuccess)(res, teams, 'Teams retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get teams error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve teams', 500);
    }
});
/**
 * GET /org/users
 * Get organization users (Admin)
 */
router.get('/users', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { teamId, role } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        let users = await entities_1.UserEntity.findByOrgId(req.user.orgId);
        if (teamId) {
            users = users.filter((u) => u.teamId === teamId);
        }
        if (role) {
            users = users.filter((u) => u.role === role);
        }
        const total = users.length;
        const paginated = users.slice(offset, offset + limit);
        return (0, response_1.sendPaginated)(res, paginated, total, limit, offset, 200);
    }
    catch (error) {
        console.error('Get organization users error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve organization users', 500);
    }
});
exports.default = router;
//# sourceMappingURL=organization.js.map