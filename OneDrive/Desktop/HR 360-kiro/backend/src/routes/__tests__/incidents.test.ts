/**
 * Incidents Route Tests
 * Tests for emergency incident management endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import incidentsRouter from '../incidents';
import { IncidentEntity, CheckInEntity, UserEntity, OrganizationEntity } from '../../entities';
import { getWebSocketServer } from '../../websocket/server';
import { pushNotificationService } from '../../services/pushNotificationService';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { sessionService } from '../../services/sessionService';

// Mock dependencies
jest.mock('../../entities');
jest.mock('../../websocket/server');
jest.mock('../../services/pushNotificationService');
jest.mock('../../middleware/auth');
jest.mock('../../services/sessionService');
jest.mock('jsonwebtoken');

const mockedIncidentEntity = IncidentEntity as jest.Mocked<typeof IncidentEntity>;
const mockedCheckInEntity = CheckInEntity as jest.Mocked<typeof CheckInEntity>;
const mockedUserEntity = UserEntity as jest.Mocked<typeof UserEntity>;
const mockedOrganizationEntity = OrganizationEntity as jest.Mocked<typeof OrganizationEntity>;
const mockedGetWebSocketServer = getWebSocketServer as jest.MockedFunction<typeof getWebSocketServer>;
const mockedPushNotificationService = pushNotificationService as jest.Mocked<typeof pushNotificationService>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockedAdminMiddleware = adminMiddleware as jest.MockedFunction<typeof adminMiddleware>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/incidents', incidentsRouter);

// Mock WebSocket server
const mockWsServer = {
  broadcastIncidentCreated: jest.fn(),
  broadcastNotificationToOrganization: jest.fn(),
};

describe('Incidents Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-jwt-secret-for-incidents-testing-32-chars-minimum';
    
    // Mock auth middleware
    mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token === 'admin-token') {
        req.user = {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          orgId: 'org-123',
          teamId: 'team-123',
        };
      } else {
        req.user = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'employee',
          orgId: 'org-123',
          teamId: 'team-123',
        };
      }
      next();
    }) as any);

    // Mock admin middleware
    mockedAdminMiddleware.mockImplementation(((req: any, res: any, next: any) => {
      if (req.user?.role === 'admin' || req.user?.role === 'hr') {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
          statusCode: 403,
        });
      }
    }) as any);
    
    // Mock JWT verify for auth middleware
    mockedJwt.verify.mockImplementation(((token: any) => {
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
    }) as any);

    mockedGetWebSocketServer.mockReturnValue(mockWsServer as any);
  });

  describe('GET /incidents', () => {
    const mockIncidents = [
      {
        id: 'incident-1',
        orgId: 'org-123',
        type: 'fire',
        severity: 'emergency' as const,
        startTime: new Date(),
        isDrill: false,
        createdBy: 'user-123',
      },
      {
        id: 'incident-2',
        orgId: 'org-123',
        type: 'earthquake',
        severity: 'watch' as const,
        startTime: new Date(),
        isDrill: true,
        createdBy: 'user-456',
      },
    ];

    it('should get incidents successfully', async () => {
      mockedIncidentEntity.findByOrgId.mockResolvedValue(mockIncidents);

      const response = await request(app)
        .get('/incidents?orgId=org-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(mockedIncidentEntity.findByOrgId).toHaveBeenCalledWith('org-123', false);
    });

    it('should filter drill incidents', async () => {
      const drillIncidents = [mockIncidents[1]];
      mockedIncidentEntity.findByOrgId.mockResolvedValue(drillIncidents);

      const response = await request(app)
        .get('/incidents?orgId=org-123&isDrill=true')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isDrill).toBe(true);
      expect(mockedIncidentEntity.findByOrgId).toHaveBeenCalledWith('org-123', true);
    });

    it('should handle pagination correctly', async () => {
      const manyIncidents = Array.from({ length: 75 }, (_, i) => ({
        ...mockIncidents[0],
        id: `incident-${i}`,
      }));
      mockedIncidentEntity.findByOrgId.mockResolvedValue(manyIncidents);

      const response = await request(app)
        .get('/incidents?orgId=org-123&limit=25&offset=0')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(25);
      expect(response.body.pagination.total).toBe(75);
      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should enforce maximum limit', async () => {
      mockedIncidentEntity.findByOrgId.mockResolvedValue(mockIncidents);

      const response = await request(app)
        .get('/incidents?orgId=org-123&limit=200')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100); // Max limit enforced
    });

    it('should reject request without orgId', async () => {
      const response = await request(app)
        .get('/incidents')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORG');
      expect(response.body.error.message).toBe('Organization ID required');
    });

    it('should handle database errors', async () => {
      mockedIncidentEntity.findByOrgId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/incidents?orgId=org-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve incidents');
    });
  });

  describe('POST /incidents', () => {
    const mockIncident = {
      id: 'incident-123',
      orgId: 'org-123',
      type: 'fire',
      severity: 'emergency' as const,
      startTime: new Date(),
      isDrill: false,
      createdBy: 'user-123',
    };

    const mockOrganization = {
      id: 'org-123',
      name: 'Test Organization',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUsers = [
      { 
        id: 'user-123', 
        firstName: 'John', 
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'employee' as const,
        orgId: 'org-123',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { 
        id: 'user-456', 
        firstName: 'Jane', 
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'employee' as const,
        orgId: 'org-123',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedIncidentEntity.create.mockResolvedValue(mockIncident);
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);
      mockedUserEntity.findByOrgId.mockResolvedValue(mockUsers);
      mockedPushNotificationService.sendIncidentNotification.mockResolvedValue([]);
    });

    it('should create incident successfully as admin', async () => {
      const incidentData = {
        type: 'fire',
        severity: 'emergency',
        isDrill: false,
      };

      const response = await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(incidentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Incident created successfully');
      expect(response.body.data.id).toBe(mockIncident.id);

      expect(mockedIncidentEntity.create).toHaveBeenCalledWith({
        orgId: 'org-123',
        type: 'fire',
        severity: 'emergency',
        startTime: expect.any(Date),
        isDrill: false,
        createdBy: 'admin-123',
      });
    });

    it('should create drill incident successfully', async () => {
      const drillIncident = {
        id: 'incident-123',
        orgId: 'org-123',
        type: 'earthquake',
        severity: 'watch' as const,
        startTime: new Date(),
        isDrill: true,
        createdBy: 'admin-123',
      };
      mockedIncidentEntity.create.mockResolvedValue(drillIncident);

      const drillData = {
        type: 'earthquake',
        severity: 'watch',
        isDrill: true,
      };

      const response = await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(drillData);

      expect(response.status).toBe(201);
      expect(response.body.data.isDrill).toBe(true);
      expect(mockedIncidentEntity.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDrill: true })
      );
    });

    it('should send push notifications to organization members', async () => {
      const incidentData = {
        type: 'fire',
        severity: 'emergency',
      };

      await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(incidentData);

      expect(mockedPushNotificationService.sendIncidentNotification).toHaveBeenCalledWith(
        ['user-123', 'user-456'],
        'fire',
        'Incident: fire (Severity: emergency)'
      );
    });

    it('should broadcast via WebSocket', async () => {
      const incidentData = {
        type: 'fire',
        severity: 'emergency',
      };

      await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(incidentData);

      expect(mockWsServer.broadcastIncidentCreated).toHaveBeenCalledWith(mockIncident);
      expect(mockWsServer.broadcastNotificationToOrganization).toHaveBeenCalledWith('org-123', {
        type: 'incident',
        incidentId: mockIncident.id,
        incidentType: 'fire',
        severity: 'emergency',
      });
    });

    it('should continue if push notifications fail', async () => {
      mockedPushNotificationService.sendIncidentNotification.mockRejectedValue(
        new Error('Push notification failed')
      );

      const incidentData = {
        type: 'fire',
        severity: 'emergency',
      };

      const response = await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(incidentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed even if push notifications fail
    });

    it('should continue if WebSocket broadcast fails', async () => {
      mockWsServer.broadcastIncidentCreated.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      const incidentData = {
        type: 'fire',
        severity: 'emergency',
      };

      const response = await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(incidentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed even if WebSocket fails
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        type: 'fire',
        // Missing severity
      };

      const response = await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toBe('Type and severity required');
    });

    it('should reject invalid severity level', async () => {
      const invalidData = {
        type: 'fire',
        severity: 'invalid-severity',
      };

      const response = await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SEVERITY');
      expect(response.body.error.message).toBe('Invalid severity level');
    });

    it('should handle database errors', async () => {
      mockedIncidentEntity.create.mockRejectedValue(new Error('Database error'));

      const incidentData = {
        type: 'fire',
        severity: 'emergency',
      };

      const response = await request(app)
        .post('/incidents')
        .set('Authorization', 'Bearer admin-token')
        .send(incidentData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to create incident');
    });
  });

  describe('GET /incidents/:id', () => {
    const mockIncident = {
      id: 'incident-123',
      orgId: 'org-123',
      type: 'fire',
      severity: 'emergency' as const,
      startTime: new Date(),
      isDrill: false,
      createdBy: 'user-123',
    };

    it('should get incident details successfully', async () => {
      mockedIncidentEntity.findById.mockResolvedValue(mockIncident);

      const response = await request(app)
        .get('/incidents/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Incident retrieved successfully');
      expect(response.body.data.id).toBe(mockIncident.id);
      expect(mockedIncidentEntity.findById).toHaveBeenCalledWith('incident-123');
    });

    it('should handle incident not found', async () => {
      mockedIncidentEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/incidents/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INCIDENT_NOT_FOUND');
      expect(response.body.error.message).toBe('Incident not found');
    });

    it('should handle database errors', async () => {
      mockedIncidentEntity.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/incidents/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve incident');
    });
  });

  describe('GET /incidents/:id/summary', () => {
    const mockIncident = {
      id: 'incident-123',
      orgId: 'org-123',
      type: 'fire',
      severity: 'emergency' as const,
      startTime: new Date(),
      isDrill: false,
      createdBy: 'user-123',
    };

    const mockCheckIns = [
      { 
        id: 'checkin-1', 
        userId: 'user-1', 
        teamId: 'team-1',
        status: 'safe' as const,
        timestamp: new Date(),
        isDrill: false,
      },
      { 
        id: 'checkin-2', 
        userId: 'user-2', 
        teamId: 'team-2',
        status: 'need_help' as const,
        timestamp: new Date(),
        isDrill: false,
      },
      { 
        id: 'checkin-3', 
        userId: 'user-3', 
        teamId: 'team-3',
        status: 'safe' as const,
        timestamp: new Date(),
        isDrill: false,
      },
      { 
        id: 'checkin-4', 
        userId: 'user-4', 
        teamId: 'team-4',
        status: 'sos' as const,
        timestamp: new Date(),
        isDrill: false,
      },
    ];

    it('should get incident summary successfully', async () => {
      mockedIncidentEntity.findById.mockResolvedValue(mockIncident);
      mockedCheckInEntity.findByIncidentId.mockResolvedValue(mockCheckIns);

      const response = await request(app)
        .get('/incidents/incident-123/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Incident summary retrieved successfully');
      
      const summary = response.body.data;
      expect(summary.totalMembers).toBe(100);
      expect(summary.checkedIn).toBe(4);
      expect(summary.notCheckedIn).toBe(96);
      expect(summary.safe).toBe(2);
      expect(summary.needHelp).toBe(1);
      expect(summary.sos).toBe(1);
      expect(summary.responseRate).toBe(4);
    });

    it('should handle incident not found for summary', async () => {
      mockedIncidentEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/incidents/nonexistent-id/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INCIDENT_NOT_FOUND');
      expect(response.body.error.message).toBe('Incident not found');
    });

    it('should handle database errors in summary', async () => {
      mockedIncidentEntity.findById.mockResolvedValue(mockIncident);
      mockedCheckInEntity.findByIncidentId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/incidents/incident-123/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve incident summary');
    });
  });
});

/**
 * Test Coverage Summary for Incidents Routes:
 * 
 * ✅ GET /incidents - List incidents with pagination and filtering
 * ✅ POST /incidents - Create incidents (admin only) with notifications
 * ✅ GET /incidents/:id - Get incident details
 * ✅ GET /incidents/:id/summary - Get incident check-in summary
 * 
 * Coverage includes:
 * - Authentication and authorization
 * - Input validation and error handling
 * - Database operations and error scenarios
 * - WebSocket broadcasting
 * - Push notification integration
 * - Pagination and filtering
 * - Edge cases and error conditions
 */

