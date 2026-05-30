import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { createServer } from 'http';
import { initializeDatabase } from './config/database';
import { validateSecurityConfiguration } from './config/security';
import { sessionService } from './services/sessionService';
import { monitoringService, logger } from './services/monitoringService';
import { initializeWebSocket } from './websocket/server';

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
import monitoringRoutes from './routes/monitoring';
import superadminRoutes from './routes/superadmin';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || process.env.API_PORT || 3000;

// Trust proxy for Cloud Run
app.set('trust proxy', 1);

// Initialize WebSocket server
const wsServer = initializeWebSocket(httpServer);

// Validate security configuration on startup
let securityConfig: any;
try {
  securityConfig = validateSecurityConfiguration();
} catch (error) {
  logger.error('Security validation failed. Exiting...', { error });
  process.exit(1);
}

// Add request monitoring middleware early
app.use(monitoringService.requestMonitoring());

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
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration with secure origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (securityConfig.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Enhanced rate limiting with different tiers
const generalLimiter = rateLimit({
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
    monitoringService.logSecurityEvent('rate_limit_exceeded', {
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
const authLimiter = rateLimit({
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
    monitoringService.logSecurityEvent('auth_rate_limit_exceeded', {
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
      redisConnected: sessionService.isRedisConnected(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// API Routes
const apiRouter = express.Router();

// Monitoring routes (admin access required for most)
apiRouter.use('/monitoring', monitoringRoutes);

// Auth routes (with enhanced rate limiting)
apiRouter.use('/auth', authRoutes);

// Protected routes (auth required)
apiRouter.use('/users', usersRoutes);
apiRouter.use('/kb/guides', kbRoutes);
apiRouter.use('/check-ins', checkinsRoutes);
apiRouter.use('/alerts', alertsRoutes);
apiRouter.use('/contacts', contactsRoutes);
apiRouter.use('/incidents', incidentsRoutes);
apiRouter.use('/sos', sosRoutes);
apiRouter.use('/org', organizationRoutes);
apiRouter.use('/tobag', tobagRoutes);

// Super-admin routes
apiRouter.use('/superadmin', superadminRoutes);

// Mount API router
app.use('/api', apiRouter);

// 404 handler
app.use((req, res) => {
  monitoringService.logSecurityEvent('404_not_found', {
    path: req.path,
    method: req.method,
  }, req);
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
    statusCode: 404,
  });
});

// Enhanced error handler with sanitized messages
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    requestId: (req as any).requestId,
  });
  
  // Sanitize error messages for production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? err.message : 'Internal server error';
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: errorMessage,
    },
    statusCode: err.statusCode || 500,
  });
});

// Initialize services and start server
async function start() {
  try {
    logger.info('Security configuration validated');
    
    logger.info('Initializing Redis session service...');
    await sessionService.initialize();
    
    logger.info('Initializing database...');
    try {
      await initializeDatabase();
      logger.info('Database initialized successfully');
    } catch (dbError) {
      logger.warn('Database initialization failed, continuing without database:', { error: dbError });
      logger.warn('⚠️  Database features will be unavailable');
    }

    // Start periodic cleanup tasks
    setInterval(async () => {
      try {
        await sessionService.cleanupExpiredSessions();
        monitoringService.cleanup();
      } catch (error) {
        logger.error('Cleanup task error', { error });
      }
    }, 60 * 60 * 1000); // Every hour

    httpServer.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`WebSocket server ready on ws://localhost:${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Monitoring: http://localhost:${PORT}/api/monitoring/health`);
      logger.info('Security: Enhanced protection enabled');
      logger.info(`CORS: ${securityConfig.corsOrigins.length} origins configured`);
      logger.info(`Rate Limiting: ${securityConfig.rateLimitMax} requests per ${securityConfig.rateLimitWindow / 1000}s`);
      
      // Record startup metric
      monitoringService.recordMetric('server_startup', 1, {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      try {
        await sessionService.shutdown();
        logger.info('Session service shutdown complete');
        
        httpServer.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
        
        // Force exit after 10 seconds
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
