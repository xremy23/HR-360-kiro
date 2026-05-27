"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const validators_1 = require("../utils/validators");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const Organization_1 = require("../entities/Organization");
const router = (0, express_1.Router)();
// In-memory verification codes (TODO: use Redis for production)
const verificationCodes = {};
/**
 * POST /auth/send-verification
 * Send verification code to email
 */
router.post('/send-verification', (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !(0, validators_1.validateEmail)(email)) {
            return (0, response_1.sendError)(res, 'INVALID_EMAIL', 'Invalid email format', 400);
        }
        // Generate verification code
        const code = Math.random().toString().slice(2, 8);
        verificationCodes[email] = {
            code,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        };
        // TODO: Send email with verification code
        console.log(`Verification code for ${email}: ${code}`);
        return (0, response_1.sendSuccess)(res, { email }, 'Verification code sent to email', 200);
    }
    catch (error) {
        console.error('Send verification error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to send verification code', 500);
    }
});
/**
 * POST /auth/verify-email
 * Verify email and create session
 */
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !(0, validators_1.validateEmail)(email)) {
            return (0, response_1.sendError)(res, 'INVALID_EMAIL', 'Invalid email format', 400);
        }
        if (!code) {
            return (0, response_1.sendError)(res, 'INVALID_CODE', 'Verification code required', 400);
        }
        const verification = verificationCodes[email];
        if (!verification || verification.code !== code || verification.expiresAt < Date.now()) {
            return (0, response_1.sendError)(res, 'INVALID_CODE', 'Invalid or expired verification code', 400);
        }
        // Get or create user
        let user = await User_1.UserEntity.findByEmail(email);
        if (!user) {
            // Create new user with default organization
            const org = await Organization_1.OrganizationEntity.create({
                name: 'Personal Organization',
                emailDomain: email.split('@')[1],
                inviteCode: (0, uuid_1.v4)().slice(0, 8).toUpperCase(),
            });
            user = await User_1.UserEntity.create({
                email,
                firstName: '',
                lastName: '',
                role: 'employee',
                orgId: org.id,
                biometricEnabled: false,
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            orgId: user.orgId,
            teamId: user.teamId,
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        // Clean up verification code
        delete verificationCodes[email];
        return (0, response_1.sendSuccess)(res, {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                orgId: user.orgId,
                teamId: user.teamId,
                biometricEnabled: user.biometricEnabled,
            },
        }, 'Email verified successfully', 200);
    }
    catch (error) {
        console.error('Verify email error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to verify email', 500);
    }
});
/**
 * POST /auth/join-org
 * Join organization with invite code
 */
router.post('/join-org', async (req, res) => {
    try {
        const { email, inviteCode } = req.body;
        if (!email || !(0, validators_1.validateEmail)(email)) {
            return (0, response_1.sendError)(res, 'INVALID_EMAIL', 'Invalid email format', 400);
        }
        if (!inviteCode) {
            return (0, response_1.sendError)(res, 'INVALID_CODE', 'Invite code required', 400);
        }
        // Find organization by invite code
        const org = await Organization_1.OrganizationEntity.findByInviteCode(inviteCode);
        if (!org) {
            return (0, response_1.sendError)(res, 'ORG_NOT_FOUND', 'Organization not found', 404);
        }
        // Get or create user
        let user = await User_1.UserEntity.findByEmail(email);
        if (!user) {
            user = await User_1.UserEntity.create({
                email,
                firstName: '',
                lastName: '',
                role: 'employee',
                orgId: org.id,
                biometricEnabled: false,
            });
        }
        return (0, response_1.sendSuccess)(res, {
            orgId: org.id,
            orgName: org.name,
        }, 'Successfully joined organization', 200);
    }
    catch (error) {
        console.error('Join org error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to join organization', 500);
    }
});
/**
 * POST /auth/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token', auth_1.authMiddleware, (req, res) => {
    try {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'UNAUTHORIZED', 'User not found', 401);
        }
        const newToken = jsonwebtoken_1.default.sign({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            orgId: req.user.orgId,
            teamId: req.user.teamId,
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        return (0, response_1.sendSuccess)(res, { token: newToken }, 'Token refreshed successfully', 200);
    }
    catch (error) {
        console.error('Refresh token error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to refresh token', 500);
    }
});
/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', auth_1.authMiddleware, (req, res) => {
    try {
        // TODO: Invalidate token in blacklist
        return (0, response_1.sendSuccess)(res, {}, 'Logged out successfully', 200);
    }
    catch (error) {
        console.error('Logout error:', error);
        return (0, response_1.sendError)(res, 'SERVER_ERROR', 'Failed to logout', 500);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map