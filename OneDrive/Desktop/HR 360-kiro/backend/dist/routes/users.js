"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../utils/validators");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
/**
 * GET /users/profile
 * Get user profile
 */
router.get('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const user = await User_1.UserEntity.findById(req.user.id);
        if (!user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        return (0, response_1.sendSuccess)(res, user, 'Profile retrieved successfully', 200);
    }
    catch (error) {
        console.error('Get profile error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve profile', 500);
    }
});
/**
 * PUT /users/profile
 * Update user profile
 */
router.put('/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { firstName, lastName, address, latitude, longitude } = req.body;
        // Validate coordinates if provided
        if (latitude !== undefined || longitude !== undefined) {
            if (!(0, validators_1.validateCoordinates)(latitude || 0, longitude || 0)) {
                return (0, response_1.sendError)(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
            }
        }
        const updatedUser = await User_1.UserEntity.update(req.user.id, {
            firstName,
            lastName,
            address,
            latitude,
            longitude,
        });
        if (!updatedUser) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        return (0, response_1.sendSuccess)(res, updatedUser, 'Profile updated successfully', 200);
    }
    catch (error) {
        console.error('Update profile error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to update profile', 500);
    }
});
/**
 * POST /users/biometric/enable
 * Enable biometric authentication
 */
router.post('/biometric/enable', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const { type } = req.body;
        if (!['faceId', 'fingerprint', 'both'].includes(type)) {
            return (0, response_1.sendError)(res, 'INVALID_TYPE', 'Invalid biometric type', 400);
        }
        const updatedUser = await User_1.UserEntity.update(req.user.id, {
            biometricEnabled: true,
        });
        if (!updatedUser) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        return (0, response_1.sendSuccess)(res, { biometricType: type }, 'Biometric authentication enabled', 200);
    }
    catch (error) {
        console.error('Enable biometric error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to enable biometric', 500);
    }
});
/**
 * POST /users/biometric/disable
 * Disable biometric authentication
 */
router.post('/biometric/disable', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        const updatedUser = await User_1.UserEntity.update(req.user.id, {
            biometricEnabled: false,
        });
        if (!updatedUser) {
            return (0, response_1.sendError)(res, 'USER_NOT_FOUND', 'User not found', 404);
        }
        return (0, response_1.sendSuccess)(res, {}, 'Biometric authentication disabled', 200);
    }
    catch (error) {
        console.error('Disable biometric error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to disable biometric', 500);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map