/**
 * SOS Routes Tests
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { SOSEscalationEntity, UserEntity, OrganizationEntity } from '../../entities';
import { pushNotificationService } from '../../services/pushNotificationService';
import { getWebSocketServer } from '../../websocket/server';

// Mock dependencies
jest.mock('../../entities');
jest.mock('../../services/pushNotificationService');
jest.mock('../../websocket/server');
jest.mock('jsonwebtoken');

const mockedSOSEscalationEntity = SOSEscalationEntity as jest.Mocked<typeof SOSEscalationEntity>;
const mockedUserEntity = UserEntity as jest.Mocked<typeof UserEntity>;
const mockedOrganizationEntity = OrganizationEntity as jest.Mocked<typeof OrganizationEntity>;
const mockedPushNotificationService = pushNotificationService as jest.Mocked<typeof pushNotificationService>;
const mockedGetWebSocketServer = getWebSocketServer as jest.MockedFunction<typeof getWebSocketServer>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Import SOS router after mocking
import sosRouter from '../sos';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/sos', sosRouter);

describe('SOS Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-jwt-secret-for-sos-testing-32-chars-minimum';
    
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
      broadcastSOSCreated: jest.fn(),
      broadcastNotificationToOrganization: jest.fn(),
    };
    mockedGetWebSocketServer.mockReturnValue(mockWsServer as any);
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'employee' as const,
    orgId: 'org-123',
    teamId: 'team-123',
    biometricEnabled: true,
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
    mockUser,
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
    {
      id: 'manager-789',
      email: 'manager@example.com',
      firstName: 'Bob',
      lastName: 'Manager',
      role: 'manager' as const,
      orgId: 'org-123',
      teamId: 'team-123',
      biometricEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockSOSEscalation = {
    id: 'sos-123',
    userId: 'user-123',
    notes: 'Emergency situation - need immediate help',
    status: 'pending' as const,
    initiatedAt: new Date(),
    managerNotifiedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSOSEscalations = [
    mockSOSEscalation,
    {
      id: 'sos-456',
      userId: 'user-456',
      notes: 'Medical emergency',
      status: 'resolved' as const,
      initiatedAt: new Date(),
      managerNotifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('POST /sos', () => {
    it('should trigger SOS successfully', async () => {
      mockedSOSEscalationEntity.create.mockResolvedValue(mockSOSEscalation);
      mockedUserEntity.findById.mockResolvedValue(mockUser);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);
      mockedPushNotificationService.sendSOSNotification.mockResolvedValue([] as any);

      const sosData = {
        notes: 'Emergency situation - need immediate help',
      };

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send(sosData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SOS triggered successfully');
      expect(response.body.data.id).toBe(mockSOSEscalation.id);
      expect(response.body.data.userId).toBe(mockSOSEscalation.userId);
      expect(response.body.data.status).toBe(mockSOSEscalation.status);
      expect(response.body.data.notes).toBe(mockSOSEscalation.notes);

      expect(mockedSOSEscalationEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        notes: 'Emergency situation - need immediate help',
        status: 'pending',
      });

      // Should notify other members (excluding the SOS initiator)
      expect(mockedPushNotificationService.sendSOSNotification).toHaveBeenCalledWith(
        ['user-456', 'manager-789'], // Excludes user-123 (SOS initiator)
        'user-123',
        'John Doe'
      );
    });

    it('should trigger SOS without notes', async () => {
      const sosWithoutNotes = { ...mockSOSEscalation, notes: undefined };
      mockedSOSEscalationEntity.create.mockResolvedValue(sosWithoutNotes);
      mockedUserEntity.findById.mockResolvedValue(mockUser);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockedSOSEscalationEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        notes: undefined,
        status: 'pending',
      });
    });

    it('should handle unknown user name gracefully', async () => {
      mockedSOSEscalationEntity.create.mockResolvedValue(mockSOSEscalation);
      mockedUserEntity.findById.mockResolvedValue(null); // User not found
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockedPushNotificationService.sendSOSNotification).toHaveBeenCalledWith(
        ['user-456', 'manager-789'],
        'user-123',
        'Unknown User'
      );
    });

    it('should handle organization not found', async () => {
      mockedSOSEscalationEntity.create.mockResolvedValue(mockSOSEscalation);
      mockedUserEntity.findById.mockResolvedValue(mockUser);
      mockedOrganizationEntity.findById.mockResolvedValue(null); // Org not found
      mockedUserEntity.findByOrgId.mockResolvedValue([]);

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed but with empty member list
      expect(mockedPushNotificationService.sendSOSNotification).toHaveBeenCalledWith(
        [],
        'user-123',
        'John Doe'
      );
    });

    it('should continue if push notifications fail', async () => {
      mockedSOSEscalationEntity.create.mockResolvedValue(mockSOSEscalation);
      mockedUserEntity.findById.mockResolvedValue(mockUser);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);
      mockedPushNotificationService.sendSOSNotification.mockRejectedValue(new Error('Push service down'));

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed even if push notifications fail
    });

    it('should continue if WebSocket broadcast fails', async () => {
      mockedSOSEscalationEntity.create.mockResolvedValue(mockSOSEscalation);
      mockedUserEntity.findById.mockResolvedValue(mockUser);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);
      
      // Mock WebSocket server to throw error
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
        .send({ notes: 'Emergency' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed even if WebSocket fails
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/sos')
        .send({ notes: 'Emergency' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer invalid-token')
        .send({ notes: 'Emergency' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedSOSEscalationEntity.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/sos')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Emergency' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to trigger SOS');
    });
  });

  describe('GET /sos/escalations', () => {
    it('should get SOS escalations successfully as admin', async () => {
      mockedSOSEscalationEntity.findByOrgId.mockResolvedValue(mockSOSEscalations);
      mockedUserEntity.findById
        .mockResolvedValueOnce(mockUsers[0]) // For first escalation
        .mockResolvedValueOnce(mockUsers[1]); // For second escalation

      const response = await request(app)
        .get('/sos/escalations?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SOS escalations retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      
      expect(response.body.data[0].id).toBe('sos-123');
      expect(response.body.data[0].userId).toBe('user-123');
      expect(response.body.data[0].userName).toBe('John Doe');
      expect(response.body.data[0].status).toBe('pending');
      expect(response.body.data[0].managerNotifiedAt).toBeUndefined();

      expect(response.body.data[1].id).toBe('sos-456');
      expect(response.body.data[1].userId).toBe('user-456');
      expect(response.body.data[1].userName).toBe('Jane Smith');
      expect(response.body.data[1].status).toBe('resolved');

      expect(mockedSOSEscalationEntity.findByOrgId).toHaveBeenCalledWith('org-123');
    });

    it('should handle unknown users in escalations', async () => {
      mockedSOSEscalationEntity.findByOrgId.mockResolvedValue([mockSOSEscalations[0]]);
      mockedUserEntity.findById.mockResolvedValue(null); // User not found

      const response = await request(app)
        .get('/sos/escalations?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data[0].userName).toBe('Unknown');
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/sos/escalations?orgId=org-123')
        .set('Authorization', 'Bearer valid-token'); // employee token

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject request without orgId', async () => {
      const response = await request(app)
        .get('/sos/escalations')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORG');
      expect(response.body.error.message).toBe('Organization ID required');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/sos/escalations?orgId=org-123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/sos/escalations?orgId=org-123')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedSOSEscalationEntity.findByOrgId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/sos/escalations?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve SOS escalations');
    });

    it('should return empty array when no escalations found', async () => {
      mockedSOSEscalationEntity.findByOrgId.mockResolvedValue([]);

      const response = await request(app)
        .get('/sos/escalations?orgId=org-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});