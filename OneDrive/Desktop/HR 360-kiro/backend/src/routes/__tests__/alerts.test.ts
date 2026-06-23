/**
 * Alerts Routes Tests
 * Tests for alert management endpoints
 */

import request from 'supertest';
import express from 'express';
import { alertService, AlertRecipient } from '../../services/alertService';
import { userService } from '../../services/userService';
import { authMiddleware } from '../../middleware/authMiddleware';
import { Alert } from '../../entities/Alert';
import { User } from '../../entities/User';
import { Notification } from '../../entities/Notification';

// Mock services
jest.mock('../../services/alertService');
jest.mock('../../services/userService');
jest.mock('../../middleware/authMiddleware');

const mockedAlertService = alertService as jest.Mocked<typeof alertService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedAuthMiddleware = authMiddleware as jest.Mocked<typeof authMiddleware>;

// Import alerts router after mocking
import alertsRouter from '../alerts';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/alerts', alertsRouter);

describe.skip('Alerts Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth middleware to pass through
    mockedAuthMiddleware.verifyToken = jest.fn((req: any, res: any, next: any) => {
      req.user = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'employee',
      };
      next();
    }) as any;

    mockedAuthMiddleware.requireRole = jest.fn((...roles: string[]) => {
      return (req: any, res: any, next: any) => {
        if (roles.includes(req.user?.role || '')) {
          next();
        } else {
          res.status(403).json({
            success: false,
            error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions' },
          });
        }
      };
    }) as any;
  });

  const mockAlert: Alert = {
    id: 'alert-123',
    orgId: 'org-123',
    title: 'Emergency Alert',
    message: 'This is a test emergency alert',
    severity: 'emergency' as const,
    type: 'emergency',
    createdBy: 'admin-123',
    isDrill: false,
    createdAt: new Date('2024-01-01'),
  };

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'employee' as const,
    organizationId: 'org-123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /alerts', () => {
    it('should get alerts successfully', async () => {
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      mockedAlertService.getAlerts.mockResolvedValue({
        alerts: [mockAlert as any],
        total: 1,
      });

      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(mockedUserService.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockedAlertService.getAlerts).toHaveBeenCalledWith('org-123', expect.any(Object));
    });

    it('should handle user not found', async () => {
      mockedUserService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_ORGANIZATION');
    });

    it('should handle database errors', async () => {
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      mockedAlertService.getAlerts.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /alerts/:id', () => {
    it('should get alert by ID successfully', async () => {
      mockedAlertService.getAlertById.mockResolvedValue(mockAlert as any);

      const response = await request(app)
        .get('/alerts/alert-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('alert-123');
      expect(mockedAlertService.getAlertById).toHaveBeenCalledWith('alert-123');
    });

    it('should handle alert not found', async () => {
      mockedAlertService.getAlertById.mockResolvedValue(null as any);

      const response = await request(app)
        .get('/alerts/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALERT_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      mockedAlertService.getAlertById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/alerts/alert-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /alerts', () => {
    it('should create alert successfully as admin', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      mockedAlertService.createAlert.mockResolvedValue(mockAlert as any);

      const alertData = {
        title: 'Emergency Alert',
        description: 'This is a test emergency alert',
        severity: 'critical',
        type: 'emergency',
        isDrill: false,
      };

      const response = await request(app)
        .post('/alerts')
        .set('Authorization', 'Bearer admin-token')
        .send(alertData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('alert-123');
      expect(mockedAlertService.createAlert).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'org-123',
        title: 'Emergency Alert',
      }));
    });

    it('should reject missing required fields', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);

      const incompleteData = {
        title: 'Emergency Alert',
        // missing description, severity, type
      };

      const response = await request(app)
        .post('/alerts')
        .set('Authorization', 'Bearer admin-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should reject invalid severity', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);

      const invalidData = {
        title: 'Emergency Alert',
        description: 'Test',
        severity: 'invalid-severity',
        type: 'emergency',
      };

      const response = await request(app)
        .post('/alerts')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SEVERITY');
    });

    it('should handle database errors', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      mockedAlertService.createAlert.mockRejectedValue(new Error('Database error'));

      const alertData = {
        title: 'Emergency Alert',
        description: 'Test',
        severity: 'critical',
        type: 'emergency',
      };

      const response = await request(app)
        .post('/alerts')
        .set('Authorization', 'Bearer admin-token')
        .send(alertData);

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /alerts/:id', () => {
    it('should update alert successfully as admin', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      const updatedAlert: Alert = {
        ...mockAlert,
        title: 'Updated Alert',
      };
      mockedAlertService.updateAlert.mockResolvedValue(updatedAlert as any);

      const updateData = {
        title: 'Updated Alert',
        severity: 'high',
      };

      const response = await request(app)
        .put('/alerts/alert-123')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Alert');
      expect(mockedAlertService.updateAlert).toHaveBeenCalledWith('alert-123', expect.any(Object));
    });

    it('should handle alert not found', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      mockedAlertService.updateAlert.mockResolvedValue(null);

      const updateData = { title: 'Updated Alert' };

      const response = await request(app)
        .put('/alerts/nonexistent-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALERT_NOT_FOUND');
    });

    it('should reject invalid severity', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);

      const updateData = {
        severity: 'invalid-severity',
      };

      const response = await request(app)
        .put('/alerts/alert-123')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_SEVERITY');
    });

    it('should handle database errors', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      mockedAlertService.updateAlert.mockRejectedValue(new Error('Database error'));

      const updateData = { title: 'Updated Alert' };

      const response = await request(app)
        .put('/alerts/alert-123')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /alerts/:id', () => {
    it('should delete alert successfully as admin', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      mockedAlertService.deleteAlert.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/alerts/alert-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockedAlertService.deleteAlert).toHaveBeenCalledWith('alert-123');
    });

    it('should handle database errors during deletion', async () => {
      const adminUser: User = { ...mockUser, role: 'admin' as const };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      mockedAlertService.deleteAlert.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/alerts/alert-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /alerts/:id/acknowledge', () => {
    it('should acknowledge alert successfully', async () => {
      const mockAcknowledgment: AlertRecipient = {
        id: 'ack-123',
        alertId: 'alert-123',
        userId: 'user-123',
        isAcknowledged: true,
        createdAt: new Date(),
      };

      mockedAlertService.acknowledgeAlert.mockResolvedValue(mockAcknowledgment);

      const response = await request(app)
        .post('/alerts/alert-123/acknowledge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('ack-123');
      expect(mockedAlertService.acknowledgeAlert).toHaveBeenCalledWith('alert-123', 'user-123');
    });

    it('should handle database errors during acknowledgment', async () => {
      mockedAlertService.acknowledgeAlert.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/alerts/alert-123/acknowledge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /alerts/:id/recipients', () => {
    it('should get alert recipients successfully', async () => {
      const mockRecipients: AlertRecipient[] = [
        { id: 'rec-1', alertId: 'alert-123', userId: 'user-1', isAcknowledged: false, createdAt: new Date() },
        { id: 'rec-2', alertId: 'alert-123', userId: 'user-2', isAcknowledged: true, createdAt: new Date() },
      ];

      mockedAlertService.getAlertRecipients.mockResolvedValue(mockRecipients);

      const response = await request(app)
        .get('/alerts/alert-123/recipients')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(mockedAlertService.getAlertRecipients).toHaveBeenCalledWith('alert-123');
    });
  });

  describe('GET /alerts/notifications', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-123',
          alertId: 'alert-123',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockedAlertService.getUserNotifications.mockResolvedValue({
        notifications: mockNotifications as any[],
        total: 1,
      });

      const response = await request(app)
        .get('/alerts/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(mockedAlertService.getUserNotifications).toHaveBeenCalledWith('user-123', expect.any(Object));
    });
  });

  describe('PUT /alerts/notifications/:notificationId/read', () => {
    it('should mark notification as read successfully', async () => {
      mockedAlertService.markNotificationAsRead.mockResolvedValue(undefined);

      const response = await request(app)
        .put('/alerts/notifications/notif-123/read')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockedAlertService.markNotificationAsRead).toHaveBeenCalledWith('notif-123');
    });
  });
});

