/**
 * Notifications Route Tests
 * Tests for notification management endpoints
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import notificationsRouter from '../notifications';
import { authMiddleware } from '../../middleware/auth';
import pushNotificationService from '../../services/pushNotificationService';

// Mock dependencies
jest.mock('../../services/pushNotificationService');
jest.mock('../../middleware/auth');

const mockedPushNotificationService = pushNotificationService as jest.Mocked<typeof pushNotificationService>;
const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/notifications', notificationsRouter);

describe('Notifications Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth middleware to add user to request
    mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
      req.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        orgId: 'org-123',
        teamId: 'team-123',
      };
      next();
    }) as any);
  });

  describe('POST /notifications/register-device', () => {
    beforeEach(() => {
      mockedPushNotificationService.registerDeviceToken.mockResolvedValue(undefined);
    });

    it('should register device token successfully', async () => {
      const deviceData = {
        token: 'device-token-123',
        platform: 'ios',
        deviceName: 'iPhone 12',
      };

      const response = await request(app)
        .post('/notifications/register-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device token registered successfully');

      expect(mockedPushNotificationService.registerDeviceToken).toHaveBeenCalledWith(
        'user-123',
        'device-token-123',
        'ios',
        'iPhone 12'
      );
    });

    it('should register device without device name', async () => {
      const deviceData = {
        token: 'device-token-123',
        platform: 'android',
      };

      const response = await request(app)
        .post('/notifications/register-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(200);
      expect(mockedPushNotificationService.registerDeviceToken).toHaveBeenCalledWith(
        'user-123',
        'device-token-123',
        'android',
        undefined
      );
    });

    it('should reject missing token', async () => {
      const deviceData = {
        platform: 'ios',
      };

      const response = await request(app)
        .post('/notifications/register-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('token and platform are required');
    });

    it('should reject missing platform', async () => {
      const deviceData = {
        token: 'device-token-123',
      };

      const response = await request(app)
        .post('/notifications/register-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('token and platform are required');
    });

    it('should reject invalid platform', async () => {
      const deviceData = {
        token: 'device-token-123',
        platform: 'invalid-platform',
      };

      const response = await request(app)
        .post('/notifications/register-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('platform must be ios, android, or web');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.registerDeviceToken.mockRejectedValue(
        new Error('Service error')
      );

      const deviceData = {
        token: 'device-token-123',
        platform: 'ios',
      };

      const response = await request(app)
        .post('/notifications/register-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to register device token');
    });
  });

  describe('POST /notifications/unregister-device', () => {
    beforeEach(() => {
      mockedPushNotificationService.unregisterDeviceToken.mockResolvedValue(undefined);
    });

    it('should unregister device token successfully', async () => {
      const deviceData = {
        token: 'device-token-123',
      };

      const response = await request(app)
        .post('/notifications/unregister-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device token unregistered successfully');

      expect(mockedPushNotificationService.unregisterDeviceToken).toHaveBeenCalledWith(
        'device-token-123'
      );
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/notifications/unregister-device')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('token is required');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.unregisterDeviceToken.mockRejectedValue(
        new Error('Service error')
      );

      const deviceData = {
        token: 'device-token-123',
      };

      const response = await request(app)
        .post('/notifications/unregister-device')
        .set('Authorization', 'Bearer valid-token')
        .send(deviceData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to unregister device token');
    });
  });

  describe('GET /notifications/devices', () => {
    const mockDevices = [
      {
        id: 'device-1',
        token: 'token-1',
        platform: 'ios',
        deviceName: 'iPhone 12',
        isActive: true,
      },
      {
        id: 'device-2',
        token: 'token-2',
        platform: 'android',
        deviceName: 'Samsung Galaxy',
        isActive: true,
      },
    ];

    it('should get user devices successfully', async () => {
      mockedPushNotificationService.getUserDeviceTokens.mockResolvedValue(mockDevices);

      const response = await request(app)
        .get('/notifications/devices')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Devices retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].platform).toBe('ios');

      expect(mockedPushNotificationService.getUserDeviceTokens).toHaveBeenCalledWith('user-123');
    });

    it('should handle empty devices list', async () => {
      mockedPushNotificationService.getUserDeviceTokens.mockResolvedValue([]);

      const response = await request(app)
        .get('/notifications/devices')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.getUserDeviceTokens.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/notifications/devices')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get devices');
    });
  });

  describe('GET /notifications', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        userId: 'user-123',
        title: 'Emergency Alert',
        body: 'Fire drill in progress',
        type: 'alert' as const,
        status: 'sent' as const,
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 'notif-2',
        userId: 'user-123',
        title: 'System Update',
        body: 'App updated successfully',
        type: 'custom' as const,
        status: 'delivered' as const,
        isRead: true,
        createdAt: new Date(),
      },
    ];

    it('should get notification history successfully', async () => {
      mockedPushNotificationService.getNotificationHistory.mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/notifications?limit=50&offset=0')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notifications retrieved successfully');
      expect(response.body.data).toHaveLength(2);

      expect(mockedPushNotificationService.getNotificationHistory).toHaveBeenCalledWith(
        'user-123',
        50,
        0
      );
    });

    it('should use default pagination values', async () => {
      mockedPushNotificationService.getNotificationHistory.mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedPushNotificationService.getNotificationHistory).toHaveBeenCalledWith(
        'user-123',
        50,
        0
      );
    });

    it('should enforce maximum limit', async () => {
      mockedPushNotificationService.getNotificationHistory.mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/notifications?limit=200')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedPushNotificationService.getNotificationHistory).toHaveBeenCalledWith(
        'user-123',
        100, // Max limit enforced
        0
      );
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.getNotificationHistory.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get notifications');
    });
  });

  describe('GET /notifications/unread', () => {
    const mockUnreadNotifications = [
      {
        id: 'notif-1',
        userId: 'user-123',
        title: 'Emergency Alert',
        body: 'Fire drill in progress',
        type: 'alert' as const,
        status: 'sent' as const,
        isRead: false,
        createdAt: new Date(),
      },
    ];

    it('should get unread notifications successfully', async () => {
      mockedPushNotificationService.getUnreadNotifications.mockResolvedValue(mockUnreadNotifications);

      const response = await request(app)
        .get('/notifications/unread')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Unread notifications retrieved successfully');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isRead).toBe(false);

      expect(mockedPushNotificationService.getUnreadNotifications).toHaveBeenCalledWith('user-123');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.getUnreadNotifications.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/notifications/unread')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get unread notifications');
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should get unread count successfully', async () => {
      mockedPushNotificationService.getUnreadCount.mockResolvedValue(5);

      const response = await request(app)
        .get('/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Unread count retrieved successfully');
      expect(response.body.data.count).toBe(5);

      expect(mockedPushNotificationService.getUnreadCount).toHaveBeenCalledWith('user-123');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.getUnreadCount.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get unread count');
    });
  });

  describe('GET /notifications/stats', () => {
    const mockStats = {
      total: 100,
      unread: 5,
      byType: {
        alert: 30,
        system: 20,
        incident: 15,
        custom: 35,
      },
      last7Days: 25,
    };

    it('should get notification stats successfully', async () => {
      mockedPushNotificationService.getNotificationStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/notifications/stats')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification stats retrieved successfully');
      expect(response.body.data.total).toBe(100);
      expect(response.body.data.unread).toBe(5);

      expect(mockedPushNotificationService.getNotificationStats).toHaveBeenCalledWith('user-123');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.getNotificationStats.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/notifications/stats')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get notification stats');
    });
  });

  describe('PUT /notifications/:id/read', () => {
    const mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      title: 'Test Notification',
      body: 'Test body',
      type: 'custom' as const,
      status: 'sent' as const,
      isRead: true,
      readAt: new Date(),
      createdAt: new Date(),
    };

    it('should mark notification as read successfully', async () => {
      mockedPushNotificationService.markNotificationAsRead.mockResolvedValue(mockNotification);

      const response = await request(app)
        .put('/notifications/notif-123/read')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification marked as read');
      expect(response.body.data.isRead).toBe(true);

      expect(mockedPushNotificationService.markNotificationAsRead).toHaveBeenCalledWith('notif-123');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.markNotificationAsRead.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .put('/notifications/notif-123/read')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to mark notification as read');
    });
  });

  describe('PUT /notifications/read-multiple', () => {
    it('should mark multiple notifications as read successfully', async () => {
      mockedPushNotificationService.markMultipleNotificationsAsRead.mockResolvedValue(3);

      const requestData = {
        notificationIds: ['notif-1', 'notif-2', 'notif-3'],
      };

      const response = await request(app)
        .put('/notifications/read-multiple')
        .set('Authorization', 'Bearer valid-token')
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notifications marked as read');
      expect(response.body.data.count).toBe(3);

      expect(mockedPushNotificationService.markMultipleNotificationsAsRead).toHaveBeenCalledWith([
        'notif-1',
        'notif-2',
        'notif-3',
      ]);
    });

    it('should reject empty notification IDs array', async () => {
      const requestData = {
        notificationIds: [],
      };

      const response = await request(app)
        .put('/notifications/read-multiple')
        .set('Authorization', 'Bearer valid-token')
        .send(requestData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('notificationIds array is required');
    });

    it('should reject missing notification IDs', async () => {
      const response = await request(app)
        .put('/notifications/read-multiple')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('notificationIds array is required');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.markMultipleNotificationsAsRead.mockRejectedValue(
        new Error('Service error')
      );

      const requestData = {
        notificationIds: ['notif-1', 'notif-2'],
      };

      const response = await request(app)
        .put('/notifications/read-multiple')
        .set('Authorization', 'Bearer valid-token')
        .send(requestData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to mark notifications as read');
    });
  });

  describe('POST /notifications/send-test', () => {
    const mockNotification = {
      id: 'notif-test-123',
      userId: 'user-123',
      title: 'Test Notification',
      body: 'This is a test',
      type: 'custom' as const,
      status: 'sent' as const,
      createdAt: new Date(),
    };

    beforeEach(() => {
      // Override auth middleware to simulate admin user for these tests
      const { authMiddleware } = require('../../middleware/auth');
      const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
      mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
        req.user = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin',
          orgId: 'org-123',
          teamId: 'team-123',
        };
        next();
      }) as any);
    });

    afterEach(() => {
      // Revert back
      const { authMiddleware } = require('../../middleware/auth');
      const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
      mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
        req.user = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'employee',
          orgId: 'org-123',
          teamId: 'team-123',
        };
        next();
      }) as any);
    });

    it('should reject non-admin users', async () => {
      // Revert to employee for this specific test
      const { authMiddleware } = require('../../middleware/auth');
      const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
      mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
        req.user = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'employee',
          orgId: 'org-123',
          teamId: 'team-123',
        };
        next();
      }) as any);

      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { test: true },
        type: 'custom',
      };

      const response = await request(app)
        .post('/notifications/send-test')
        .set('Authorization', 'Bearer valid-token')
        .send(testData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should send test notification successfully', async () => {
      mockedPushNotificationService.sendPushNotification.mockResolvedValue(mockNotification);

      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { test: true },
        type: 'custom',
      };

      const response = await request(app)
        .post('/notifications/send-test')
        .set('Authorization', 'Bearer valid-token')
        .send(testData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test notification sent successfully');
      expect(response.body.data.id).toBe(mockNotification.id);

      expect(mockedPushNotificationService.sendPushNotification).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { test: true },
        type: 'custom',
      });
    });

    it('should send test notification with default type', async () => {
      mockedPushNotificationService.sendPushNotification.mockResolvedValue(mockNotification);

      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      const response = await request(app)
        .post('/notifications/send-test')
        .set('Authorization', 'Bearer valid-token')
        .send(testData);

      expect(response.status).toBe(201);
      expect(mockedPushNotificationService.sendPushNotification).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        data: undefined,
        type: 'custom',
      });
    });

    it('should reject missing title', async () => {
      const testData = {
        body: 'This is a test notification',
      };

      const response = await request(app)
        .post('/notifications/send-test')
        .set('Authorization', 'Bearer valid-token')
        .send(testData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('title and body are required');
    });

    it('should reject missing body', async () => {
      const testData = {
        title: 'Test Notification',
      };

      const response = await request(app)
        .post('/notifications/send-test')
        .set('Authorization', 'Bearer valid-token')
        .send(testData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('title and body are required');
    });

    it('should handle service errors', async () => {
      mockedPushNotificationService.sendPushNotification.mockRejectedValue(
        new Error('Service error')
      );

      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      const response = await request(app)
        .post('/notifications/send-test')
        .set('Authorization', 'Bearer valid-token')
        .send(testData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to send test notification');
    });
  });
});

/**
 * Test Coverage Summary for Notifications Routes:
 * 
 * ✅ POST /notifications/register-device - Register device for push notifications
 * ✅ POST /notifications/unregister-device - Unregister device token
 * ✅ GET /notifications/devices - Get user's registered devices
 * ✅ GET /notifications - Get notification history with pagination
 * ✅ GET /notifications/unread - Get unread notifications
 * ✅ GET /notifications/unread-count - Get unread notification count
 * ✅ GET /notifications/stats - Get notification statistics
 * ✅ PUT /notifications/:id/read - Mark single notification as read
 * ✅ PUT /notifications/read-multiple - Mark multiple notifications as read
 * ✅ POST /notifications/send-test - Send test notification
 * 
 * Coverage includes:
 * - Device token management and validation
 * - Platform validation (ios, android, web)
 * - Notification history and pagination
 * - Read/unread status management
 * - Bulk operations for notifications
 * - Test notification functionality
 * - Error handling and service integration
 */