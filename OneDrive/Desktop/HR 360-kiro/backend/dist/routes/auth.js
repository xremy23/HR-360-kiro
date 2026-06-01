"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authService_1 = require("../services/authService");
const monitoringService_1 = require("../services/monitoringService");
const router = express_1.default.Router();
/**
 * POST /api/auth/send-magic-link
 * Send magic link to email
 */
router.post('/send-magic-link', async (req, res) => {
    try {
        const { email } = req.body;
        // Validate email
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_EMAIL',
                    message: 'Valid email is required',
                },
            });
        }
        // Get app URL from environment or request
        const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        // Send magic link
        const result = await authService_1.authService.sendMagicLink(email, appUrl);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Send magic link error', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'SEND_MAGIC_LINK_FAILED',
                message: 'Failed to send magic link',
            },
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
        // Validate inputs
        if (!token || !email) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Token and email are required',
                },
            });
        }
        // Verify magic link
        const authToken = await authService_1.authService.verifyMagicLink(token, email);
        // Set secure cookie (optional)
        res.cookie('auth_token', authToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: authToken.expiresIn * 1000,
        });
        res.json({
            success: true,
            data: {
                token: authToken.token,
                expiresIn: authToken.expiresIn,
                user: {
                    id: authToken.user.id,
                    email: authToken.user.email,
                    name: authToken.user.name,
                    role: authToken.user.role,
                },
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Verify magic link error', { error });
        const statusCode = error.message.includes('expired') ? 401 : 400;
        const code = error.message.includes('expired') ? 'LINK_EXPIRED' : 'VERIFICATION_FAILED';
        res.status(statusCode).json({
            success: false,
            error: {
                code,
                message: error.message || 'Failed to verify magic link',
            },
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'No token provided',
                },
            });
        }
        await authService_1.authService.logout(token);
        // Clear cookie
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
            error: {
                code: 'LOGOUT_FAILED',
                message: 'Failed to logout',
            },
        });
    }
});
/**
 * GET /api/auth/validate
 * Validate current token
 */
router.get('/validate', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'No token provided',
                },
            });
        }
        const validation = await authService_1.authService.validateToken(token);
        if (!validation.valid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token is invalid or expired',
                },
            });
        }
        res.json({
            success: true,
            data: {
                valid: true,
                email: validation.email,
            },
        });
    }
    catch (error) {
        monitoringService_1.logger.error('Token validation error', { error });
        res.status(401).json({
            success: false,
            error: {
                code: 'VALIDATION_FAILED',
                message: 'Token validation failed',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map