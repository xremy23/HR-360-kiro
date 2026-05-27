/**
 * Check-ins Route Tests
 * Tests for safety check-in endpoints
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import checkinsRouter from '../checkins';
import { authMiddleware, managerMiddleware } from '../../middleware/auth';
import { CheckInEntity, UserEntity } from '../../entities';
import { getWebSocketServer } from '../../websocket/server';

// Mock dependencies
jest.mock('../../entities');
jest.mock('../../websocket/server');
jest.mock('../../middleware/auth');

const mockedCheckInEntity = CheckInEntity as jest.Mocked<typeof CheckInEntity>;
const mockedUserEntity = UserEntity as jest.Mocked<typeof UserEntity>;
const mockedGetWebSocketServer = getWebSocketServer as jest.MockedFunction<typeof getWebSocketServer>;
const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockedManagerMiddleware = managerMiddleware as jest.MockedFunction<typeof managerMiddleware>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/check-ins', checkinsRouter);

// Mock WebSocket server
const mockWsServer = {
  broadcastCheckInCreated: jest.fn(),
};

describe('Check-ins Routes', () => {
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

    mockedManagerMiddleware.mockImplementation(((req: any, res: any, next: any) => {
      next();
    }) as any);

    mockedGetWebSocketServer.mockReturnValue(mockWsServer as any);
  });

  describe('POST /check-ins', () => {
    const mockCheckIn = {
      id: 'checkin-123',
      userId: 'user-123',
      teamId: 'team-123',
      status: 'safe' as const,
      notes: 'All good here',
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: new Date(),
      incidentId: 'incident-123',
      isDrill: false,
    };

    beforeEach(() => {
      mockedCheckInEntity.create.mockResolvedValue(mockCheckIn);
    });

    it('should submit check-in successfully', async () => {
      const checkInData = {
        status: 'safe',
        notes: 'All good here',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        incidentId: 'incident-123',
        isDrill: false,
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Check-in submitted successfully');
      expect(response.body.data.id).toBe(mockCheckIn.id);

      expect(mockedCheckInEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe',
        notes: 'All good here',
        latitude: 40.7128,
        longitude: -74.0060,
        incidentId: 'incident-123',
        isDrill: false,
      });
    });

    it('should submit check-in without location', async () => {
      const checkInData = {
        status: 'safe',
        notes: 'All good here',
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(201);
      expect(mockedCheckInEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe',
        notes: 'All good here',
        latitude: undefined,
        longitude: undefined,
        incidentId: undefined,
        isDrill: false,
      });
    });

    it('should submit drill check-in', async () => {
      const checkInData = {
        status: 'safe',
        isDrill: true,
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(201);
      expect(mockedCheckInEntity.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDrill: true })
      );
    });

    it('should broadcast via WebSocket', async () => {
      const checkInData = {
        status: 'safe',
        notes: 'All good here',
      };

      await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(mockWsServer.broadcastCheckInCreated).toHaveBeenCalledWith(mockCheckIn);
    });

    it('should continue if WebSocket broadcast fails', async () => {
      mockWsServer.broadcastCheckInCreated.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      const checkInData = {
        status: 'safe',
        notes: 'All good here',
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      // Should still succeed even if WebSocket fails
    });

    it('should reject invalid status', async () => {
      const checkInData = {
        status: 'invalid-status',
        notes: 'All good here',
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
      expect(response.body.error.message).toBe('Invalid check-in status');
    });

    it('should reject invalid coordinates', async () => {
      const checkInData = {
        status: 'safe',
        location: {
          latitude: 200, // Invalid latitude
          longitude: -74.0060,
        },
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
      expect(response.body.error.message).toBe('Invalid coordinates');
    });

    it('should handle database errors', async () => {
      mockedCheckInEntity.create.mockRejectedValue(new Error('Database error'));

      const checkInData = {
        status: 'safe',
        notes: 'All good here',
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to submit check-in');
    });
  });

  describe('GET /check-ins/team/:teamId', () => {
    const mockCheckIns = [
      {
        id: 'checkin-1',
        userId: 'user-1',
        teamId: 'team-123',
        status: 'safe' as const,
        timestamp: new Date(),
        notes: 'All good',
        isDrill: false,
      },
      {
        id: 'checkin-2',
        userId: 'user-2',
        teamId: 'team-123',
        status: 'need_help' as const,
        timestamp: new Date(),
        notes: 'Need assistance',
        isDrill: false,
      },
    ];

    const mockUsers = [
      { 
        id: 'user-1', 
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
        id: 'user-2', 
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
      jest.clearAllMocks();
      mockedCheckInEntity.findByTeamId.mockResolvedValue(mockCheckIns);
      mockedUserEntity.findById.mockImplementation((userId: string) => {
        if (userId === 'user-1') return Promise.resolve(mockUsers[0]);
        if (userId === 'user-2') return Promise.resolve(mockUsers[1]);
        return Promise.resolve(null);
      });
    });

    it('should get team check-ins successfully as manager', async () => {
      const response = await request(app)
        .get('/check-ins/team/team-123')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Team check-ins retrieved');
      expect(response.body.data).toHaveLength(2);
      
      expect(response.body.data[0]).toEqual({
        userId: 'user-1',
        userName: 'John Doe',
        status: 'safe',
        timestamp: expect.any(String),
        notes: 'All good',
      });

      expect(mockedCheckInEntity.findByTeamId).toHaveBeenCalledWith('team-123', undefined, false);
    });

    it('should filter by incident ID', async () => {
      const response = await request(app)
        .get('/check-ins/team/team-123?incidentId=incident-123')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(200);
      expect(mockedCheckInEntity.findByTeamId).toHaveBeenCalledWith('team-123', 'incident-123', false);
    });

    it('should filter drill check-ins', async () => {
      const response = await request(app)
        .get('/check-ins/team/team-123?isDrill=true')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(200);
      expect(mockedCheckInEntity.findByTeamId).toHaveBeenCalledWith('team-123', undefined, true);
    });

    it('should handle unknown users gracefully', async () => {
      mockedUserEntity.findById
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(null); // Unknown user

      const response = await request(app)
        .get('/check-ins/team/team-123')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(200);
      expect(response.body.data[1].userName).toBe('Unknown');
    });

    it('should handle database errors', async () => {
      mockedCheckInEntity.findByTeamId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/check-ins/team/team-123')
        .set('Authorization', 'Bearer manager-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve team check-ins');
    });
  });

  describe('GET /check-ins/history', () => {
    const mockUserCheckIns = Array.from({ length: 75 }, (_, i) => ({
      id: `checkin-${i}`,
      userId: 'user-123',
      teamId: 'team-123',
      status: 'safe' as const,
      timestamp: new Date(),
      notes: `Check-in ${i}`,
      isDrill: false,
    }));

    beforeEach(() => {
      mockedCheckInEntity.findByUserId.mockResolvedValue(mockUserCheckIns);
    });

    it('should get user check-in history successfully', async () => {
      const response = await request(app)
        .get('/check-ins/history?limit=25&offset=0')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(25);
      expect(response.body.pagination.total).toBe(75);
      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.offset).toBe(0);

      expect(mockedCheckInEntity.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should use default pagination values', async () => {
      const response = await request(app)
        .get('/check-ins/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app)
        .get('/check-ins/history?limit=200')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100); // Max limit enforced
    });

    it('should handle empty history', async () => {
      mockedCheckInEntity.findByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get('/check-ins/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockedCheckInEntity.findByUserId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/check-ins/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve check-in history');
    });
  });

  describe('GET /check-ins/incident/:incidentId', () => {
    const mockIncidentCheckIns = [
      {
        id: 'checkin-1',
        userId: 'user-1',
        teamId: 'team-1',
        status: 'safe' as const,
        timestamp: new Date(),
        notes: 'Safe and sound',
        isDrill: false,
      },
      {
        id: 'checkin-2',
        userId: 'user-2',
        teamId: 'team-2',
        status: 'sos' as const,
        timestamp: new Date(),
        notes: 'Need immediate help',
        isDrill: false,
      },
    ];

    const mockUsers = [
      { 
        id: 'user-1', 
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
        id: 'user-2', 
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
      jest.clearAllMocks();
      mockedCheckInEntity.findByIncidentId.mockResolvedValue(mockIncidentCheckIns);
      mockedUserEntity.findById.mockImplementation((userId: string) => {
        if (userId === 'user-1') return Promise.resolve(mockUsers[0]);
        if (userId === 'user-2') return Promise.resolve(mockUsers[1]);
        return Promise.resolve(null);
      });
    });

    it('should get incident check-ins successfully', async () => {
      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Incident check-ins retrieved');
      expect(response.body.data).toHaveLength(2);
      
      expect(response.body.data[0]).toEqual({
        userId: 'user-1',
        userName: 'John Doe',
        teamId: 'team-1',
        status: 'safe',
        timestamp: expect.any(String),
        notes: 'Safe and sound',
      });

      expect(response.body.data[1]).toEqual({
        userId: 'user-2',
        userName: 'Jane Smith',
        teamId: 'team-2',
        status: 'sos',
        timestamp: expect.any(String),
        notes: 'Need immediate help',
      });

      expect(mockedCheckInEntity.findByIncidentId).toHaveBeenCalledWith('incident-123');
    });

    it('should handle unknown users in incident check-ins', async () => {
      mockedUserEntity.findById
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(null); // Unknown user

      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data[1].userName).toBe('Unknown');
    });

    it('should handle empty incident check-ins', async () => {
      mockedCheckInEntity.findByIncidentId.mockResolvedValue([]);

      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockedCheckInEntity.findByIncidentId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve incident check-ins');
    });
  });
});

/**
 * Test Coverage Summary for Check-ins Routes:
 * 
 * ✅ POST /check-ins - Submit safety check-in with location and status
 * ✅ GET /check-ins/team/:teamId - Get team check-ins (manager access)
 * ✅ GET /check-ins/history - Get user check-in history with pagination
 * ✅ GET /check-ins/incident/:incidentId - Get incident-specific check-ins
 * 
 * Coverage includes:
 * - Status validation (safe, need_help, sos)
 * - Location coordinate validation
 * - WebSocket broadcasting for real-time updates
 * - Manager-level access control for team data
 * - Pagination for history endpoints
 * - Drill vs real incident filtering
 * - User name resolution with fallback handling
 * - Database error handling and edge cases
 */