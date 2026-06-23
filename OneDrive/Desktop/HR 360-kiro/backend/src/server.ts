import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { getSecurityConfig, validateSecurityConfiguration } from './config/security';

// Load environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  config();
}

// Initialize logger early with fallback
let logger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
  warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
  error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || ''),
  debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta || ''),
};

let monitoringService: any = { 
  requestMonitoring: () => (req: any, res: any, next: any) => next(), 
  logSecurityEvent: () => { }, 
  cleanup: () => { }, 
  recordMetric: () => { } 
};
let centralizedLoggingService: any = { initialize: async () => { }, shutdown: async () => { } };
let sessionService: any = { initialize: async () => { }, shutdown: async () => { }, cleanupExpiredSessions: async () => { }, isRedisConnected: () => false };
let storageService: any = { initialize: async () => { } };
let backgroundJobService: any = { initialize: async () => { }, shutdown: async () => { } };
let notificationQueueService: any = { shutdown: async () => { } };

// Try to import services
try {
  const monitoring = require('./services/monitoringService');
  if (monitoring.logger) logger = monitoring.logger;
  if (monitoring.monitoringService) monitoringService = monitoring.monitoringService;
} catch (e) {
  logger.error('Failed to import monitoring service:', e);
}

try {
  const logging = require('./services/loggingService');
  if (logging.centralizedLoggingService) centralizedLoggingService = logging.centralizedLoggingService;
} catch (e) {
  logger.error('Failed to import logging service:', e);
}

try {
  const session = require('./services/sessionService');
  if (session.sessionService) sessionService = session.sessionService;
} catch (e) {
  logger.error('Failed to import session service:', e);
}

try {
  const storage = require('./services/storageService');
  if (storage.storageService) storageService = storage.storageService;
} catch (e) {
  logger.error('Failed to import storage service:', e);
}

try {
  const backgroundJobs = require('./services/backgroundJobService');
  if (backgroundJobs.backgroundJobService) backgroundJobService = backgroundJobs.backgroundJobService;
} catch (e) {
  logger.error('Failed to import background job service:', e);
}

try {
  const notificationQueue = require('./services/notificationQueueService');
  if (notificationQueue.notificationQueueService) notificationQueueService = notificationQueue.notificationQueueService;
} catch (e) {
  logger.error('Failed to import notification queue service:', e);
}

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import kbRoutes from './routes/kb';
import checkinsRoutes from './routes/checkins';
import alertsRoutes from './routes/alerts';
import contactsRoutes from './routes/contacts';
import incidentsRoutes from './routes/incidents';
import sosRoutes from './routes/sos';
import organizationRoutes from './routes/organization';
import tobagRoutes from './routes/tobag';
import bulkImportRoutes from './routes/bulkImport';
import chatbotRoutes from './routes/chatbot';
import superadminRoutes from './routes/superadmin';
import communityReportsRoutes from './routes/communityReports';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || process.env.API_PORT || 3000;

// Trust proxy for Cloud Run
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(helmet({
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
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Security headers middleware
app.use((req: any, res: any, next: any) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check
app.get('/health', (req: any, res: any) => {
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
const apiRouter = express.Router();

// Auth routes
apiRouter.use('/auth', authRoutes);

// Bulk Import routes - NEW FEATURE
apiRouter.use('/bulk-import', bulkImportRoutes);

// Protected routes
apiRouter.use('/users', usersRoutes);
apiRouter.use('/kb', kbRoutes);
apiRouter.use('/check-ins', checkinsRoutes);
apiRouter.use('/alerts', alertsRoutes);
apiRouter.use('/contacts', contactsRoutes);
apiRouter.use('/incidents', incidentsRoutes);
apiRouter.use('/sos', sosRoutes);
apiRouter.use('/org', organizationRoutes);
apiRouter.use('/tobag', tobagRoutes);
apiRouter.use('/chatbot', chatbotRoutes);
apiRouter.use('/superadmin', superadminRoutes);
apiRouter.use('/community-reports', communityReportsRoutes);

// Mount API router
app.use('/api', apiRouter);

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' }, statusCode: 404 });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
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
          } catch (error) {
            logger.error('Cleanup task error', { error });
          }
        }, 60 * 60 * 1000);
      } catch (error) {
        logger.error('Error during background service initialization', { error });
      }
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      try {
        await notificationQueueService.shutdown();
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
      } catch (error) {
        logger.error('Shutdown error', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;
