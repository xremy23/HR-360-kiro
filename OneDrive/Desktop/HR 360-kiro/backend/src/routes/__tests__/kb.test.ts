/**
 * Knowledge Base (KB) Route Tests
 * Tests for knowledge base guide management endpoints
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import kbRouter from '../kb';
import { sessionService } from '../../services/sessionService';
import { kbService } from '../../services/kbService';
import { userService } from '../../services/userService';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../services/sessionService');
jest.mock('../../services/kbService');
jest.mock('../../services/userService');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedSessionService = sessionService as jest.Mocked<typeof sessionService>;
const mockedKbService = kbService as jest.Mocked<typeof kbService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/', kbRouter);

describe.skip('Knowledge Base Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env.JWT_SECRET = 'test-jwt-secret-for-kb-testing-32-chars-minimum';
    
    // Mock JWT verify for auth middleware
    mockedJwt.verify.mockImplementation((token: any) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }
      return {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'employee',
      };
    });

    // Mock sessionService methods
    mockedSessionService.isTokenBlacklisted.mockResolvedValue(false);
    mockedSessionService.get.mockResolvedValue(JSON.stringify({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'employee',
      orgId: 'org-123',
      teamId: 'team-123',
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }));
    mockedSessionService.updateSessionActivity.mockResolvedValue(undefined);

    // Mock user service
    mockedUserService.getUserById.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
      organizationId: 'org-123',
      teamId: 'team-123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('GET /guides', () => {
    const mockGuides = [
      {
        id: 'guide-1',
        organizationId: 'org-123',
        title: 'Emergency Procedures',
        description: 'Step-by-step emergency procedures',
        content: 'Step-by-step emergency procedures...',
        category: 'emergency',
          version: 1,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'guide-2',
        organizationId: 'org-123',
        title: 'Safety Guidelines',
        description: 'Important safety guidelines',
        content: 'Important safety guidelines...',
        category: 'safety',
          version: 1,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedKbService.getGuides.mockResolvedValue({
        guides: mockGuides,
        total: mockGuides.length,
      });
    });

    it('should get KB guides successfully', async () => {
      const response = await request(app)
        .get('/guides')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('Emergency Procedures');
    });

    it('should filter guides by search', async () => {
      const filteredGuides = [mockGuides[0]];
      mockedKbService.getGuides.mockResolvedValue({
        guides: filteredGuides,
        total: 1,
      });

      const response = await request(app)
        .get('/guides?search=emergency')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Emergency Procedures');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/guides?page=1&pageSize=20')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockedKbService.getGuides.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/guides')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/guides');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('GET /guides/:id', () => {
    const mockGuide = {
      id: 'guide-1',
      organizationId: 'org-123',
      title: 'Emergency Procedures',
      description: 'Detailed procedures',
      content: 'Full emergency procedure content',
      category: 'emergency',
      version: 1,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get guide details successfully', async () => {
      mockedKbService.getGuideById.mockResolvedValue(mockGuide);

      const response = await request(app)
        .get('/guides/guide-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Emergency Procedures');
    });

    it('should handle guide not found', async () => {
      mockedKbService.getGuideById.mockResolvedValue(null);

      const response = await request(app)
        .get('/guides/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/guides/guide-1');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });
});
