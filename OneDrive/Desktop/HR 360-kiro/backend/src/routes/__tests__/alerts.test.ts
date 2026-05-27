/**
 * Alerts Routes Tests
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { AlertEntity, NotificationEntity, UserEntity, OrganizationEntity } from '../../entities';
import { pushNotificationService } from '../../services/pushNotificationService';
import { getWebSocketServer } from '../../websocket/server';

// Mock dependencies
jest.mock('../../entities');
jest.mock('../../services/pushNotificationService');
jest.mock('../../websocket/server');
jest.mock('jsonwebtoken');

const mockedAlertEntity = AlertEntity as jest.Mocked<typeof AlertEntity>;
const mockedNotificationEntity = NotificationEntity as jest.Mocked<typeof NotificationEntity>;
const mockedUserEntity = UserEntity as jest.Mocked<typeof UserEntity>;
const mockedOrganizationEntity = OrganizationEntity as jest.Mocked<typeof OrganizationEntity>;
const mockedPushNotificationService = pushNotificationService as jest.Mocked<typeof pushNotificationService>;
const mockedGetWebSocketServer = getWebSocketServer as jest.MockedFunction<typeof getWebSocketServer>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Import alerts router after mocking
import alertsRouter from '../alerts';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/alerts', alertsRouter);

describe('Alerts Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-jwt-secret-for-alerts-testing-32-chars-minimum';
    
    // Mock JWT verify for auth middleware
    mockedJwt.verify.mockImplementation((token: any) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }
      if (token === 'admin-token') {
        return {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          orgId: 'org-123',
          teamId: 'team-123',
        };
      }
      return {
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        orgId: 'org-123',
        teamId: 'team-123',
      };
    });

    // Mock WebSocket server
    const mockWsServer = {
      broadcastAlertCreated: jest.fn(),
      broadcastNotificationToOrganization: jest.fn(),
    };
    mockedGetWebSocketServer.mockReturnValue(mockWsServer as any);
  });

  const mockAlert = {
    id: 'alert-123',
    orgId: 'org-123',
    teamIds: ['team-123'],
    title: 'Emergency Alert',
    message: 'This is a test emergency alert',
    severity: 'emergency' as const,
    type: 'emergency',
    createdBy: 'admin-123',
    isDrill: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    emailDomain: 'example.com',
    inviteCode: 'TEST2024',
    logo: 'https://example.com/logo.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers = [
    {
      id: 'user-123',
      email: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'employee' as const,
      orgId: 'org-123',
      teamId: 'team-123',
      biometricEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'user-456',
      email: 'user2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'employee' as const,
      orgId: 'org-123',
      teamId: 'team-123',
      biometricEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockNotifications = [
    {
      id: 'notif-123',
      userId: 'user-123',
      alertId: 'alert-123',
      isRead: false,
      readAt: undefined,
      createdAt: new Date(),
    },
    {
      id: 'notif-456',
      userId: 'user-456',
      alertId: 'alert-123',
      isRead: true,
      readAt: new Date(),
      createdAt: new Date(),
    },
  ];

  describe('GET /alerts', () => {
    it('should get alerts successfully', async () => {
      const mockAlerts = [mockAlert];
      mockedAlertEntity.findByOrgId.mockResolvedValue(mockAlerts);

      const response = await request(app)
        .get('/alerts?orgId=org-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(mockAlert.id);
      expect(response.body.data[0].title).toBe(mockAlert.title);
      expect(response.body.data[0].severity).toBe(mockAlert.severity);
      expect(response.body.pagination.total).toBe(1);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
      expect(mockedAlertEntity.findByOrgId).toHaveBeenCalledWith('org-123', false, undefined);
    });

    it('should get alerts with drill filter', async () => {
      const drillAlerts = [{ ...mockAlert, isDrill: true }];
      mockedAlertEntity.findByOrgId.mockResolvedValue(drillAlerts);

      const response = await request(app)
        .get('/alerts?orgId=org-123&isDrill=true')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isDrill).toBe(true);
      expect(mockedAlertEntity.findByOrgId).toHaveBeenCalledWith('org-123', true, undefined);
    });

    it('should get alerts with severity filter', async () => {
      const emergencyAlerts = [mockAlert];
      mockedAlertEntity.findByOrgId.mockResolvedValue(emergencyAlerts);

      const response = await request(app)
        .get('/alerts?orgId=org-123&severity=emergency')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].severity).toBe('emergency');
      expect(mockedAlertEntity.findByOrgId).toHaveBeenCalledWith('org-123', false, 'emergency');
    });

    it('should handle pagination correctly', async () => {
      const manyAlerts = Array.from({ length: 75 }, (_, i) => ({
        ...mockAlert,
        id: `alert-${i}`,
      }));
      mockedAlertEntity.findByOrgId.mockResolvedValue(manyAlerts);

      const response = await request(app)
        .get('/alerts?orgId=org-123&limit=25&offset=50')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(25);
      expect(response.body.pagination.total).toBe(75);
      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.offset).toBe(50);
    });

    it('should enforce maximum limit', async () => {
      mockedAlertEntity.findByOrgId.mockResolvedValue([mockAlert]);

      const response = await request(app)
        .get('/alerts?orgId=org-123&limit=200')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100); // Max limit enforced
    });

    it('should reject request without orgId', async () => {
      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORG');
      expect(response.body.error.message).toBe('Organization ID required');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/alerts?orgId=org-123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedAlertEntity.findByOrgId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/alerts?orgId=org-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve alerts');
    });
  });

  describe('POST /alerts/broadcast', () => {
    it('should broadcast alert successfully as admin', async () => {
      mockedAlertEntity.create.mockResolvedValue(mockAlert);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);
      mockedPushNotificationService.sendAlertNotification.mockResolvedValue([] as any);

      const alertData = {
        title: 'Emergency Alert',
        message: 'This is a test emergency alert',
        severity: 'emergency',
        type: 'emergency',
        teamIds: ['team-123'],
        isDrill: false,
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer admin-token')
        .send(alertData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Alert broadcast successfully');
      expect(response.body.data.id).toBe(mockAlert.id);
      expect(response.body.data.title).toBe(mockAlert.title);
      expect(response.body.data.severity).toBe(mockAlert.severity);

      expect(mockedAlertEntity.create).toHaveBeenCalledWith({
        orgId: 'org-123',
        teamIds: ['team-123'],
        title: 'Emergency Alert',
        message: 'This is a test emergency alert',
        severity: 'emergency',
        type: 'emergency',
        createdBy: 'admin-123',
        isDrill: false,
      });

      expect(mockedPushNotificationService.sendAlertNotification).toHaveBeenCalledWith(
        ['user-123', 'user-456'],
        'Emergency Alert',
        'This is a test emergency alert',
        'emergency'
      );
    });

    it('should broadcast drill alert successfully', async () => {
      const drillAlert = { ...mockAlert, isDrill: true };
      mockedAlertEntity.create.mockResolvedValue(drillAlert);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);

      const alertData = {
        title: 'Drill Alert',
        message: 'This is a drill',
        severity: 'advisory',
        type: 'drill',
        isDrill: true,
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer admin-token')
        .send(alertData);

      expect(response.status).toBe(201);
      expect(response.body.data.isDrill).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const alertData = {
        title: 'Emergency Alert',
        message: 'This is a test emergency alert',
        severity: 'high',
        type: 'emergency',
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer valid-token') // employee token
        .send(alertData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        title: 'Emergency Alert',
        // Missing message, severity, type
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer admin-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toBe('Missing required fields');
    });

    it('should reject invalid severity level', async () => {
      const invalidData = {
        title: 'Emergency Alert',
        message: 'This is a test emergency alert',
        severity: 'invalid-severity',
        type: 'emergency',
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SEVERITY');
      expect(response.body.error.message).toBe('Invalid severity level');
    });

    it('should continue if push notifications fail', async () => {
      mockedAlertEntity.create.mockResolvedValue(mockAlert);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);
      mockedPushNotificationService.sendAlertNotification.mockRejectedValue(new Error('Push service down'));

      const alertData = {
        title: 'Emergency Alert',
        message: 'This is a test emergency alert',
        severity: 'emergency',
        type: 'emergency',
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer admin-token')
        .send(alertData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed even if push notifications fail
    });

    it('should continue if WebSocket broadcast fails', async () => {
      mockedAlertEntity.create.mockResolvedValue(mockAlert);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);
      
      // Mock WebSocket server to throw error
      const mockWsServer = {
        broadcastAlertCreated: jest.fn().mockImplementation(() => {
          throw new Error('WebSocket error');
        }),
        broadcastNotificationToOrganization: jest.fn(),
      };
      mockedGetWebSocketServer.mockReturnValue(mockWsServer as any);

      const alertData = {
        title: 'Emergency Alert',
        message: 'This is a test emergency alert',
        severity: 'emergency',
        type: 'emergency',
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer admin-token')
        .send(alertData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed even if WebSocket fails
    });

    it('should handle database errors', async () => {
      mockedAlertEntity.create.mockRejectedValue(new Error('Database error'));

      const alertData = {
        title: 'Emergency Alert',
        message: 'This is a test emergency alert',
        severity: 'emergency',
        type: 'emergency',
      };

      const response = await request(app)
        .post('/alerts/broadcast')
        .set('Authorization', 'Bearer admin-token')
        .send(alertData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to broadcast alert');
    });
  });

  describe('GET /alerts/:id/notifications', () => {
    it('should get alert notifications successfully', async () => {
      mockedNotificationEntity.findByAlertId.mockResolvedValue(mockNotifications);
      mockedUserEntity.findById
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1]);

      const response = await request(app)
        .get('/alerts/alert-123/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notifications retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('notif-123');
      expect(response.body.data[0].userId).toBe('user-123');
      expect(response.body.data[0].userName).toBe('John Doe');
      expect(response.body.data[0].isRead).toBe(false);
      expect(response.body.data[0].readAt).toBeUndefined();
      expect(response.body.data[1].id).toBe('notif-456');
      expect(response.body.data[1].userId).toBe('user-456');
      expect(response.body.data[1].userName).toBe('Jane Smith');
      expect(response.body.data[1].isRead).toBe(true);
    });

    it('should handle unknown users in notifications', async () => {
      mockedNotificationEntity.findByAlertId.mockResolvedValue([mockNotifications[0]]);
      mockedUserEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/alerts/alert-123/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data[0].userName).toBe('Unknown');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/alerts/alert-123/notifications');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedNotificationEntity.findByAlertId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/alerts/alert-123/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve notifications');
    });
  });

  describe('PUT /alerts/:id/notifications/:nId', () => {
    it('should mark notification as read successfully', async () => {
      const readNotification = { ...mockNotifications[0], isRead: true, readAt: new Date() };
      mockedNotificationEntity.findById.mockResolvedValue(mockNotifications[0]);
      mockedNotificationEntity.markAsRead.mockResolvedValue(readNotification);

      const response = await request(app)
        .put('/alerts/alert-123/notifications/notif-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification marked as read');
      expect(response.body.data.id).toBe(readNotification.id);
      expect(response.body.data.isRead).toBe(true);
      expect(mockedNotificationEntity.markAsRead).toHaveBeenCalledWith('notif-123');
    });

    it('should handle notification not found', async () => {
      mockedNotificationEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/alerts/alert-123/notifications/notif-999')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
      expect(response.body.error.message).toBe('Notification not found');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .put('/alerts/alert-123/notifications/notif-123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedNotificationEntity.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/alerts/alert-123/notifications/notif-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to mark notification');
    });
  });
});