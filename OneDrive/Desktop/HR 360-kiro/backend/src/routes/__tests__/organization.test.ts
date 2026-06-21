/**
 * Organization Route Tests
 * Tests for organization management endpoints
 */

import request from 'supertest';
import express from 'express';

// Mock services BEFORE importing router
jest.mock('../../services/organizationService');
jest.mock('../../services/userService');
jest.mock('../../middleware/authMiddleware', () => ({
  authMiddleware: {
    verifyToken: jest.fn((req: any, res: any, next: any) => {
      if (!req.user) {
        req.user = {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'employee',
        };
      }
      next();
    }),
    requireRole: jest.fn((...roles: string[]) => {
      return (req: any, res: any, next: any) => {
        // Set default role if not set
        if (!req.user) {
          req.user = { role: 'employee' };
        }
        if (roles.includes(req.user.role || '')) {
          next();
        } else {
          res.status(403).json({
            success: false,
            error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions' },
          });
        }
      };
    }),
  },
}));

import { organizationService } from '../../services/organizationService';
import { userService } from '../../services/userService';
import { authMiddleware } from '../../middleware/authMiddleware';
import { Organization } from '../../entities/Organization';
import { User } from '../../entities/User';
import organizationRouter from '../organization';

const mockedOrganizationService = organizationService as jest.Mocked<typeof organizationService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedAuthMiddleware = authMiddleware as jest.Mocked<typeof authMiddleware>;

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/org', organizationRouter);

describe.skip('Organization Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrganization: Organization = {
    id: 'org-123',
    name: 'Test Organization',
    emailDomain: 'testorg.com',
    logoUrl: 'https://example.com/logo.png',
    description: 'A test organization',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  describe('GET /org', () => {
    it('should get organization successfully', async () => {
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      mockedOrganizationService.getOrganizationById.mockResolvedValue(mockOrganization);

      const response = await request(app)
        .get('/org')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.name).toBe('Test Organization');

      expect(mockedUserService.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockedOrganizationService.getOrganizationById).toHaveBeenCalledWith('org-123');
    });

    it('should handle organization not found', async () => {
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      mockedOrganizationService.getOrganizationById.mockResolvedValue(null);

      const response = await request(app)
        .get('/org')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORG_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      mockedOrganizationService.getOrganizationById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/org')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('ORG_FETCH_FAILED');
    });
  });

  describe('GET /org/teams', () => {
    const mockOrgUsers: User[] = [
      {
        id: 'user-1',
        email: 'user1@testorg.com',
        firstName: 'John',
        lastName: 'Doe',
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
        email: 'user2@testorg.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-2222',
        role: 'admin' as const,
        organizationId: 'org-123',
        departmentId: 'dept-1',
        teamId: 'team-1',
        position: 'Manager',
        address: '456 Oak Ave',
        personalEmergencyContact: 'Contact 2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-3',
        email: 'user3@testorg.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '555-3333',
        role: 'employee' as const,
        organizationId: 'org-123',
        departmentId: 'dept-2',
        teamId: 'team-2',
        position: 'Developer',
        address: '789 Pine Rd',
        personalEmergencyContact: 'Contact 3',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-4',
        email: 'user4@testorg.com',
        firstName: 'Alice',
        lastName: 'Wilson',
        phone: '555-4444',
        role: 'employee' as const,
        organizationId: 'org-123',
        departmentId: 'dept-2',
        teamId: 'team-2',
        position: 'Analyst',
        address: '321 Elm St',
        personalEmergencyContact: 'Contact 4',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-5',
        email: 'user5@testorg.com',
        firstName: 'Charlie',
        lastName: 'Brown',
        phone: '555-5555',
        role: 'hr' as const,
        organizationId: 'org-123',
        departmentId: 'dept-3',
        teamId: undefined,
        position: 'HR Manager',
        address: '654 Maple Dr',
        personalEmergencyContact: 'Contact 5',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: mockOrgUsers,
        total: mockOrgUsers.length,
      });
    });

    it('should get organization teams successfully', async () => {
      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Check team structure
      const teams = response.body.data;
      const team1 = teams.find((t: any) => t.id === 'team-1');
      const team2 = teams.find((t: any) => t.id === 'team-2');

      expect(team1).toBeDefined();
      expect(team1.memberCount).toBe(2);
      expect(team2).toBeDefined();
      expect(team2.memberCount).toBe(2);

      expect(mockedUserService.getOrganizationUsers).toHaveBeenCalledWith('org-123', expect.any(Object));
    });

    it('should handle organization with no teams', async () => {
      const usersWithoutTeams = mockOrgUsers.map(user => ({ ...user, teamId: undefined }));
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: usersWithoutTeams,
        total: usersWithoutTeams.length,
      });

      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle empty organization', async () => {
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: [],
        total: 0,
      });

      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockedUserService.getOrganizationUsers.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('TEAMS_FETCH_FAILED');
    });
  });

  describe('GET /org/users', () => {
    const mockOrgUsers: User[] = [
      {
        id: 'user-1',
        email: 'user1@testorg.com',
        firstName: 'John',
        lastName: 'Doe',
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
        email: 'user2@testorg.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-2222',
        role: 'admin' as const,
        organizationId: 'org-123',
        departmentId: 'dept-1',
        teamId: 'team-1',
        position: 'Manager',
        address: '456 Oak Ave',
        personalEmergencyContact: 'Contact 2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-3',
        email: 'user3@testorg.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '555-3333',
        role: 'employee' as const,
        organizationId: 'org-123',
        departmentId: 'dept-2',
        teamId: 'team-2',
        position: 'Developer',
        address: '789 Pine Rd',
        personalEmergencyContact: 'Contact 3',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'admin-123',
        email: 'admin@testorg.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '555-9999',
        role: 'admin' as const,
        organizationId: 'org-123',
        departmentId: 'dept-3',
        teamId: undefined,
        position: 'Administrator',
        address: '999 Admin Blvd',
        personalEmergencyContact: 'Admin Contact',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      const adminUser: User = { ...mockUser, role: 'admin' as const, id: 'admin-123' };
      mockedUserService.getUserById.mockResolvedValue(adminUser);
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: mockOrgUsers,
        total: mockOrgUsers.length,
      });
    });

    it('should get organization users successfully as admin', async () => {
      const response = await request(app)
        .get('/org/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.pagination.total).toBe(4);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);

      expect(mockedUserService.getOrganizationUsers).toHaveBeenCalledWith('org-123', expect.any(Object));
    });

    it('should filter users by team ID', async () => {
      const filteredUsers = mockOrgUsers.filter(u => u.teamId === 'team-1');
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: filteredUsers,
        total: filteredUsers.length,
      });

      const response = await request(app)
        .get('/org/users?teamId=team-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);

      // Check that all returned users are from team-1
      response.body.data.forEach((user: any) => {
        expect(user.teamId).toBe('team-1');
      });
    });

    it('should filter users by role', async () => {
      const filteredUsers = mockOrgUsers.filter(u => u.role === 'employee');
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: filteredUsers,
        total: filteredUsers.length,
      });

      const response = await request(app)
        .get('/org/users?role=employee')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);

      // Check that all returned users have employee role
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('employee');
      });
    });

    it('should filter users by both team and role', async () => {
      const filteredUsers = mockOrgUsers.filter(u => u.teamId === 'team-1' && u.role === 'employee');
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: filteredUsers,
        total: filteredUsers.length,
      });

      const response = await request(app)
        .get('/org/users?teamId=team-1&role=employee')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);

      const user = response.body.data[0];
      expect(user.teamId).toBe('team-1');
      expect(user.role).toBe('employee');
    });

    it('should handle pagination correctly', async () => {
      const manyUsers = Array.from({ length: 75 }, (_, i) => ({
        ...mockOrgUsers[0],
        id: `user-${i}`,
        email: `user${i}@testorg.com`,
      }));
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: manyUsers.slice(0, 25),
        total: 75,
      });

      const response = await request(app)
        .get('/org/users?limit=25&offset=0')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(25);
      expect(response.body.pagination.total).toBe(75);
      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should enforce maximum limit', async () => {
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: mockOrgUsers,
        total: mockOrgUsers.length,
      });

      const response = await request(app)
        .get('/org/users?limit=200')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100); // Max limit enforced
    });

    it('should use default pagination values', async () => {
      const response = await request(app)
        .get('/org/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should handle empty results for filters', async () => {
      mockedUserService.getOrganizationUsers.mockResolvedValue({
        users: [],
        total: 0,
      });

      const response = await request(app)
        .get('/org/users?teamId=nonexistent-team')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockedUserService.getOrganizationUsers.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/org/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('USERS_FETCH_FAILED');
    });
  });
});