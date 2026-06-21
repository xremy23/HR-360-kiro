import {
  getSecurityConfig,
  generateSecureJWTSecret,
  validateDatabaseConfig,
  validateSecurityConfiguration,
} from '../security';

describe('Security Configuration Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('getSecurityConfig', () => {
    it('throws error if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      expect(() => getSecurityConfig()).toThrow('JWT_SECRET environment variable is required');
    });

    it('throws error if JWT_SECRET is less than 32 characters', () => {
      process.env.JWT_SECRET = 'shortsecret';
      expect(() => getSecurityConfig()).toThrow('JWT_SECRET must be at least 32 characters long');
    });

    it('throws error if JWT_SECRET is a default value', () => {
      // the original code has `if (jwtSecret.length < 32)` BEFORE `if (jwtSecret === 'your-secret-key' || jwtSecret.includes('your_') || jwtSecret.includes('replace_'))`
      // So 'your-secret-key' will actually throw the length error first.
      // So let's test the 'your_' and 'replace_' which can be 32+ chars long
      process.env.JWT_SECRET = 'your_default_secret_key_that_is_at_least_32_chars';
      expect(() => getSecurityConfig()).toThrow('JWT_SECRET must be changed from default value');

      process.env.JWT_SECRET = 'replace_me_with_a_secret_key_that_is_at_least_32_chars';
      expect(() => getSecurityConfig()).toThrow('JWT_SECRET must be changed from default value');
    });

    it('throws error in production if JWT_SECRET is less than 32 characters', () => {
      // It is already covered by the length check above, but adding it for coverage of the production block
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'shortsecret';
      expect(() => getSecurityConfig()).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('parses CORS_ORIGIN successfully', () => {
      process.env.JWT_SECRET = 'a_very_secure_secret_key_that_is_at_least_32_chars_long';
      process.env.CORS_ORIGIN = 'http://test1.com, http://test2.com';
      const config = getSecurityConfig();
      expect(config.corsOrigins).toEqual(['http://test1.com', 'http://test2.com']);
    });

    it('warns if CORS_ORIGIN contains localhost in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a_very_secure_secret_key_that_is_at_least_32_chars_long';
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://test.com';

      getSecurityConfig();
      expect(console.warn).toHaveBeenCalledWith('⚠️  WARNING: Localhost origins detected in production CORS configuration');
    });

    it('returns SecurityConfig successfully with all valid variables', () => {
      process.env.JWT_SECRET = 'a_very_secure_secret_key_that_is_at_least_32_chars_long';
      process.env.JWT_EXPIRES_IN = '12h';
      process.env.BCRYPT_ROUNDS = '10';
      process.env.RATE_LIMIT_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '50';
      process.env.AUTH_RATE_LIMIT_MAX = '3';
      process.env.CORS_ORIGIN = 'http://test.com';
      process.env.REDIS_HOST = 'test-redis';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'redis-pass';

      const config = getSecurityConfig();

      expect(config).toEqual({
        jwtSecret: 'a_very_secure_secret_key_that_is_at_least_32_chars_long',
        jwtExpiresIn: '12h',
        bcryptRounds: 10,
        rateLimitWindow: 60000,
        rateLimitMax: 50,
        authRateLimitMax: 3,
        corsOrigins: ['http://test.com'],
        redisConfig: {
          host: 'test-redis',
          port: 6380,
          password: 'redis-pass',
        },
      });
    });
  });

  describe('generateSecureJWTSecret', () => {
    it('returns a base64 encoded string of 64 random bytes', () => {
      const secret = generateSecureJWTSecret();
      expect(typeof secret).toBe('string');
      // 64 bytes encoded to base64 is 88 characters long
      expect(secret.length).toBe(88);
    });
  });

  describe('validateDatabaseConfig', () => {
    it('returns true if DB_HOST, DB_USER, DB_NAME are set', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_USER = 'user';
      process.env.DB_NAME = 'db';
      expect(validateDatabaseConfig()).toBe(true);
    });

    it('sets DB_PORT to 5432 if missing', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_USER = 'user';
      process.env.DB_NAME = 'db';
      delete process.env.DB_PORT;

      validateDatabaseConfig();
      expect(process.env.DB_PORT).toBe('5432');
    });

    it('returns false and warns if any required var is missing', () => {
      delete process.env.DB_HOST;
      process.env.DB_USER = 'user';
      process.env.DB_NAME = 'db';

      expect(validateDatabaseConfig()).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Database environment variables not fully configured: DB_HOST'));
    });

    it('throws error in production if DB_USER is insecure', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_HOST = 'localhost';
      process.env.DB_NAME = 'db';

      const insecureUsers = ['root', 'admin', 'postgres'];

      insecureUsers.forEach(user => {
        process.env.DB_USER = user;
        expect(() => validateDatabaseConfig()).toThrow(`Insecure DB_USER detected in production environment: ${user}`);
      });
    });
  });

  describe('validateSecurityConfiguration', () => {
    it('returns the security config if validations pass', () => {
      process.env.JWT_SECRET = 'a_very_secure_secret_key_that_is_at_least_32_chars_long';
      process.env.DB_HOST = 'localhost';
      process.env.DB_USER = 'user';
      process.env.DB_NAME = 'db';

      const config = validateSecurityConfiguration();
      expect(config.jwtSecret).toBe('a_very_secure_secret_key_that_is_at_least_32_chars_long');
      expect(console.log).toHaveBeenCalledWith('✅ Security configuration validated successfully');
      expect(console.log).toHaveBeenCalledWith('✅ Database configuration validated');
    });

    it('throws error if getSecurityConfig fails', () => {
      delete process.env.JWT_SECRET;

      expect(() => validateSecurityConfiguration()).toThrow('JWT_SECRET environment variable is required');
      expect(console.error).toHaveBeenCalledWith('❌ Security configuration validation failed:', expect.any(Error));
    });

    it('logs warning if database configuration is incomplete', () => {
      process.env.JWT_SECRET = 'a_very_secure_secret_key_that_is_at_least_32_chars_long';
      delete process.env.DB_HOST;

      validateSecurityConfiguration();
      expect(console.log).toHaveBeenCalledWith('⚠️  Database configuration incomplete - server will start but database features unavailable');
    });
  });
});
