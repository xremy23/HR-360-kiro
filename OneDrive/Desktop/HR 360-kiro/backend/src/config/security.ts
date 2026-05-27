/**
 * Security Configuration Module
 * Handles secure environment variable validation and configuration
 */

import crypto from 'crypto';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  authRateLimitMax: number;
  corsOrigins: string[];
  redisConfig: {
    host: string;
    port: number;
    password?: string;
  };
}

/**
 * Validates and returns security configuration
 * Throws error if critical security requirements are not met
 */
export function getSecurityConfig(): SecurityConfig {
  // Validate JWT Secret
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (jwtSecret === 'your-secret-key' || jwtSecret.includes('your_') || jwtSecret.includes('replace_')) {
    throw new Error('JWT_SECRET must be changed from default value');
  }

  // Validate Node Environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production' && jwtSecret.length < 64) {
    throw new Error('JWT_SECRET must be at least 64 characters in production');
  }

  // Parse CORS Origins
  const corsOriginString = process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:5173';
  const corsOrigins = corsOriginString.split(',').map(origin => origin.trim());
  
  // Validate production CORS
  if (nodeEnv === 'production') {
    const hasLocalhostOrigins = corsOrigins.some(origin => origin.includes('localhost'));
    if (hasLocalhostOrigins) {
      console.warn('⚠️  WARNING: Localhost origins detected in production CORS configuration');
    }
  }

  // Redis Configuration
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  };

  return {
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
    corsOrigins,
    redisConfig,
  };
}

/**
 * Generates a secure JWT secret for development
 * Should not be used in production
 */
export function generateSecureJWTSecret(): string {
  return crypto.randomBytes(64).toString('base64');
}

/**
 * Validates database configuration
 */
export function validateDatabaseConfig(): void {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }

  // Check for default/insecure values in production
  if (process.env.NODE_ENV === 'production') {
    const insecureValues = [
      { key: 'DB_PASSWORD', value: process.env.DB_PASSWORD, insecure: ['password', '123456', 'admin'] },
      { key: 'DB_USER', value: process.env.DB_USER, insecure: ['root', 'admin'] },
    ];

    insecureValues.forEach(({ key, value, insecure }) => {
      if (value && insecure.includes(value.toLowerCase())) {
        throw new Error(`Insecure ${key} detected in production environment`);
      }
    });
  }
}

/**
 * Security startup validation
 * Call this during application startup
 */
export function validateSecurityConfiguration(): SecurityConfig {
  console.log('🔒 Validating security configuration...');
  
  try {
    validateDatabaseConfig();
    const securityConfig = getSecurityConfig();
    
    console.log('✅ Security configuration validated successfully');
    console.log(`🔐 JWT expiration: ${securityConfig.jwtExpiresIn}`);
    console.log(`🚦 Rate limit: ${securityConfig.rateLimitMax} requests per ${securityConfig.rateLimitWindow / 1000}s`);
    console.log(`🌐 CORS origins: ${securityConfig.corsOrigins.length} configured`);
    
    return securityConfig;
  } catch (error) {
    console.error('❌ Security configuration validation failed:', error);
    throw error;
  }
}