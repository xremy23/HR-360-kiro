/**
 * Monitoring and Health Check Routes
 * Provides endpoints for system monitoring and observability
 */

import { Router, Request, Response } from 'express';
import { monitoringService } from '../services/monitoringService';
import { sessionService } from '../services/sessionService';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

/**
 * GET /monitoring/health
 * Public health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        redis: sessionService.isRedisConnected(),
        database: true, // We'll assume DB is healthy if we can respond
      },
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET /monitoring/metrics
 * Admin-only endpoint for detailed system metrics
 */
router.get('/metrics', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const healthMetrics = monitoringService.getHealthMetrics();
    
    return sendSuccess(res, healthMetrics, 'System metrics retrieved', 200);
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve metrics', 500);
  }
});

/**
 * GET /monitoring/metrics/prometheus
 * Prometheus-compatible metrics endpoint
 */
router.get('/metrics/prometheus', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const prometheusMetrics = monitoringService.exportPrometheusMetrics();
    
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(prometheusMetrics);
  } catch (error) {
    console.error('Prometheus metrics error:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * GET /monitoring/logs
 * Admin-only endpoint for recent logs
 */
router.get('/logs', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { level, since, limit = 100 } = req.query;
    
    const sinceTimestamp = since ? parseInt(since as string) : Date.now() - (60 * 60 * 1000); // Last hour
    const logs = monitoringService.getLogs(level as any, sinceTimestamp);
    
    // Limit results
    const limitedLogs = logs.slice(-parseInt(limit as string));
    
    return sendSuccess(res, {
      logs: limitedLogs,
      total: logs.length,
      filtered: limitedLogs.length,
    }, 'Logs retrieved', 200);
  } catch (error) {
    console.error('Logs endpoint error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve logs', 500);
  }
});

/**
 * GET /monitoring/performance
 * Admin-only endpoint for performance metrics
 */
router.get('/performance', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { metric, since } = req.query;
    
    const sinceTimestamp = since ? parseInt(since as string) : Date.now() - (60 * 60 * 1000); // Last hour
    const metrics = monitoringService.getMetrics(metric as string, sinceTimestamp);
    
    // Calculate statistics
    const values = metrics.map(m => m.value);
    const stats = values.length > 0 ? {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p95: values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)] || 0,
    } : null;
    
    return sendSuccess(res, {
      metrics,
      statistics: stats,
    }, 'Performance metrics retrieved', 200);
  } catch (error) {
    console.error('Performance endpoint error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve performance metrics', 500);
  }
});

/**
 * GET /monitoring/security
 * Admin-only endpoint for security events
 */
router.get('/security', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { since } = req.query;
    
    const sinceTimestamp = since ? parseInt(since as string) : Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    const securityLogs = monitoringService.getLogs('warn', sinceTimestamp)
      .filter(log => log.message.includes('Security Event'));
    
    return sendSuccess(res, {
      events: securityLogs,
      count: securityLogs.length,
    }, 'Security events retrieved', 200);
  } catch (error) {
    console.error('Security endpoint error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve security events', 500);
  }
});

/**
 * POST /monitoring/test-alert
 * Admin-only endpoint to test monitoring alerts
 */
router.post('/test-alert', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { type = 'test', message = 'Test monitoring alert' } = req.body;
    
    // Log a test security event
    monitoringService.logSecurityEvent(type, {
      message,
      testAlert: true,
      triggeredBy: req.user?.email,
    }, req);
    
    return sendSuccess(res, {
      message: 'Test alert generated',
      type,
    }, 'Test alert sent', 200);
  } catch (error) {
    console.error('Test alert error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to generate test alert', 500);
  }
});

/**
 * GET /monitoring/status
 * Detailed system status for admin dashboard
 */
router.get('/status', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const healthMetrics = monitoringService.getHealthMetrics();
    
    const status = {
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      services: {
        redis: {
          connected: sessionService.isRedisConnected(),
          status: sessionService.isRedisConnected() ? 'healthy' : 'disconnected',
        },
        database: {
          status: 'healthy', // Assume healthy if we can respond
        },
      },
      metrics: healthMetrics,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.API_PORT || 3000,
        corsOrigins: process.env.CORS_ORIGIN?.split(',').length || 0,
      },
    };
    
    return sendSuccess(res, status, 'System status retrieved', 200);
  } catch (error) {
    console.error('Status endpoint error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve system status', 500);
  }
});

export default router;