"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
require("express-async-errors");
const dotenv_1 = require("dotenv");
const http_1 = require("http");
// Load environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
    (0, dotenv_1.config)();
}
// Initialize logger early with fallback
let logger = {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || ''),
    debug: (msg, meta) => console.log(`[DEBUG] ${msg}`, meta || ''),
};
let monitoringService = {
    requestMonitoring: () => (req, res, next) => next(),
    logSecurityEvent: () => { },
    cleanup: () => { },
    recordMetric: () => { }
};
let centralizedLoggingService = { initialize: async () => { }, shutdown: async () => { } };
let sessionService = { initialize: async () => { }, shutdown: async () => { }, cleanupExpiredSessions: async () => { }, isRedisConnected: () => false };
let storageService = { initialize: async () => { } };
let backgroundJobService = { initialize: async () => { }, shutdown: async () => { } };
// Try to import services
try {
    const monitoring = require('./services/monitoringService');
    if (monitoring.logger)
        logger = monitoring.logger;
    if (monitoring.monitoringService)
        monitoringService = monitoring.monitoringService;
}
catch (e) {
    logger.error('Failed to import monitoring service:', e);
}
try {
    const logging = require('./services/loggingService');
    if (logging.centralizedLoggingService)
        centralizedLoggingService = logging.centralizedLoggingService;
}
catch (e) {
    logger.error('Failed to import logging service:', e);
}
try {
    const session = require('./services/sessionService');
    if (session.sessionService)
        sessionService = session.sessionService;
}
catch (e) {
    logger.error('Failed to import session service:', e);
}
try {
    const storage = require('./services/storageService');
    if (storage.storageService)
        storageService = storage.storageService;
}
catch (e) {
    logger.error('Failed to import storage service:', e);
}
try {
    const backgroundJobs = require('./services/backgroundJobService');
    if (backgroundJobs.backgroundJobService)
        backgroundJobService = backgroundJobs.backgroundJobService;
}
catch (e) {
    logger.error('Failed to import background job service:', e);
}
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
const bulkImport_1 = __importDefault(require("./routes/bulkImport"));
const chatbot_1 = __importDefault(require("./routes/chatbot"));
const superadmin_1 = __importDefault(require("./routes/superadmin"));
const communityReports_1 = __importDefault(require("./routes/communityReports"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || process.env.API_PORT || 3000;
// Trust proxy for Cloud Run
app.set('trust proxy', 1);
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
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parser middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend is running',
        security: {
            redisConnected: sessionService.isRedisConnected(),
            environment: process.env.NODE_ENV || 'development',
        },
    });
});
// API Routes
const apiRouter = express_1.default.Router();
// Auth routes
apiRouter.use('/auth', auth_1.default);
// Bulk Import routes - NEW FEATURE
apiRouter.use('/bulk-import', bulkImport_1.default);
// Protected routes
apiRouter.use('/users', users_1.default);
apiRouter.use('/kb', kb_1.default);
apiRouter.use('/check-ins', checkins_1.default);
apiRouter.use('/alerts', alerts_1.default);
apiRouter.use('/contacts', contacts_1.default);
apiRouter.use('/incidents', incidents_1.default);
apiRouter.use('/sos', sos_1.default);
apiRouter.use('/org', organization_1.default);
apiRouter.use('/tobag', tobag_1.default);
apiRouter.use('/chatbot', chatbot_1.default);
apiRouter.use('/superadmin', superadmin_1.default);
apiRouter.use('/community-reports', communityReports_1.default);
// Mount API router
app.use('/api', apiRouter);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' }, statusCode: 404 });
});
// Error handler
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message }, statusCode: 500 });
});
// Initialize services and start server
async function start() {
    try {
        httpServer.listen(PORT, async () => {
            logger.info(`✅ Server running on port ${PORT}`);
            logger.info(`Health: http://localhost:${PORT}/health`);
            logger.info(`Bulk Import Template: http://localhost:${PORT}/api/bulk-import/template`);
            // Initialize services asynchronously in background
            try {
                logger.info('Initializing logging service...');
                await centralizedLoggingService.initialize();
                logger.info('Initializing session service...');
                await sessionService.initialize();
                logger.info('Initializing storage service...');
                await storageService.initialize();
                logger.info('Initializing background job service...');
                await backgroundJobService.initialize();
                // Setup periodic cleanup tasks
                setInterval(async () => {
                    try {
                        await sessionService.cleanupExpiredSessions();
                        monitoringService.cleanup();
                    }
                    catch (error) {
                        logger.error('Cleanup task error', { error });
                    }
                }, 60 * 60 * 1000);
            }
            catch (error) {
                logger.error('Error during background service initialization', { error });
            }
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info(`${signal} received, shutting down gracefully...`);
            try {
                await backgroundJobService.shutdown();
                await centralizedLoggingService.shutdown();
                await sessionService.shutdown();
                httpServer.close(() => {
                    logger.info('HTTP server closed');
                    process.exit(0);
                });
                setTimeout(() => {
                    logger.error('Forced shutdown after timeout');
                    process.exit(1);
                }, 10000);
            }
            catch (error) {
                logger.error('Shutdown error', { error });
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
}
start();
exports.default = app;
//# sourceMappingURL=server.js.map