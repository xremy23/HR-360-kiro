/**
 * SOS Routes Tests
 */

import request from 'supertest';
import express from 'express';
import { sosService, SOSEscalation } from '../../services/sosService';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';
import { authMiddleware } from '../../middleware/authMiddleware';
import { User } from '../../entities/User';
import { Organization } from '../../entities/Organization';
import { pushNotificationService } from '../../services/pushNotificationService';
import { getWebSocketServer } from '../../websocket/server';

// Mock services BEFORE importing router
jest.mock('../../services/sosService');
jest.mock('../../services/userService');
jest.mock('../../services/organizationService');
jest.mock('../../middleware/authMiddleware');
jest.mock('../../services/pushNotificationService');
jest.mock('../../websocket/server');

const mockedSosService = sosService as jest.Mocked<typeof sosService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedOrganizationService = organizationService as jest.Mocked<typeof organizationService>;
const mockedAuthMiddleware = authMiddleware as jest.Mocked<typeof authMiddleware>;
const mockedPushNotificationService = pushNotificationService as jest.Mocked<typeof pushNotificationService>;
const mockedGetWebSocketServer = getWebSocketServer as jest.MockedFunction<typeof getWebSocketServer>;

// Set up auth middleware mocks before importing router
mockedAuthMiddleware.verifyToken = jest.fn((req: any, res: any, next: any) => {
  req.user = { userId: 'user-123', role: 'employee' };
  next();
}) as any;
mockedAuthMiddleware.requireRole = jest.fn((...roles: string[]) => {
  return (req: any, res: any, next: any) => next();
}) as any;

// Import SOS router after mocking
import sosRouter from '../sos';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/sos', sosRouter);

describe.skip('SOS Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth middleware to pass through
    mockedAuthMiddleware.verifyToken = jest.fn((req: any, res: any, next: any) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token === 'admin-token') {
        req.user = {
          userId: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
        };
      } else {
        req.user = {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'employee',
        };
      }
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

    // Mock WebSocket server
    const mockWsServer = {
      broadcastSOSCreated: jest.fn(),
      broadcastNotificationToOrganization: jest.fn(),
    };
    mockedGetWebSocketServer.mockReturnValue(mockWsServer as any);
  });

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-1234',
    role: 'employee' as const,
    organizationId: 'org-123',
    departmentId: 'dept-123',
    teamId: 'team-123',
    position: 'Software Engineer',
    address: '123 Main St',
    personalEmergencyContact: 'Jane Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization: Organization = {
    id: 'org-123',
    name: 'Test Organization',
    emailDomain: 'example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers: User[] = [
    mockUser,
    {
      id: 'user-456',
      email: 'user2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '555-2222',
      role: 'employee' as const,
      organizationId: 'org-123',
      departmentId: 'dept-123',
      teamId: 'team-123',
      position: 'Developer',
      address: '456 Oak Ave',
      personalEmergencyContact: 'Contact 2',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'manager-789',
      email: 'manager@example.com',
      firstName: 'Bob',
      lastName: 'Manager',
      phone: '555-3333',
      role: 'admin' as const,
      organizationId: 'org-123',
      departmentId: 'dept-123',
      teamId: 'team-123',
      position: 'Manager',
      address: '789 Pine Rd',
      personalEmergencyContact: 'Contact 3',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockSOSEscalation: SOSEscalation = {
    id: 'sos-123',
    userId: 'user-123',
    organizationId: 'org-123',
    message: 'Emergency situation - need immediate help',
    status: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSOSEscalations: SOSEscalation[] = [
    mockSOSEscalation,
    {
      id: 'sos-456',
      userId: 'user-456',
      organizationId: 'org-123',
      message: 'Medical emergency',
      status: 'resolved' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('POST /sos', () => {
    beforeEach(() => {
      mockedSosService.createSOS.mockResolvedValue(mockSOSEscalation);
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      mockedOrganizationService.getOrganizationById.mockResolvedValue(mockOrganization);
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });
      mockedPushNotificationService.sendSOSNotification.mockResolvedValue([]);
    });

    it('should trigger SOS successfully', async () => {
      const sosData = {
        message: 'Emergency situation - need immediate help',
      };

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send(sosData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockSOSEscalation.id);
      expect(response.body.data.userId).toBe(mockSOSEscalation.userId);
      expect(response.body.data.status).toBe(mockSOSEscalation.status);

      expect(mockedSosService.createSOS).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        organizationId: 'org-123',
        message: 'Emergency situation - need immediate help',
      }));
    });

    it('should trigger SOS without notes', async () => {
      const sosWithoutNotes = { ...mockSOSEscalation, message: undefined };
      mockedSosService.createSOS.mockResolvedValue(sosWithoutNotes);

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should handle unknown user name gracefully', async () => {
      mockedUserService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockedPushNotificationService.sendSOSNotification).toHaveBeenCalledWith(
        expect.any(Array),
        'user-123',
        'Unknown User'
      );
    });

    it('should handle organization not found', async () => {
      mockedOrganizationService.getOrganizationById.mockResolvedValue(null);
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: [],
        total: 0,
      });

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should continue if push notifications fail', async () => {
      mockedPushNotificationService.sendSOSNotification.mockRejectedValue(new Error('Push service down'));

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should continue if WebSocket broadcast fails', async () => {
      const mockWsServer = {
        broadcastSOSCreated: jest.fn().mockImplementation(() => {
          throw new Error('WebSocket error');
        }),
        broadcastNotificationToOrganization: jest.fn(),
      };
      mockedGetWebSocketServer.mockReturnValue(mockWsServer as any);

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/sos')
        .send({ message: 'Emergency' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedSosService.createSOS.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Emergency' });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });

  describe('GET /sos/escalations', () => {
    beforeEach(() => {
      mockedSosService.getSOSEscalations.mockResolvedValue({
        escalations: mockSOSEscalations,
        total: mockSOSEscalations.length,
      });
      mockedUserService.getUserById.mockImplementation((userId: string) => {
        const user = mockUsers.find(u => u.id === userId);
        return Promise.resolve(user || null);
      });
    });

    it('should get SOS escalations successfully as admin', async () => {
      const response = await request(app)
        .get('/sos/?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      expect(response.body.data[0].id).toBe('sos-123');
      expect(response.body.data[0].userId).toBe('user-123');
      expect(response.body.data[0].userName).toBe('John Doe');
      expect(response.body.data[0].status).toBe('pending');

      expect(response.body.data[1].id).toBe('sos-456');
      expect(response.body.data[1].userId).toBe('user-456');
      expect(response.body.data[1].userName).toBe('Jane Smith');
      expect(response.body.data[1].status).toBe('resolved');

      expect(mockedSosService.getSOSEscalations).toHaveBeenCalledWith('org-123');
    });

    it('should handle unknown users in escalations', async () => {
      mockedSosService.getSOSEscalations.mockResolvedValue({
        escalations: [mockSOSEscalations[0]],
        total: 1,
      });
      mockedUserService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/sos/?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data[0].userName).toBe('Unknown');
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/sos/?orgId=org-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should reject request without orgId', async () => {
      const response = await request(app)
        .get('/sos/')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_ORG');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/sos/?orgId=org-123');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedSosService.getSOSEscalations.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/sos/?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });

    it('should return empty array when no escalations found', async () => {
      mockedSosService.getSOSEscalations.mockResolvedValue({
        escalations: [],
        total: 0,
      });

      const response = await request(app)
        .get('/sos/?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});