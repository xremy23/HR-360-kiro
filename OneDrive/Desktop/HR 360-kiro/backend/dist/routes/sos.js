"use strict";
/**
 * SOS Routes
 * Handles SOS escalations and emergency contacts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const sosService_1 = require("../services/sosService");
const userService_1 = require("../services/userService");
const monitoringService_1 = require("../services/monitoringService");
const router = express_1.default.Router();
/**
 * POST /api/sos
 * Trigger SOS escalation
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
        const { latitude, longitude, message } = req.body;
        const sos = await sosService_1.sosService.createSOS({
            userId: req.user.userId,
            organizationId: user.organizationId,
            latitude,
            longitude,
            message,
        });
        monitoringService_1.logger.info('SOS escalation triggered', { sosId: sos.id, userId: req.user.userId });
        res.status(201).json({ success: true, data: sos });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to trigger SOS', { error, userId: req.user?.userId });
        next(error);
    }
});
/**
 * GET /api/sos
 * Get SOS escalations for organization
 */
router.get('/', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin', 'hr'), async (req, res, next) => {
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
        const { escalations, total } = await sosService_1.sosService.getSOSEscalations(user.organizationId, {
            page,
            pageSize,
            status,
        });
        res.json({
            success: true,
            data: escalations,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get SOS escalations', { error, userId: req.user?.userId });
        next(error);
    }
});
/**
 * GET /api/sos/:id
 * Get SOS escalation by ID
 */
router.get('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
    try {
        const { id } = req.params;
        const sos = await sosService_1.sosService.getSOSById(id);
        if (!sos) {
            return res.status(404).json({
                success: false,
                error: { code: 'SOS_NOT_FOUND', message: 'SOS escalation not found' },
            });
        }
        res.json({ success: true, data: sos });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get SOS escalation', { error, sosId: req.params.id });
        next(error);
    }
});
/**
 * PUT /api/sos/:id
 * Update SOS escalation status
 */
router.put('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin', 'hr'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_INPUT', message: 'Status is required' },
            });
        }
        const validStatuses = ['pending', 'acknowledged', 'resolved', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATUS', message: 'Invalid status' },
            });
        }
        const sos = await sosService_1.sosService.updateSOSStatus(id, status);
        if (!sos) {
            return res.status(404).json({
                success: false,
                error: { code: 'SOS_NOT_FOUND', message: 'SOS escalation not found' },
            });
        }
        monitoringService_1.logger.info('SOS escalation status updated', { sosId: id, status });
        res.json({ success: true, data: sos });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to update SOS escalation', { error, sosId: req.params.id });
        next(error);
    }
});
/**
 * GET /api/sos/contacts
 * Get escalation contacts for organization
 */
router.get('/contacts', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res, next) => {
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
        const { contacts, total } = await sosService_1.sosService.getEscalationContacts(user.organizationId, {
            page,
            pageSize,
        });
        res.json({
            success: true,
            data: contacts,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to get escalation contacts', { error, userId: req.user?.userId });
        next(error);
    }
});
/**
 * POST /api/sos/contacts
 * Create escalation contact (admin/hr only)
 */
router.post('/contacts', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin', 'hr'), async (req, res, next) => {
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
        const { name, phone, email, role, priority } = req.body;
        if (!name || !phone || !role || priority === undefined) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_INPUT', message: 'Missing required fields' },
            });
        }
        const contact = await sosService_1.sosService.createContact({
            organizationId: user.organizationId,
            name,
            phone,
            email,
            role,
            priority,
        });
        monitoringService_1.logger.info('Escalation contact created', { contactId: contact.id, createdBy: req.user.userId });
        res.status(201).json({ success: true, data: contact });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to create escalation contact', { error, userId: req.user?.userId });
        next(error);
    }
});
/**
 * PUT /api/sos/contacts/:id
 * Update escalation contact (admin/hr only)
 */
router.put('/contacts/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin', 'hr'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phone, email, role, priority, isActive } = req.body;
        const contact = await sosService_1.sosService.updateContact(id, {
            name,
            phone,
            email,
            role,
            priority,
            isActive,
        });
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: { code: 'CONTACT_NOT_FOUND', message: 'Contact not found' },
            });
        }
        monitoringService_1.logger.info('Escalation contact updated', { contactId: id, updatedBy: req.user?.userId });
        res.json({ success: true, data: contact });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to update escalation contact', { error, contactId: req.params.id });
        next(error);
    }
});
/**
 * DELETE /api/sos/contacts/:id
 * Delete escalation contact (admin only)
 */
router.delete('/contacts/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        await sosService_1.sosService.deleteContact(id);
        monitoringService_1.logger.info('Escalation contact deleted', { contactId: id, deletedBy: req.user?.userId });
        res.json({ success: true, message: 'Contact deleted successfully' });
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to delete escalation contact', { error, contactId: req.params.id });
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=sos.js.map