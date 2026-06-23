"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const authMiddleware_1 = require("../middleware/authMiddleware");
const organizationService_1 = require("../services/organizationService");
const userService_1 = require("../services/userService");
const monitoringService_1 = require("../services/monitoringService");
const router = express_1.default.Router();
// TEST ENDPOINT
router.post('/test-org-response', (req, res) => {
    monitoringService_1.logger.info('TEST ENDPOINT CALLED');
    res.status(200).json({
        success: true,
        data: {
            id: 'test-id',
            name: 'Test Org',
            inviteCode: 'ABC12345'
        }
    });
});
router.post('/', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        monitoringService_1.logger.info('🔵 POST /org - START', { userId: req.user?.userId });
        if (!req.user) {
            monitoringService_1.logger.error('🔴 No user in request');
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        monitoringService_1.logger.info('🔵 Getting user by ID', { userId: req.user.userId });
        const user = await userService_1.userService.getUserById(req.user.userId);
        monitoringService_1.logger.info('🔵 User retrieved', { user: user ? `Found (orgId: ${user.organizationId})` : 'Not found' });
        if (!user || user.organizationId) {
            monitoringService_1.logger.error('🔴 User check failed', { userExists: !!user, hasOrgId: user?.organizationId ? true : false });
            return res.status(400).json({ success: false, error: { code: 'ALREADY_IN_ORG', message: 'User is already part of an organization' } });
        }
        const { name, emailDomain, logoUrl, description } = req.body;
        monitoringService_1.logger.info('🔵 Request body', { name, emailDomain, logoUrl });
        if (!name || typeof name !== 'string') {
            monitoringService_1.logger.error('🔴 Invalid org name', { name });
            return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Organization name is required' } });
        }
        monitoringService_1.logger.info('🔵 Checking if org exists', { name });
        const existingOrg = await organizationService_1.organizationService.getOrganizationByName(name);
        if (existingOrg) {
            monitoringService_1.logger.error('🔴 Organization already exists', { name });
            return res.status(400).json({ success: false, error: { code: 'ORG_EXISTS', message: 'Organization with this name already exists' } });
        }
        monitoringService_1.logger.info('🔵 Creating organization', { name, createdBy: req.user?.userId });
        const organization = await organizationService_1.organizationService.createOrganization({
            name,
            emailDomain,
            logoUrl,
            description,
            createdBy: req.user.userId,
        });
        monitoringService_1.logger.info('🔵 Organization created', { orgId: organization.id });
        const inviteCode = (0, uuid_1.v4)().substring(0, 8).toUpperCase();
        monitoringService_1.logger.info('🔵 Generated invite code', { inviteCode });
        monitoringService_1.logger.info('🔵 Updating user with organization', { userId: req.user?.userId, orgId: organization.id });
        await userService_1.userService.updateUser(req.user.userId, {
            organizationId: organization.id,
        });
        monitoringService_1.logger.info('🔵 User updated');
        monitoringService_1.logger.info('✅ Organization created successfully', { orgId: organization.id, createdBy: req.user.userId });
        const response = {
            success: true,
            data: {
                ...organization,
                inviteCode,
            },
        };
        monitoringService_1.logger.info('🔵 Sending response', { response });
        res.status(201).json(response);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        monitoringService_1.logger.error('🔴 Create organization error', { error: errorMsg, stack: errorStack, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'ORG_CREATE_FAILED',
                message: 'Failed to create organization',
                details: errorMsg,
            },
        });
    }
});
router.get('/', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
        }
        const organization = await organizationService_1.organizationService.getOrganizationById(user.organizationId);
        if (!organization) {
            return res.status(404).json({ success: false, error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' } });
        }
        res.json({
            success: true,
            data: { ...organization, inviteCode: null },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get organization error', { error, userId: req.user?.userId });
        res.status(500).json({ success: false, error: { code: 'ORG_FETCH_FAILED', message: 'Failed to fetch organization' } });
    }
});
router.put('/', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
        }
        const { name, emailDomain, logoUrl, description } = req.body;
        const updatedOrg = await organizationService_1.organizationService.updateOrganization(user.organizationId, { name, emailDomain, logoUrl, description });
        monitoringService_1.logger.info('Organization updated', { orgId: user.organizationId, updatedBy: req.user.userId });
        res.json({ success: true, data: updatedOrg });
    }
    catch (error) {
        monitoringService_1.logger.error('Update organization error', { error, userId: req.user?.userId });
        res.status(500).json({ success: false, error: { code: 'ORG_UPDATE_FAILED', message: 'Failed to update organization' } });
    }
});
router.get('/stats', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
        }
        const [userCount, teamCount, departmentCount] = await Promise.all([
            organizationService_1.organizationService.getOrganizationUserCount(user.organizationId),
            organizationService_1.organizationService.getOrganizationTeamCount(user.organizationId),
            organizationService_1.organizationService.getOrganizationDepartmentCount(user.organizationId),
        ]);
        res.json({ success: true, data: { userCount, teamCount, departmentCount } });
    }
    catch (error) {
        monitoringService_1.logger.error('Get organization stats error', { error, userId: req.user?.userId });
        res.status(500).json({ success: false, error: { code: 'STATS_FETCH_FAILED', message: 'Failed to fetch organization statistics' } });
    }
});
router.get('/teams', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
        }
        const { users } = await userService_1.userService.getOrganizationUsers(user.organizationId, {});
        const teamsMap = new Map();
        users.forEach(u => {
            if (u.teamId) {
                if (!teamsMap.has(u.teamId)) {
                    teamsMap.set(u.teamId, { id: u.teamId, memberCount: 0 });
                }
                const team = teamsMap.get(u.teamId);
                team.memberCount += 1;
            }
        });
        const teams = Array.from(teamsMap.values());
        res.json({ success: true, data: teams });
    }
    catch (error) {
        monitoringService_1.logger.error('Get organization teams error', { error, userId: req.user?.userId });
        res.status(500).json({ success: false, error: { code: 'TEAMS_FETCH_FAILED', message: 'Failed to fetch organization teams' } });
    }
});
router.get('/users', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
        }
        const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 100);
        const page = parseInt(req.query.page) || 1;
        const role = req.query.role;
        const search = req.query.search;
        const { users, total } = await userService_1.userService.getOrganizationUsers(user.organizationId, { page, pageSize, role, search });
        res.json({ success: true, data: users, pagination: { total, pageSize, page } });
    }
    catch (error) {
        monitoringService_1.logger.error('Get organization users error', { error, userId: req.user?.userId });
        res.status(500).json({ success: false, error: { code: 'USERS_FETCH_FAILED', message: 'Failed to fetch organization users' } });
    }
});
router.post('/join', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        const { inviteCode } = req.body;
        if (!inviteCode || typeof inviteCode !== 'string') {
            return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invite code is required' } });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (user?.organizationId) {
            return res.status(400).json({ success: false, error: { code: 'ALREADY_IN_ORG', message: 'You are already part of an organization' } });
        }
        const { OrganizationEntity } = await Promise.resolve().then(() => __importStar(require('../entities/Organization')));
        const organization = await OrganizationEntity.findByInviteCode(inviteCode);
        if (!organization) {
            return res.status(404).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired invite code' } });
        }
        if (organization.emailDomain) {
            const emailDomainSuffix = `@${organization.emailDomain}`;
            if (!user?.email.endsWith(emailDomainSuffix)) {
                return res.status(403).json({ success: false, error: { code: 'DOMAIN_RESTRICTION', message: 'Your email domain is not authorized for this organization' } });
            }
        }
        await userService_1.userService.updateUser(req.user.userId, { organizationId: organization.id });
        res.json({ success: true, data: { organizationId: organization.id } });
    }
    catch (error) {
        monitoringService_1.logger.error('Join organization error', { error, userId: req.user?.userId });
        res.status(500).json({ success: false, error: { code: 'JOIN_ORG_FAILED', message: 'Failed to join organization' } });
    }
});
router.delete('/users/:userId', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated' } });
        }
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User is not part of an organization' } });
        }
        const { userId } = req.params;
        if (userId === req.user.userId) {
            return res.status(400).json({ success: false, error: { code: 'CANNOT_REMOVE_SELF', message: 'Cannot remove yourself from the organization' } });
        }
        const userToRemove = await userService_1.userService.getUserById(userId);
        if (!userToRemove) {
            monitoringService_1.logger.warn('User not found for deletion', { providedId: req.params.userId, adminId: req.user.userId });
            return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found in organization' } });
        }
        if (userToRemove.organizationId !== user.organizationId) {
            monitoringService_1.logger.warn('User removal attempted across organizations', { removedUserId: userId, removedUserOrgId: userToRemove.organizationId, adminOrgId: user.organizationId, adminId: req.user.userId });
            return res.status(403).json({ success: false, error: { code: 'NOT_IN_SAME_ORG', message: 'User does not belong to your organization' } });
        }
        await userService_1.userService.updateUser(userId, { organizationId: '' });
        monitoringService_1.logger.info('User removed from organization', { removedUserId: userId, removedUserEmail: userToRemove.email, orgId: user.organizationId, removedBy: req.user.userId, removedByEmail: user.email });
        res.json({ success: true, message: 'User removed from organization successfully', data: { removedUserId: userId, organizationId: user.organizationId } });
    }
    catch (error) {
        monitoringService_1.logger.error('Remove user from organization error', { error, userId: req.params.userId, adminId: req.user?.userId });
        next(error);
    }
});
router.get('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const organization = await organizationService_1.organizationService.getOrganizationById(id);
        if (!organization) {
            return res.status(404).json({ success: false, error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' } });
        }
        res.json({ success: true, data: organization });
    }
    catch (error) {
        monitoringService_1.logger.error('Get organization by ID error', { error, userId: req.user?.userId });
        res.status(500).json({ success: false, error: { code: 'ORG_FETCH_FAILED', message: 'Failed to fetch organization' } });
    }
});
exports.default = router;
//# sourceMappingURL=organization.js.map