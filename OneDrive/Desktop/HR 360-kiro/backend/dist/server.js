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
const database_1 = require("./config/database");
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
const app = (0, express_1.default)();
const PORT = process.env.API_PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
}));
// Body parser middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});
// API Routes
const apiRouter = express_1.default.Router();
// Auth routes (no auth required)
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
// Mount API router
app.use('/api', apiRouter);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
        statusCode: 404,
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            code: err.code || 'SERVER_ERROR',
            message: err.message || 'Internal server error',
        },
        statusCode: err.statusCode || 500,
    });
});
// Initialize database and start server
async function start() {
    try {
        console.log('Initializing database...');
        await (0, database_1.initializeDatabase)();
        console.log('Database initialized successfully');
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map