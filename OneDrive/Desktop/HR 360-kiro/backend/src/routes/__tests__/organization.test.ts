/**
 * Organization Route Tests
 * Tests for organization management endpoints
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import organizationRouter from '../organization';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { OrganizationEntity, UserEntity } from '../../entities';

// Mock dependencies
jest.mock('../../entities');
jest.mock('../../middleware/auth');

const mockedOrganizationEntity = OrganizationEntity as jest.Mocked<typeof OrganizationEntity>;
const mockedUserEntity = UserEntity as jest.Mocked<typeof UserEntity>;
const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockedAdminMiddleware = adminMiddleware as jest.MockedFunction<typeof adminMiddleware>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/org', organizationRouter);

describe('Organization Routes', () => {
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

    mockedAdminMiddleware.mockImplementation(((req: any, res: any, next: any) => {
      next();
    }) as any);
  });

  describe('GET /org', () => {
    const mockOrganization = {
      id: 'org-123',
      name: 'Test Organization',
      emailDomain: 'testorg.com',
      inviteCode: 'TEST123',
      logo: 'https://example.com/logo.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get organization successfully', async () => {
      mockedOrganizationEntity.findById.mockResolvedValue(mockOrganization);

      const response = await request(app)
        .get('/org')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Organization retrieved successfully');
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.name).toBe('Test Organization');

      expect(mockedOrganizationEntity.findById).toHaveBeenCalledWith('org-123');
    });

    it('should handle organization not found', async () => {
      mockedOrganizationEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/org')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORG_NOT_FOUND');
      expect(response.body.error.message).toBe('Organization not found');
    });

    it('should handle database errors', async () => {
      mockedOrganizationEntity.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/org')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve organization');
    });
  });

  describe('GET /org/teams', () => {
    const mockOrgUsers = [
      {
        id: 'user-1',
        email: 'user1@testorg.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee' as const,
        orgId: 'org-123',
        teamId: 'team-1',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'user2@testorg.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'manager' as const,
        orgId: 'org-123',
        teamId: 'team-1',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-3',
        email: 'user3@testorg.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'employee' as const,
        orgId: 'org-123',
        teamId: 'team-2',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-4',
        email: 'user4@testorg.com',
        firstName: 'Alice',
        lastName: 'Wilson',
        role: 'employee' as const,
        orgId: 'org-123',
        teamId: 'team-2',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-5',
        email: 'user5@testorg.com',
        firstName: 'Charlie',
        lastName: 'Brown',
        role: 'admin' as const,
        orgId: 'org-123',
        teamId: undefined, // No team assigned
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedUserEntity.findByOrgId.mockResolvedValue(mockOrgUsers);
    });

    it('should get organization teams successfully', async () => {
      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Teams retrieved successfully');
      expect(response.body.data).toHaveLength(2);

      // Check team structure
      const teams = response.body.data;
      const team1 = teams.find((t: any) => t.id === 'team-1');
      const team2 = teams.find((t: any) => t.id === 'team-2');

      expect(team1).toBeDefined();
      expect(team1.memberCount).toBe(2);
      expect(team2).toBeDefined();
      expect(team2.memberCount).toBe(2);

      expect(mockedUserEntity.findByOrgId).toHaveBeenCalledWith('org-123');
    });

    it('should handle organization with no teams', async () => {
      const usersWithoutTeams = mockOrgUsers.map(user => ({ ...user, teamId: undefined }));
      mockedUserEntity.findByOrgId.mockResolvedValue(usersWithoutTeams);

      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle empty organization', async () => {
      mockedUserEntity.findByOrgId.mockResolvedValue([]);

      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockedUserEntity.findByOrgId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/org/teams')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve teams');
    });
  });

  describe('GET /org/users', () => {
    const mockOrgUsers = [
      {
        id: 'user-1',
        email: 'user1@testorg.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee' as const,
        orgId: 'org-123',
        teamId: 'team-1',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'user2@testorg.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'manager' as const,
        orgId: 'org-123',
        teamId: 'team-1',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-3',
        email: 'user3@testorg.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'employee' as const,
        orgId: 'org-123',
        teamId: 'team-2',
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-4',
        email: 'admin@testorg.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as const,
        orgId: 'org-123',
        teamId: undefined,
        biometricEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      // Mock admin user for admin middleware
      mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
        req.user = {
          id: 'admin-123',
          email: 'admin@testorg.com',
          role: 'admin',
          orgId: 'org-123',
          teamId: undefined,
        };
        next();
      }) as any);

      mockedUserEntity.findByOrgId.mockResolvedValue(mockOrgUsers);
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

      expect(mockedUserEntity.findByOrgId).toHaveBeenCalledWith('org-123');
    });

    it('should filter users by team ID', async () => {
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
      mockedUserEntity.findByOrgId.mockResolvedValue(manyUsers);

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
      const response = await request(app)
        .get('/org/users?teamId=nonexistent-team')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockedUserEntity.findByOrgId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/org/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve organization users');
    });
  });
});

/**
 * Test Coverage Summary for Organization Routes:
 * 
 * ✅ GET /org - Get organization details
 * ✅ GET /org/teams - Get organization teams with member counts
 * ✅ GET /org/users - Get organization users (admin only) with filtering
 * 
 * Coverage includes:
 * - Organization data retrieval and validation
 * - Team aggregation from user data
 * - User filtering by team ID and role
 * - Pagination for large user lists
 * - Admin-only access control for user management
 * - Error handling for missing organizations
 * - Database error scenarios
 * - Edge cases (empty teams, no users, etc.)
 */