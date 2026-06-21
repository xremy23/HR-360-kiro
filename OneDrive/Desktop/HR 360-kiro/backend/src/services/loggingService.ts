/**
 * Centralized Logging Service
 * Integrates with Google Cloud Logging or file-based logging
 * Provides structured JSON logging across the application
 */

import winston, { Logger, format, transports } from 'winston';
import path from 'path';

interface LogContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

export class CentralizedLoggingService {
  private logger: Logger;
  private provider: 'gcp' | 'local' = 'local';
  private isInitialized = false;

  constructor() {
    this.logger = this.createLogger();
  }

  /**
   * Initialize logging service
   */
  async initialize(): Promise<void> {
    try {
      const provider = (process.env.LOGGING_PROVIDER || 'local').toLowerCase();

      if (provider === 'gcp') {
        await this.initializeGCP();
      } else {
        this.initializeLocal();
      }

      this.isInitialized = true;
      console.log(`✅ Logging service initialized with provider: ${this.provider}`);
    } catch (error) {
      console.error('Failed to initialize logging service:', error);
      console.warn('Falling back to local logging');
      this.provider = 'local';
      this.isInitialized = true;
    }
  }

  /**
   * Initialize Google Cloud Logging
   */
  private async initializeGCP(): Promise<void> {
    try {
      const projectId = process.env.GCP_PROJECT_ID;
      if (!projectId) {
        throw new Error('GCP_PROJECT_ID is required for GCP logging');
      }

      // Dynamically import LoggingWinston to avoid issues if @google-cloud/logging-winston is not available
      const { LoggingWinston } = await import('@google-cloud/logging-winston');
      const loggingWinston = new LoggingWinston({
        projectId,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      // Add Cloud Logging transport - it returns a transport directly
      this.logger.add(loggingWinston);
      this.provider = 'gcp';

      console.log('✅ Google Cloud Logging initialized');
    } catch (error) {
      console.error('Failed to initialize GCP logging:', error);
      throw error;
    }
  }

  /**
   * Initialize local file logging
   */
  private initializeLocal(): void {
    const logsDir = path.join(process.cwd(), 'logs');

    try {
      // Create logs directory if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Add file transports for local logging
      this.logger.add(
        new transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          format: format.combine(format.timestamp(), format.json()),
        })
      );

      this.logger.add(
        new transports.File({
          filename: path.join(logsDir, 'combined.log'),
          format: format.combine(format.timestamp(), format.json()),
        })
      );

      this.provider = 'local';
      console.log('✅ Local file logging initialized');
    } catch (error) {
      console.error('Failed to initialize local logging:', error);
      this.provider = 'local';
    }
  }

  /**
   * Create base logger instance
   */
  private createLogger(): Logger {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: {
        service: 'hr-360-backend',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console transport for development
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, ...rest }) => {
              const meta = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${meta}`;
            })
          ),
        }),
      ],
    });
  }

  /**
   * Log info level
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log warning level
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * Log error level
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    this.logger.error(message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code,
      } : undefined,
    });
  }

  /**
   * Log debug level
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log HTTP request
   */
  logRequest(req: any, context?: Partial<LogContext>): void {
    this.info('HTTP Request', {
      method: req.method,
      endpoint: req.path,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      requestId: req.id || req.get('x-request-id'),
      ...context,
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: any, res: any, duration: number, context?: Partial<LogContext>): void {
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    this.logger.log(level, 'HTTP Response', {
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.id || req.get('x-request-id'),
      ...context,
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType: string, context?: LogContext): void {
    this.warn(`Security Event: ${eventType}`, {
      severity: 'security',
      ...context,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, context?: LogContext): void {
    this.debug('Database Query', {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      ...context,
    });
  }

  /**
   * Get logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get provider type
   */
  getProvider(): 'gcp' | 'local' {
    return this.provider;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Shutdown logging service
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.close();
    } catch (error) {
      console.error('Error closing logging:', error);
    }
  }
}

// Export singleton instance
export const centralizedLoggingService = new CentralizedLoggingService();
