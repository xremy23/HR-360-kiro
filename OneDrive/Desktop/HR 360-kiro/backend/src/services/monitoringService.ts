/**
 * Monitoring and Logging Service
 * Handles application monitoring, logging, and health checks
 */

import { Request, Response } from 'express';
import { performance } from 'perf_hooks';

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
  userId?: string;
  orgId?: string;
  requestId?: string;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private logs: LogEntry[] = [];
  private maxMetrics = 10000;
  private maxLogs = 10000;
  private startTime = Date.now();

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${name} = ${value}`, tags || '');
    }
  }

  /**
   * Log an entry
   */
  log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      metadata,
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with colors
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m',   // Gray
    };
    const reset = '\x1b[0m';
    
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const color = colors[level];
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
    
    if (metadata) {
      console.log(`${color}  Metadata:${reset}`, metadata);
    }
  }

  /**
   * Express middleware for request monitoring
   */
  requestMonitoring() {
    return (req: Request, res: Response, next: Function) => {
      const startTime = performance.now();
      const requestId = Math.random().toString(36).substring(7);
      
      // Add request ID to request object
      (req as any).requestId = requestId;

      // Log request start
      this.log('info', `${req.method} ${req.path}`, {
        requestId,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id,
        orgId: (req as any).user?.orgId,
      });

      // Override res.end to capture response metrics
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any, cb?: () => void): any {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Record response time metric
        monitoringService.recordMetric('http_request_duration_ms', responseTime, {
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode.toString(),
        });

        // Record request count
        monitoringService.recordMetric('http_requests_total', 1, {
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode.toString(),
        });

        // Log response
        const level = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
        monitoringService.log(level, `${req.method} ${req.path} - ${res.statusCode} (${responseTime.toFixed(2)}ms)`, {
          requestId,
          responseTime,
          statusCode: res.statusCode,
          userId: (req as any).user?.id,
          orgId: (req as any).user?.orgId,
        });

        return originalEnd(chunk, encoding, cb);
      };

      next();
    };
  }

  /**
   * Security event logging
   */
  logSecurityEvent(event: string, details: Record<string, any>, req?: Request): void {
    this.log('warn', `Security Event: ${event}`, {
      ...details,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: (req as any)?.user?.id,
      orgId: (req as any)?.user?.orgId,
      requestId: (req as any)?.requestId,
    });

    // Record security metric
    this.recordMetric('security_events_total', 1, {
      event_type: event,
    });
  }

  /**
   * Database operation monitoring
   */
  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean): void {
    this.recordMetric('database_operation_duration_ms', duration, {
      operation,
      table,
      success: success.toString(),
    });

    if (!success) {
      this.log('error', `Database operation failed: ${operation} on ${table}`, {
        operation,
        table,
        duration,
      });
    }
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics(): Record<string, any> {
    const now = Date.now();
    const uptime = now - this.startTime;
    const memoryUsage = process.memoryUsage();

    // Calculate recent metrics
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes
    const recentLogs = this.logs.filter(l => now - l.timestamp < 300000);

    // Calculate error rate
    const recentErrors = recentLogs.filter(l => l.level === 'error').length;
    const errorRate = recentLogs.length > 0 ? (recentErrors / recentLogs.length) * 100 : 0;

    // Calculate average response time
    const responseTimeMetrics = recentMetrics.filter(m => m.name === 'http_request_duration_ms');
    const avgResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length 
      : 0;

    return {
      uptime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      metrics: {
        total: this.metrics.length,
        recent: recentMetrics.length,
      },
      logs: {
        total: this.logs.length,
        recent: recentLogs.length,
        errorRate,
      },
      performance: {
        avgResponseTime,
      },
      timestamp: now,
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetrics(name?: string, since?: number): MetricData[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }

    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get logs for a specific time range
   */
  getLogs(level?: LogEntry['level'], since?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }

    if (since) {
      filtered = filtered.filter(l => l.timestamp >= since);
    }

    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Clear old metrics and logs
   */
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.logs = this.logs.filter(l => l.timestamp > cutoff);

    this.log('debug', 'Monitoring data cleanup completed', {
      metricsCount: this.metrics.length,
      logsCount: this.logs.length,
    });
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const metricGroups = new Map<string, MetricData[]>();

    // Group metrics by name
    this.metrics.forEach(metric => {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric);
    });

    let output = '';

    metricGroups.forEach((metrics, name) => {
      // Get the latest value for each unique tag combination
      const latestMetrics = new Map<string, MetricData>();
      
      metrics.forEach(metric => {
        const tagKey = JSON.stringify(metric.tags || {});
        if (!latestMetrics.has(tagKey) || metric.timestamp > latestMetrics.get(tagKey)!.timestamp) {
          latestMetrics.set(tagKey, metric);
        }
      });

      // Output in Prometheus format
      output += `# HELP ${name} Application metric\n`;
      output += `# TYPE ${name} gauge\n`;

      latestMetrics.forEach(metric => {
        const tags = metric.tags ? 
          Object.entries(metric.tags).map(([k, v]) => `${k}="${v}"`).join(',') : '';
        const tagString = tags ? `{${tags}}` : '';
        
        output += `${name}${tagString} ${metric.value} ${metric.timestamp}\n`;
      });

      output += '\n';
    });

    return output;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Convenience logging functions
export const logger = {
  info: (message: string, metadata?: Record<string, any>) => 
    monitoringService.log('info', message, metadata),
  warn: (message: string, metadata?: Record<string, any>) => 
    monitoringService.log('warn', message, metadata),
  error: (message: string, metadata?: Record<string, any>) => 
    monitoringService.log('error', message, metadata),
  debug: (message: string, metadata?: Record<string, any>) => 
    monitoringService.log('debug', message, metadata),
};