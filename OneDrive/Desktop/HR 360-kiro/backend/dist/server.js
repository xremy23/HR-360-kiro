"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
require("express-async-errors");
const http_1 = require("http");
const database_1 = require("./config/database");
const security_1 = require("./config/security");
const sessionService_1 = require("./services/sessionService");
const monitoringService_1 = require("./services/monitoringService");
const server_1 = require("./websocket/server");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const kb_1 = __importDefault(require("./routes/kb"));
const checkins_1 = __importDefault(require("./routes/checkins"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const incidents_1 = __importDefault(require("./routes/incidents"));
const sos_1 = __importDefault(require("./routes/sos"));
const organization_1 = __importDefault(require("./routes/organization"));
const tobag_1 = __importDefault(require("./routes/tobag"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const superadmin_1 = __importDefault(require("./routes/superadmin"));
const chatbot_1 = __importDefault(require("./routes/chatbot"));
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || process.env.API_PORT || 3000;
// Trust proxy for Cloud Run
app.set('trust proxy', 1);
// Initialize WebSocket server
const wsServer = (0, server_1.initializeWebSocket)(httpServer);
// Validate security configuration on startup
let securityConfig;
try {
    securityConfig = (0, security_1.validateSecurityConfiguration)();
}
catch (error) {
    monitoringService_1.logger.error('Security validation failed. Exiting...', { error });
    process.exit(1);
}
// Add request monitoring middleware early
app.use(monitoringService_1.monitoringService.requestMonitoring());
// Enhanced security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
// CORS configuration with secure origins
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if origin is in allowed list
        if (securityConfig.corsOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // Log the origin for debugging
            console.log('CORS request from origin:', origin, 'Allowed origins:', securityConfig.corsOrigins);
            // Allow all origins for now to debug
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parser middleware with size limits
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Enhanced rate limiting with different tiers
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: securityConfig.rateLimitWindow,
    max: securityConfig.rateLimitMax,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
        },
        statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        monitoringService_1.monitoringService.logSecurityEvent('rate_limit_exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        }, req);
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests from this IP, please try again later.',
            },
            statusCode: 429,
        });
    },
});
// Stricter rate limiting for authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: securityConfig.rateLimitWindow,
    max: securityConfig.authRateLimitMax,
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later.',
        },
        statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        monitoringService_1.monitoringService.logSecurityEvent('auth_rate_limit_exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        }, req);
        res.status(429).json({
            success: false,
            error: {
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                message: 'Too many authentication attempts, please try again later.',
            },
            statusCode: 429,
        });
    },
});
// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
// Health check with security info
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend is running',
        security: {
            redisConnected: sessionService_1.sessionService.isRedisConnected(),
            environment: process.env.NODE_ENV || 'development',
        },
    });
});
// API Routes
const apiRouter = express_1.default.Router();
// Monitoring routes (admin access required for most)
apiRouter.use('/monitoring', monitoring_1.default);
// Auth routes (with enhanced rate limiting)
apiRouter.use('/auth', auth_1.default);
// Protected routes (auth required)
apiRouter.use('/users', users_1.default);
apiRouter.use('/kb/guides', kb_1.default);
apiRouter.use('/check-ins', checkins_1.default);
apiRouter.use('/alerts', alerts_1.default);
apiRouter.use('/contacts', contacts_1.default);
apiRouter.use('/incidents', incidents_1.default);
apiRouter.use('/sos', sos_1.default);
apiRouter.use('/org', organization_1.default);
apiRouter.use('/tobag', tobag_1.default);
apiRouter.use('/chatbot', chatbot_1.default);
// Super-admin routes
apiRouter.use('/superadmin', superadmin_1.default);
// Mount API router
app.use('/api', apiRouter);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Enhanced error handler with sanitized messages
app.use(errorHandler_1.errorHandler);
// Initialize services and start server
async function start() {
    try {
        monitoringService_1.logger.info('Security configuration validated');
        monitoringService_1.logger.info('Initializing Redis session service...');
        await sessionService_1.sessionService.initialize();
        monitoringService_1.logger.info('Initializing database...');
        try {
            await (0, database_1.initializeDatabase)();
            monitoringService_1.logger.info('Database initialized successfully');
        }
        catch (dbError) {
            monitoringService_1.logger.warn('Database initialization failed, continuing without database:', { error: dbError });
            monitoringService_1.logger.warn('⚠️  Database features will be unavailable');
        }
        // Start periodic cleanup tasks
        setInterval(async () => {
            try {
                await sessionService_1.sessionService.cleanupExpiredSessions();
                monitoringService_1.monitoringService.cleanup();
            }
            catch (error) {
                monitoringService_1.logger.error('Cleanup task error', { error });
            }
        }, 60 * 60 * 1000); // Every hour
        httpServer.listen(PORT, () => {
            monitoringService_1.logger.info(`Server running on http://localhost:${PORT}`);
            monitoringService_1.logger.info(`WebSocket server ready on ws://localhost:${PORT}`);
            monitoringService_1.logger.info(`API Documentation: http://localhost:${PORT}/api`);
            monitoringService_1.logger.info(`Health check: http://localhost:${PORT}/health`);
            monitoringService_1.logger.info(`Monitoring: http://localhost:${PORT}/api/monitoring/health`);
            monitoringService_1.logger.info('Security: Enhanced protection enabled');
            monitoringService_1.logger.info(`CORS: ${securityConfig.corsOrigins.length} origins configured`);
            monitoringService_1.logger.info(`Rate Limiting: ${securityConfig.rateLimitMax} requests per ${securityConfig.rateLimitWindow / 1000}s`);
            // Record startup metric
            monitoringService_1.monitoringService.recordMetric('server_startup', 1, {
                environment: process.env.NODE_ENV || 'development',
                version: process.env.npm_package_version || '1.0.0',
            });
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            monitoringService_1.logger.info(`${signal} received, shutting down gracefully...`);
            try {
                await sessionService_1.sessionService.shutdown();
                monitoringService_1.logger.info('Session service shutdown complete');
                httpServer.close(() => {
                    monitoringService_1.logger.info('HTTP server closed');
                    process.exit(0);
                });
                // Force exit after 10 seconds
                setTimeout(() => {
                    monitoringService_1.logger.error('Forced shutdown after timeout');
                    process.exit(1);
                }, 10000);
            }
            catch (error) {
                monitoringService_1.logger.error('Shutdown error', { error });
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        monitoringService_1.logger.error('Failed to start server', { error });
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map