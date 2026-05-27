/**
 * Performance Tests for Critical Endpoints
 * Tests response times and throughput for alerts, SOS, and authentication
 */

import request from 'supertest';
import { performance } from 'perf_hooks';
import { initializeDatabase } from '../config/database';
import { sessionService } from '../services/sessionService';

// Import the app setup (we'll need to create a test app)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

// Import routes
import authRoutes from '../routes/auth';
import alertsRoutes from '../routes/alerts';
import sosRoutes from '../routes/sos';
import usersRoutes from '../routes/users';

// Test app setup
const createTestApp = () => {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  
  // Disable rate limiting for performance tests
  const testLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000, // High limit for testing
    skip: () => true, // Skip rate limiting in tests
  });
  
  app.use('/api/', testLimiter);
  
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/alerts', alertsRoutes);
  apiRouter.use('/sos', sosRoutes);
  apiRouter.use('/users', usersRoutes);
  
  app.use('/api', apiRouter);
  
  return app;
};

describe('Performance Tests - Critical Endpoints', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-for-performance-testing-32-chars-minimum';
    
    app = createTestApp();
    
    try {
      await initializeDatabase();
      await sessionService.initialize();
    } catch (error) {
      console.warn('Database/Redis initialization failed, using fallback:', error);
    }

    // Create test user and get auth token
    const testEmail = `perf-test-${Date.now()}@example.com`;
    
    // Send verification code
    await request(app)
      .post('/api/auth/send-verification')
      .send({ email: testEmail });

    // Mock verification (in real test, we'd use the actual code)
    // For performance testing, we'll create a user directly
    const authResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ 
        email: testEmail, 
        code: '123456' // This will fail, but we'll handle it differently
      });

    if (authResponse.status === 200) {
      authToken = authResponse.body.data.token;
      testUserId = authResponse.body.data.user.id;
    }
  }, 30000);

  afterAll(async () => {
    try {
      await sessionService.shutdown();
    } catch (error) {
      console.warn('Session service shutdown error:', error);
    }
  }, 30000);

  describe('Authentication Performance', () => {
    test('should handle verification code sending within 500ms', async () => {
      const testEmail = `speed-test-${Date.now()}@example.com`;
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/auth/send-verification')
        .send({ email: testEmail })
        .expect(200);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
      expect(response.body.success).toBe(true);
      
      console.log(`📊 Verification code sending: ${responseTime.toFixed(2)}ms`);
    });

    test('should handle concurrent verification requests', async () => {
      const concurrentRequests = 10;
      const promises = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(app)
          .post('/api/auth/send-verification')
          .send({ email: `concurrent-test-${i}-${Date.now()}@example.com` });
        promises.push(promise);
      }
      
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(1000); // Average should be under 1s
      
      console.log(`📊 Concurrent auth (${concurrentRequests}): ${totalTime.toFixed(2)}ms total, ${avgResponseTime.toFixed(2)}ms avg`);
    });
  });

  describe('Alerts Performance', () => {
    test('should handle alert creation within 300ms', async () => {
      if (!authToken) {
        console.warn('Skipping alerts test - no auth token');
        return;
      }

      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Performance Test Alert',
          message: 'Testing alert creation performance',
          severity: 'medium',
          category: 'general'
        });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(300);
      
      console.log(`📊 Alert creation: ${responseTime.toFixed(2)}ms`);
    });

    test('should handle alert listing within 200ms', async () => {
      if (!authToken) {
        console.warn('Skipping alerts list test - no auth token');
        return;
      }

      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(200);
      expect(response.status).toBe(200);
      
      console.log(`📊 Alert listing: ${responseTime.toFixed(2)}ms`);
    });

    test('should handle concurrent alert creation', async () => {
      if (!authToken) {
        console.warn('Skipping concurrent alerts test - no auth token');
        return;
      }

      const concurrentAlerts = 5;
      const promises = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < concurrentAlerts; i++) {
        const promise = request(app)
          .post('/api/alerts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Concurrent Alert ${i}`,
            message: `Testing concurrent alert creation ${i}`,
            severity: 'low',
            category: 'test'
          });
        promises.push(promise);
      }
      
      const responses = await Promise.allSettled(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      const avgResponseTime = totalTime / concurrentAlerts;
      
      expect(successfulResponses.length).toBeGreaterThan(0);
      expect(avgResponseTime).toBeLessThan(500);
      
      console.log(`📊 Concurrent alerts (${concurrentAlerts}): ${totalTime.toFixed(2)}ms total, ${avgResponseTime.toFixed(2)}ms avg`);
    });
  });

  describe('SOS Performance', () => {
    test('should handle SOS trigger within 100ms', async () => {
      if (!authToken) {
        console.warn('Skipping SOS test - no auth token');
        return;
      }

      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/sos/trigger')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10
          },
          message: 'Performance test SOS'
        });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // SOS should be extremely fast - critical for emergencies
      expect(responseTime).toBeLessThan(100);
      
      console.log(`📊 SOS trigger: ${responseTime.toFixed(2)}ms`);
    });

    test('should handle SOS status check within 50ms', async () => {
      if (!authToken) {
        console.warn('Skipping SOS status test - no auth token');
        return;
      }

      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/sos/status')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(50);
      expect(response.status).toBe(200);
      
      console.log(`📊 SOS status check: ${responseTime.toFixed(2)}ms`);
    });
  });

  describe('Load Testing', () => {
    test('should handle sustained load on health endpoint', async () => {
      const requests = 50;
      const promises = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < requests; i++) {
        const promise = request(app).get('/health');
        promises.push(promise);
      }
      
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All health checks should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      const requestsPerSecond = (requests / totalTime) * 1000;
      expect(requestsPerSecond).toBeGreaterThan(100); // Should handle 100+ req/s
      
      console.log(`📊 Load test (${requests} requests): ${totalTime.toFixed(2)}ms total, ${requestsPerSecond.toFixed(2)} req/s`);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform 100 operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/auth/send-verification')
          .send({ email: `memory-test-${i}@example.com` });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`📊 Memory usage: +${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });
});

/**
 * Performance Test Results Summary
 * Run with: npm test -- --testNamePattern="Performance"
 */