"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const monitoringService_1 = require("../services/monitoringService");
const emailService_1 = require("../services/emailService");
const userService_1 = require("../services/userService");
const authService_1 = require("../services/authService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * TEST ENDPOINT - Debug email service
 */
router.post('/test-email', async (req, res) => {
    try {
        monitoringService_1.logger.info('🧪 TEST EMAIL ENDPOINT CALLED');
        const { email } = req.body || {};
        if (!email) {
            return res.json({
                success: false,
                message: 'No email provided',
                test: 'Please provide email in body'
            });
        }
        monitoringService_1.logger.info('Testing email service', { email });
        // Test the email service directly
        try {
            const testLink = 'https://test.example.com/verify?token=test123';
            monitoringService_1.logger.info('Calling emailService.sendMagicLink with test data', { email, testLink });
            const result = await emailService_1.emailService.sendMagicLink(email, testLink);
            monitoringService_1.logger.info('✅ emailService.sendMagicLink() succeeded', { result });
            res.json({
                success: true,
                message: 'Email send test completed successfully',
                result,
                email,
                testLink
            });
        }
        catch (innerErr) {
            monitoringService_1.logger.error('❌ emailService.sendMagicLink() threw error', {
                errorName: innerErr.name,
                errorMessage: innerErr.message,
                errorCode: innerErr?.code,
                errorResponse: innerErr?.response,
                stack: innerErr.stack
            });
            res.json({
                success: false,
                message: 'Email service error (exception thrown)',
                error: innerErr.message,
                errorName: innerErr.name,
                errorCode: innerErr?.code,
            });
        }
    }
    catch (error) {
        monitoringService_1.logger.error('❌ TEST EMAIL ENDPOINT ERROR', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        res.json({
            success: false,
            message: 'Test endpoint error',
            error: error.message
        });
    }
});
/**
 * GET /api/auth/check-email
 * Check if email exists
 */
router.get('/check-email', (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_EMAIL', message: 'Valid email is required' },
            });
        }
        // Check if email exists in database
        userService_1.userService.getUserByEmail(email).then(user => {
            res.json({
                success: true,
                exists: !!user,
            });
        }).catch(error => {
            monitoringService_1.logger.error('Check email error', { email, error });
            res.status(500).json({
                success: false,
                error: { code: 'CHECK_EMAIL_FAILED', message: 'Failed to check email' },
            });
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Check email error', { error });
        res.status(500).json({
            success: false,
            error: { code: 'CHECK_EMAIL_FAILED', message: 'Failed to check email' },
        });
    }
});
/**
 * POST /api/auth/request-link
 * Request magic link and send email
 */
router.post('/request-link', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_EMAIL', message: 'Valid email is required' },
            });
        }
        // Generate magic link token
        const token = (0, uuid_1.v4)();
        // Create magic link URL
        const magicLink = `https://hr-crisis-360-frontend-116253736511.asia-southeast1.run.app/login?email=${encodeURIComponent(email)}&token=${token}`;
        monitoringService_1.logger.info('=== MAGIC LINK REQUEST ===', { email, token, magicLink });
        try {
            monitoringService_1.logger.info('Calling emailService.sendMagicLink()...', { email });
            const emailSent = await emailService_1.emailService.sendMagicLink(email, magicLink);
            monitoringService_1.logger.info('✅ emailService.sendMagicLink() completed', { email, emailSent });
            res.json({
                success: true,
                data: {
                    success: true,
                    message: 'Magic link sent to your email',
                    token,
                },
                token,
            });
        }
        catch (emailError) {
            monitoringService_1.logger.error('❌ emailService.sendMagicLink() THREW ERROR', {
                email,
                errorName: emailError.name,
                errorMessage: emailError.message,
                errorStack: emailError.stack,
            });
            throw emailError;
        }
    }
    catch (error) {
        monitoringService_1.logger.error('❌ REQUEST LINK ERROR', {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
        });
        res.status(500).json({
            success: false,
            error: { code: 'REQUEST_LINK_FAILED', message: `Failed to request magic link: ${error.message}` },
        });
    }
});
/**
 * POST /api/auth/send-magic-link
 * Send magic link to email
 */
router.post('/send-magic-link', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_EMAIL', message: 'Valid email is required' },
            });
        }
        monitoringService_1.logger.info('=== SEND MAGIC LINK ===', { email });
        try {
            // Use AuthService to send magic link - this handles Redis token storage and expiry
            const result = await authService_1.authService.sendMagicLink(email, 'https://hr-crisis-360-frontend-116253736511.asia-southeast1.run.app');
            monitoringService_1.logger.info('✅ Magic link sent via authService', { email });
            res.json({
                success: true,
                data: { token: result.token },
            });
        }
        catch (authError) {
            monitoringService_1.logger.error('❌ authService.sendMagicLink() THREW ERROR', {
                email,
                errorName: authError.name,
                errorMessage: authError.message,
                errorStack: authError.stack,
            });
            throw authError;
        }
    }
    catch (error) {
        monitoringService_1.logger.error('❌ SEND MAGIC LINK ERROR', {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
        });
        res.status(500).json({
            success: false,
            error: { code: 'SEND_MAGIC_LINK_FAILED', message: `Error: ${error.message}` },
        });
    }
});
/**
 * POST /api/auth/verify-magic-link
 * Verify magic link and return JWT token
 */
router.post('/verify-magic-link', async (req, res) => {
    try {
        const { token, email } = req.body;
        if (!token || !email) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_FIELDS', message: 'Token and email are required' },
            });
        }
        monitoringService_1.logger.info('🔵 Verify magic link', { email, token });
        try {
            // Use AuthService to verify - this validates token from Redis and creates JWT
            const authToken = await authService_1.authService.verifyMagicLink(token, email);
            monitoringService_1.logger.info('✅ Magic link verified via authService', { email });
            res.json({
                success: true,
                data: {
                    token: authToken.token,
                    expiresIn: authToken.expiresIn,
                    user: authToken.user,
                },
            });
        }
        catch (authError) {
            monitoringService_1.logger.error('❌ authService.verifyMagicLink() error', {
                email,
                errorMessage: authError.message,
            });
            return res.status(401).json({
                success: false,
                error: { code: 'VERIFICATION_FAILED', message: authError.message },
            });
        }
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        monitoringService_1.logger.error('🔴 Verify magic link error', { error: errorMsg });
        res.status(500).json({
            success: false,
            error: { code: 'VERIFICATION_FAILED', message: 'Failed to verify magic link' },
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
    try {
        res.clearCookie('auth_token');
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Logout error', { error });
        res.status(500).json({
            success: false,
            error: { code: 'LOGOUT_FAILED', message: 'Failed to logout' },
        });
    }
});
/**
 * GET /api/auth/validate
 * Validate current token
 */
router.get('/validate', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: { code: 'NO_TOKEN', message: 'No token provided' },
            });
        }
        // Validate JWT token
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        res.json({
            success: true,
            data: {
                valid: true,
                email: decoded.email,
                userId: decoded.userId,
                organizationId: decoded.organizationId,
                role: decoded.role,
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Token validation error', { error });
        res.status(401).json({
            success: false,
            error: { code: 'VALIDATION_FAILED', message: 'Token validation failed' },
        });
    }
});
/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }
        // Get current user from database with organization data
        let user;
        try {
            user = await userService_1.userService.getUserById(req.user.userId);
        }
        catch (dbError) {
            monitoringService_1.logger.error('🔴 Failed to fetch user from database in /me endpoint', {
                userId: req.user.userId,
                error: dbError instanceof Error ? dbError.message : String(dbError)
            });
            // If database fails, return error (don't silently create fake user)
            return res.status(500).json({
                success: false,
                error: { code: 'DATABASE_ERROR', message: 'Failed to fetch user data' },
            });
        }
        if (!user) {
            monitoringService_1.logger.warn('⚠️ User not found in database but token is valid', { userId: req.user.userId });
            // User doesn't exist in database but token is valid
            // This shouldn't happen - user should exist if they have a valid token
            // Return error instead of creating fake user
            return res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found in database' },
            });
        }
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: (user.role || 'employee'),
                organizationId: user.organizationId,
                avatar: user.avatarUrl || user.avatar,
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Get current user error', { error });
        res.status(500).json({
            success: false,
            error: { code: 'AUTH_ERROR', message: 'Failed to get current user' },
        });
    }
});
/**
 * POST /api/auth/refresh-token
 * Refresh JWT token using existing token from request
 */
router.post('/refresh-token', authMiddleware_1.authMiddleware.verifyToken.bind(authMiddleware_1.authMiddleware), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
            });
        }
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
        // Get current user data
        let user;
        try {
            user = await userService_1.userService.getUserById(req.user.userId);
        }
        catch (dbError) {
            monitoringService_1.logger.error('🔴 Failed to fetch user from database in /refresh-token endpoint', {
                userId: req.user.userId,
                error: dbError instanceof Error ? dbError.message : String(dbError)
            });
            return res.status(500).json({
                success: false,
                error: { code: 'DATABASE_ERROR', message: 'Failed to fetch user data' },
            });
        }
        if (!user) {
            monitoringService_1.logger.warn('⚠️ User not found in database during token refresh', { userId: req.user.userId });
            return res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found in database' },
            });
        }
        // Generate new token with current user data
        const newToken = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role || 'employee',
            organizationId: user.organizationId,
        }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            data: {
                token: newToken,
                expiresIn: 604800,
                user: {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: (user.role || 'employee'),
                    organizationId: user.organizationId,
                    avatar: user.avatarUrl || user.avatar,
                },
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Refresh token error', { error });
        res.status(401).json({
            success: false,
            error: { code: 'REFRESH_FAILED', message: 'Failed to refresh token' },
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map