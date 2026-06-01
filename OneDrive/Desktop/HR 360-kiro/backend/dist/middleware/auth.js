"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerMiddleware = exports.superAdminMiddleware = exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const security_1 = require("../config/security");
const sessionService_1 = require("../services/sessionService");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No token provided',
                },
                statusCode: 401,
            });
        }
        // Get security configuration
        const securityConfig = (0, security_1.getSecurityConfig)();
        // Decode token to get token ID for blacklist check
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, securityConfig.jwtSecret);
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid token',
                },
                statusCode: 401,
            });
        }
        // Check if token is blacklisted
        const tokenId = decoded.jti || `${decoded.id}_${decoded.iat}`;
        const isBlacklisted = await sessionService_1.sessionService.isTokenBlacklisted(tokenId);
        if (isBlacklisted) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token has been revoked',
                },
                statusCode: 401,
            });
        }
        // Update session activity if session exists
        const sessionId = `session_${decoded.id}`;
        await sessionService_1.sessionService.updateSessionActivity(sessionId);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication failed',
            },
            statusCode: 401,
        });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (!['super_admin', 'admin', 'hr'].includes(req.user?.role || '')) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Admin access required',
            },
            statusCode: 403,
        });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
const superAdminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Super admin access required',
            },
            statusCode: 403,
        });
    }
    next();
};
exports.superAdminMiddleware = superAdminMiddleware;
const managerMiddleware = (req, res, next) => {
    if (!['super_admin', 'admin', 'hr', 'manager'].includes(req.user?.role || '')) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Manager access required',
            },
            statusCode: 403,
        });
    }
    next();
};
exports.managerMiddleware = managerMiddleware;
//# sourceMappingURL=auth.js.map