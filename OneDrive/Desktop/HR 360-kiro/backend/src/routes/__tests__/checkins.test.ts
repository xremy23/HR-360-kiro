/**
 * Check-ins Route Tests
 * Tests for safety check-in endpoints
 */

import request from 'supertest';
import express from 'express';
import { checkInService } from '../../services/checkInService';
import { userService } from '../../services/userService';
import { authMiddleware } from '../../middleware/authMiddleware';
import { CheckIn } from '../../entities/CheckIn';
import { User } from '../../entities/User';
import { getWebSocketServer } from '../../websocket/server';

// Mock services BEFORE importing router
jest.mock('../../services/checkInService');
jest.mock('../../services/userService');
jest.mock('../../middleware/authMiddleware', () => ({
  authMiddleware: {
    verifyToken: jest.fn(),
    requireRole: jest.fn(() => (req: any, res: any, next: any) => next())
  }
}));
jest.mock('../../websocket/server');

const mockedCheckInService = checkInService as jest.Mocked<typeof checkInService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedAuthMiddleware = authMiddleware as jest.Mocked<typeof authMiddleware>;
const mockedGetWebSocketServer = getWebSocketServer as jest.MockedFunction<typeof getWebSocketServer>;

// Import checkins router after mocking
import checkinsRouter from '../checkins';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/check-ins', checkinsRouter);

// Mock WebSocket server
const mockWsServer = {
  broadcastCheckInCreated: jest.fn(),
};

describe.skip('Check-ins Routes', () => {
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
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('POST /check-ins', () => {
    beforeEach(() => {
      mockedCheckInService.createCheckIn.mockResolvedValue(mockCheckIn as any);
      mockedUserService.getUserById.mockResolvedValue(mockUser);
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
      expect(response.body.data.id).toBe(mockCheckIn.id);

      expect(mockedCheckInService.createCheckIn).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe',
        notes: 'All good here',
      }));
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
      expect(mockedCheckInService.createCheckIn).toHaveBeenCalledWith(expect.any(Object));
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
      expect(mockedCheckInService.createCheckIn).toHaveBeenCalledWith(
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
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('should reject invalid coordinates', async () => {
      const checkInData = {
        status: 'safe',
        location: {
          latitude: 200,
          longitude: -74.0060,
        },
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
    });

    it('should handle database errors', async () => {
      mockedCheckInService.createCheckIn.mockRejectedValue(new Error('Database error'));

      const checkInData = {
        status: 'safe',
        notes: 'All good here',
      };

      const response = await request(app)
        .post('/check-ins')
        .set('Authorization', 'Bearer valid-token')
        .send(checkInData);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });

  describe('GET /check-ins/team/:teamId', () => {
    const mockCheckIns: CheckIn[] = [
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

    const mockUsers: User[] = [
      {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1111',
        role: 'employee' as const,
        organizationId: 'org-123',
        departmentId: 'dept-1',
        teamId: 'team-123',
        position: 'Engineer',
        address: '123 Main St',
        personalEmergencyContact: 'Contact 1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-2222',
        role: 'employee' as const,
        organizationId: 'org-123',
        departmentId: 'dept-1',
        teamId: 'team-123',
        position: 'Developer',
        address: '456 Oak Ave',
        personalEmergencyContact: 'Contact 2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedCheckInService.getCheckIns.mockResolvedValue({
        checkIns: mockCheckIns as any[],
        total: mockCheckIns.length,
      });
      mockedUserService.getUserById.mockImplementation((userId: string) => {
        const user = mockUsers.find(u => u.id === userId);
        return Promise.resolve(user || null);
      });
    });

    it('should get team check-ins successfully', async () => {
      const response = await request(app)
        .get('/check-ins/team/team-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      expect(response.body.data[0]).toEqual({
        userId: 'user-1',
        userName: 'John Doe',
        status: 'safe',
        timestamp: expect.any(String),
        notes: 'All good',
      });

      expect(mockedCheckInService.getCheckIns).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('should filter by incident ID', async () => {
      const response = await request(app)
        .get('/check-ins/team/team-123?incidentId=incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedCheckInService.getCheckIns).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('should handle unknown users gracefully', async () => {
      mockedUserService.getUserById
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/check-ins/team/team-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data[1].userName).toBe('Unknown');
    });

    it('should handle database errors', async () => {
      mockedCheckInService.getCheckIns.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/check-ins/team/team-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('SERVER_ERROR');
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
      mockedCheckInService.getCheckInsByUser.mockResolvedValue({
        checkIns: mockUserCheckIns as any[],
        total: mockUserCheckIns.length,
      });
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

      expect(mockedCheckInService.getCheckInsByUser).toHaveBeenCalledWith('user-123', expect.any(Object));
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
      expect(response.body.pagination.limit).toBe(100);
    });

    it('should handle empty history', async () => {
      mockedCheckInService.getCheckInsByUser.mockResolvedValue({
        checkIns: [],
        total: 0,
      });

      const response = await request(app)
        .get('/check-ins/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockedCheckInService.getCheckInsByUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/check-ins/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('SERVER_ERROR');
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

    const mockUsers: User[] = [
      {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1111',
        role: 'employee' as const,
        organizationId: 'org-123',
        departmentId: 'dept-1',
        teamId: 'team-1',
        position: 'Engineer',
        address: '123 Main St',
        personalEmergencyContact: 'Contact 1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-2222',
        role: 'employee' as const,
        organizationId: 'org-123',
        departmentId: 'dept-1',
        teamId: 'team-2',
        position: 'Developer',
        address: '456 Oak Ave',
        personalEmergencyContact: 'Contact 2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedCheckInService.getCheckInsByIncident.mockResolvedValue({
        checkIns: mockIncidentCheckIns as any[],
        total: mockIncidentCheckIns.length
      });
      mockedUserService.getUserById.mockImplementation((userId: string) => {
        const user = mockUsers.find(u => u.id === userId);
        return Promise.resolve(user || null);
      });
    });

    it('should get incident check-ins successfully', async () => {
      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
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

      expect(mockedCheckInService.getCheckInsByIncident).toHaveBeenCalledWith('incident-123');
    });

    it('should handle unknown users in incident check-ins', async () => {
      mockedUserService.getUserById
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data[1].userName).toBe('Unknown');
    });

    it('should handle empty incident check-ins', async () => {
      mockedCheckInService.getCheckInsByIncident.mockResolvedValue({ checkIns: [], total: 0 });

      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockedCheckInService.getCheckInsByIncident.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/check-ins/incident/incident-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('SERVER_ERROR');
    });
  });
});