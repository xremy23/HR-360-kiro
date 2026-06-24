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
const biometricService_1 = __importDefault(require("../services/biometricService"));
const storageService_1 = require("../services/storageService");
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
// ============================================================================
// BIOMETRIC AUTHENTICATION ENDPOINTS
// ============================================================================
/**
 * POST /api/users/biometric/enable
 * Enable biometric authentication
 */
router.post('/biometric/enable', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
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
        const { biometricType } = req.body;
        // Validate biometric type
        if (!biometricType || !['fingerprint', 'faceId', 'both'].includes(biometricType)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'biometricType must be fingerprint, faceId, or both',
                },
            });
        }
        const result = await biometricService_1.default.enableBiometric(req.user.userId, biometricType);
        monitoringService_1.logger.info('Biometric authentication enabled', { userId: req.user.userId, type: biometricType });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Enable biometric error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'BIOMETRIC_ENABLE_FAILED',
                message: 'Failed to enable biometric authentication',
            },
        });
    }
});
/**
 * POST /api/users/biometric/disable
 * Disable biometric authentication
 */
router.post('/biometric/disable', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
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
        const result = await biometricService_1.default.disableBiometric(req.user.userId);
        monitoringService_1.logger.info('Biometric authentication disabled', { userId: req.user.userId });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Disable biometric error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'BIOMETRIC_DISABLE_FAILED',
                message: 'Failed to disable biometric authentication',
            },
        });
    }
});
/**
 * GET /api/users/biometric/status
 * Get biometric authentication status
 */
router.get('/biometric/status', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
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
        const status = await biometricService_1.default.isBiometricEnabled(req.user.userId);
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get biometric status error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'BIOMETRIC_STATUS_FAILED',
                message: 'Failed to get biometric status',
            },
        });
    }
});
/**
 * GET /api/users/biometric/devices
 * Get user's enrolled biometric devices
 */
router.get('/biometric/devices', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
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
        const devices = await biometricService_1.default.getUserDevices(req.user.userId);
        res.json({
            success: true,
            data: devices,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get biometric devices error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'BIOMETRIC_DEVICES_FAILED',
                message: 'Failed to get biometric devices',
            },
        });
    }
});
/**
 * DELETE /api/users/biometric/devices/:deviceId
 * Remove biometric device
 */
router.delete('/biometric/devices/:deviceId', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
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
        const { deviceId } = req.params;
        // Verify device belongs to user
        const device = await biometricService_1.default.getDevice(deviceId);
        if (!device || device.userId !== req.user.userId) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'DEVICE_NOT_FOUND',
                    message: 'Biometric device not found',
                },
            });
        }
        await biometricService_1.default.deleteDevice(deviceId);
        monitoringService_1.logger.info('Biometric device deleted', { userId: req.user.userId, deviceId });
        res.json({
            success: true,
            message: 'Biometric device deleted successfully',
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Delete biometric device error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'BIOMETRIC_DELETE_FAILED',
                message: 'Failed to delete biometric device',
            },
        });
    }
});
/**
 * POST /api/users/avatar
 * Upload user avatar
 */
router.post('/avatar', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
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
        // Get file from request body (base64 encoded)
        const { imageData, fileName } = req.body;
        if (!imageData) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'imageData is required',
                },
            });
        }
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(imageData, 'base64');
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (fileBuffer.length > maxSize) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: 'File size cannot exceed 5MB',
                },
            });
        }
        // Upload to storage service
        const avatarUrl = await storageService_1.storageService.uploadAvatar(req.user.userId, fileBuffer, 'image/jpeg');
        // Update user profile with new avatar URL
        const updatedUser = await userService_1.userService.updateUser(req.user.userId, {
            avatarUrl,
        });
        monitoringService_1.logger.info('User avatar uploaded', { userId: req.user.userId, avatarUrl });
        res.json({
            success: true,
            data: {
                avatarUrl,
                user: updatedUser,
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Avatar upload error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'AVATAR_UPLOAD_FAILED',
                message: 'Failed to upload avatar',
            },
        });
    }
});
/**
 * POST /api/users/avatar/signed-url
 * Get signed URL for avatar (for frontend access)
 */
router.post('/avatar/signed-url', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
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
        const { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'fileName is required',
                },
            });
        }
        // Get signed URL (valid for 24 hours)
        const signedUrl = await storageService_1.storageService.getSignedUrl(fileName, {
            expirationMinutes: 24 * 60,
        });
        res.json({
            success: true,
            data: {
                signedUrl,
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get signed URL error', { error, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: {
                code: 'SIGNED_URL_FAILED',
                message: 'Failed to generate signed URL',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map