"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../utils/validators");
const entities_1 = require("../entities");
const router = (0, express_1.Router)();
/**
 * GET /incidents
 * Get incidents
 */
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { orgId, isDrill } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        if (!orgId) {
            return (0, response_1.sendError)(res, 'INVALID_ORG', 'Organization ID required', 400);
        }
        const incidents = await entities_1.IncidentEntity.findByOrgId(orgId, isDrill === 'true');
        const total = incidents.length;
        const paginated = incidents.slice(offset, offset + limit);
        return (0, response_1.sendPaginated)(res, paginated, total, limit, offset, 200);
    }
    catch (error) {
        console.error('Get incidents error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve incidents', 500);
    }
});
/**
 * POST /incidents
 * Create incident (Admin)
 */
router.post('/', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { type, severity, isDrill } = req.body;
        if (!type || !severity) {
            return (0, response_1.sendError)(res, 'INVALID_INPUT', 'Type and severity required', 400);
        }
        if (!(0, validators_1.validateAlertSeverity)(severity)) {
            return (0, response_1.sendError)(res, 'INVALID_SEVERITY', 'Invalid severity level', 400);
        }
        const incident = await entities_1.IncidentEntity.create({
            orgId: req.user.orgId,
            type,
            severity,
            startTime: new Date(),
            isDrill: isDrill || false,
            createdBy: req.user.id,
        });
        return (0, response_1.sendSuccess)(res, incident, 'Incident created successfully', 201);
    }
    catch (error) {
        console.error('Create incident error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to create incident', 500);
    }
});
/**
 * GET /incidents/:id
 * Get incident details
 */
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const incident = await entities_1.IncidentEntity.findById(id);
        if (!incident) {
            return (0, response_1.sendError)(res, 'INCIDENT_NOT_FOUND', 'Incident not found', 404);
        }
        return (0, response_1.sendSuccess)(res, incident, 'Incident retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get incident error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve incident', 500);
    }
});
/**
 * GET /incidents/:id/summary
 * Get incident check-in summary
 */
router.get('/:id/summary', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const incident = await entities_1.IncidentEntity.findById(id);
        if (!incident) {
            return (0, response_1.sendError)(res, 'INCIDENT_NOT_FOUND', 'Incident not found', 404);
        }
        const checkIns = await entities_1.CheckInEntity.findByIncidentId(id);
        // Calculate summary from check-ins
        const summary = {
            totalMembers: 100, // TODO: Get actual total from organization
            checkedIn: checkIns.length,
            notCheckedIn: 100 - checkIns.length,
            safe: checkIns.filter((c) => c.status === 'safe').length,
            needHelp: checkIns.filter((c) => c.status === 'need_help').length,
            sos: checkIns.filter((c) => c.status === 'sos').length,
            responseRate: Math.round((checkIns.length / 100) * 100),
        };
        return (0, response_1.sendSuccess)(res, summary, 'Incident summary retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get incident summary error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve incident summary', 500);
    }
});
exports.default = router;
//# sourceMappingURL=incidents.js.map