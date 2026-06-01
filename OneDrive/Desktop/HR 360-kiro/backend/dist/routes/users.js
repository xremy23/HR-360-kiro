"use strict";
/**
 * User Routes
 * Handles user profile and management endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const userService_1 = require("../services/userService");
const monitoringService_1 = require("../services/monitoringService");
const router = express_1.default.Router();
/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'User not authenticated',
                },
            });
        }
        const userProfile = await userService_1.userService.getUserProfile(req.user.userId);
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User profile not found',
                },
            });
        }
        res.json({
            success: true,
            data: userProfile,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get user profile error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'PROFILE_FETCH_FAILED',
                message: 'Failed to fetch user profile',
            },
        });
    }
});
/**
 * PUT /api/users/profile
 * Update current user profile
 */
router.put('/profile', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'User not authenticated',
                },
            });
        }
        const { firstName, lastName, phone, avatarUrl, position, address, personalEmergencyContact } = req.body;
        // Validate input
        if (firstName && typeof firstName !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'firstName must be a string',
                },
            });
        }
        const updatedUser = await userService_1.userService.updateUser(req.user.userId, {
            firstName,
            lastName,
            phone,
            avatarUrl,
            position,
            address,
            personalEmergencyContact,
        });
        monitoringService_1.logger.info('User profile updated', { userId: req.user.userId });
        res.json({
            success: true,
            data: updatedUser,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Update user profile error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'PROFILE_UPDATE_FAILED',
                message: 'Failed to update user profile',
            },
        });
    }
});
/**
 * GET /api/users/:id
 * Get user by ID (admin only)
 */
router.get('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin', 'hr'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService_1.userService.getUserById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get user by ID error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'USER_FETCH_FAILED',
                message: 'Failed to fetch user',
            },
        });
    }
});
/**
 * GET /api/users
 * Get organization users (paginated)
 */
router.get('/', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'User not authenticated',
                },
            });
        }
        // Get user to find their organization
        const user = await userService_1.userService.getUserById(req.user.userId);
        if (!user || !user.organizationId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_ORGANIZATION',
                    message: 'User is not part of an organization',
                },
            });
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const search = req.query.search;
        const role = req.query.role;
        const { users, total } = await userService_1.userService.getOrganizationUsers(user.organizationId, {
            page,
            pageSize,
            search,
            role,
        });
        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get organization users error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'USERS_FETCH_FAILED',
                message: 'Failed to fetch users',
            },
        });
    }
});
/**
 * PUT /api/users/:id
 * Update user (admin/hr only)
 */
router.put('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin', 'hr'), async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, phone, position, departmentId, teamId, address, personalEmergencyContact, isActive } = req.body;
        const updatedUser = await userService_1.userService.updateUser(id, {
            firstName,
            lastName,
            phone,
            position,
            departmentId,
            teamId,
            address,
            personalEmergencyContact,
            isActive,
        });
        monitoringService_1.logger.info('User updated by admin', { updatedUserId: id, adminId: req.user?.userId });
        res.json({
            success: true,
            data: updatedUser,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Update user error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'USER_UPDATE_FAILED',
                message: 'Failed to update user',
            },
        });
    }
});
/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), authMiddleware_1.authMiddleware.requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent self-deletion
        if (id === req.user?.userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'CANNOT_DELETE_SELF',
                    message: 'Cannot delete your own account',
                },
            });
        }
        await userService_1.userService.deleteUser(id);
        monitoringService_1.logger.info('User deleted', { deletedUserId: id, adminId: req.user?.userId });
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Delete user error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'USER_DELETE_FAILED',
                message: 'Failed to delete user',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map