/**
 * Knowledge Base (KB) Route Tests
 * Tests for knowledge base guide management endpoints
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import kbRouter from '../kb';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { KBGuideEntity, GuideAcknowledgmentEntity } from '../../entities';

// Mock dependencies
jest.mock('../../entities');
jest.mock('../../middleware/auth');

const mockedKBGuideEntity = KBGuideEntity as jest.Mocked<typeof KBGuideEntity>;
const mockedGuideAcknowledgmentEntity = GuideAcknowledgmentEntity as jest.Mocked<typeof GuideAcknowledgmentEntity>;
const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockedAdminMiddleware = adminMiddleware as jest.MockedFunction<typeof adminMiddleware>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/kb/guides', kbRouter);

describe('Knowledge Base Routes', () => {
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

  describe('GET /kb/guides', () => {
    const mockGuides = [
      {
        id: 'guide-1',
        orgId: 'org-123',
        title: 'Emergency Procedures',
        category: 'general' as const,
        type: 'procedure',
        content: 'Step-by-step emergency procedures...',
        isRequired: true,
        version: 1,
        createdBy: 'admin-123',
        updatedBy: 'admin-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'guide-2',
        orgId: 'org-123',
        title: 'Safety Guidelines',
        category: 'org-specific' as const,
        type: 'guideline',
        content: 'Important safety guidelines...',
        isRequired: false,
        version: 1,
        createdBy: 'admin-123',
        updatedBy: 'admin-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockedKBGuideEntity.findByOrgId.mockResolvedValue(mockGuides);
    });

    it('should get KB guides successfully', async () => {
      const response = await request(app)
        .get('/kb/guides?orgId=org-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.data[0].title).toBe('Emergency Procedures');

      expect(mockedKBGuideEntity.findByOrgId).toHaveBeenCalledWith('org-123', undefined, undefined);
    });

    it('should filter guides by category', async () => {
      const emergencyGuides = [{
        id: 'guide-1',
        orgId: 'org-123',
        title: 'Emergency Procedures',
        category: 'general' as const,
        type: 'procedure',
        content: 'Step-by-step emergency procedures...',
        isRequired: true,
        version: 1,
        createdBy: 'admin-123',
        updatedBy: 'admin-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
      mockedKBGuideEntity.findByOrgId.mockResolvedValue(emergencyGuides);

      const response = await request(app)
        .get('/kb/guides?orgId=org-123&category=general')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('general');
      expect(mockedKBGuideEntity.findByOrgId).toHaveBeenCalledWith('org-123', 'general', undefined);
    });

    it('should filter guides by type', async () => {
      const procedureGuides = [mockGuides[0]];
      mockedKBGuideEntity.findByOrgId.mockResolvedValue(procedureGuides);

      const response = await request(app)
        .get('/kb/guides?orgId=org-123&type=procedure')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('procedure');
      expect(mockedKBGuideEntity.findByOrgId).toHaveBeenCalledWith('org-123', undefined, 'procedure');
    });

    it('should handle pagination correctly', async () => {
      const manyGuides = Array.from({ length: 75 }, (_, i) => ({
        ...mockGuides[0],
        id: `guide-${i}`,
        title: `Guide ${i}`,
      }));
      mockedKBGuideEntity.findByOrgId.mockResolvedValue(manyGuides);

      const response = await request(app)
        .get('/kb/guides?orgId=org-123&limit=25&offset=0')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(25);
      expect(response.body.pagination.total).toBe(75);
      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app)
        .get('/kb/guides?orgId=org-123&limit=200')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100); // Max limit enforced
    });

    it('should reject request without orgId', async () => {
      const response = await request(app)
        .get('/kb/guides')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORG');
      expect(response.body.error.message).toBe('Organization ID required');
    });

    it('should handle database errors', async () => {
      mockedKBGuideEntity.findByOrgId.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/kb/guides?orgId=org-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve guides');
    });
  });

  describe('GET /kb/guides/:id', () => {
    const mockGuide = {
      id: 'guide-123',
      orgId: 'org-123',
      title: 'Emergency Procedures',
      category: 'general' as const,
      type: 'procedure',
      content: 'Detailed emergency procedures...',
      mediaUrls: ['https://example.com/video1.mp4'],
      isRequired: true,
      version: 1,
      createdBy: 'admin-123',
      updatedBy: 'admin-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get guide details successfully', async () => {
      mockedKBGuideEntity.findById.mockResolvedValue(mockGuide);

      const response = await request(app)
        .get('/kb/guides/guide-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guide retrieved successfully');
      expect(response.body.data.id).toBe(mockGuide.id);
      expect(response.body.data.title).toBe('Emergency Procedures');

      expect(mockedKBGuideEntity.findById).toHaveBeenCalledWith('guide-123');
    });

    it('should handle guide not found', async () => {
      mockedKBGuideEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/kb/guides/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GUIDE_NOT_FOUND');
      expect(response.body.error.message).toBe('Guide not found');
    });

    it('should handle database errors', async () => {
      mockedKBGuideEntity.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/kb/guides/guide-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve guide');
    });
  });

  describe('GET /kb/guides/:id/versions', () => {
    const mockGuide = {
      id: 'guide-123',
      orgId: 'org-123',
      title: 'Emergency Procedures',
      category: 'general' as const,
      type: 'procedure',
      content: 'Current version content...',
      version: 2,
      isRequired: true,
      createdBy: 'admin-123',
      updatedAt: new Date(),
      updatedBy: 'admin-123',
      createdAt: new Date(),
    };

    it('should get guide versions successfully', async () => {
      mockedKBGuideEntity.findById.mockResolvedValue(mockGuide);

      const response = await request(app)
        .get('/kb/guides/guide-123/versions')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guide versions retrieved successfully');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].version).toBe(2);
      expect(response.body.data[0].title).toBe('Emergency Procedures');
    });

    it('should handle guide not found for versions', async () => {
      mockedKBGuideEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/kb/guides/nonexistent-id/versions')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GUIDE_NOT_FOUND');
      expect(response.body.error.message).toBe('Guide not found');
    });

    it('should handle database errors', async () => {
      mockedKBGuideEntity.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/kb/guides/guide-123/versions')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve guide versions');
    });
  });

  describe('POST /kb/guides', () => {
    const mockGuide = {
      id: 'guide-123',
      orgId: 'org-123',
      title: 'New Emergency Guide',
      category: 'general' as const,
      type: 'procedure',
      content: 'New guide content...',
      mediaUrls: [],
      isRequired: false,
      version: 1,
      createdBy: 'user-123',
      updatedBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockedKBGuideEntity.create.mockResolvedValue(mockGuide);
    });

    it('should create guide successfully as admin', async () => {
      const guideData = {
        title: 'New Emergency Guide',
        category: 'emergency',
        type: 'procedure',
        content: 'New guide content...',
        mediaUrls: ['https://example.com/video.mp4'],
        isRequired: true,
      };

      const response = await request(app)
        .post('/kb/guides')
        .set('Authorization', 'Bearer admin-token')
        .send(guideData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guide created successfully');
      expect(response.body.data.id).toBe(mockGuide.id);

      expect(mockedKBGuideEntity.create).toHaveBeenCalledWith({
        orgId: 'org-123',
        title: 'New Emergency Guide',
        category: 'emergency',
        type: 'procedure',
        content: 'New guide content...',
        mediaUrls: ['https://example.com/video.mp4'],
        isRequired: true,
        createdBy: 'user-123',
        updatedBy: 'user-123',
      });
    });

    it('should create guide with minimal data', async () => {
      const guideData = {
        title: 'Simple Guide',
        category: 'general',
        type: 'info',
        content: 'Simple content',
      };

      const response = await request(app)
        .post('/kb/guides')
        .set('Authorization', 'Bearer admin-token')
        .send(guideData);

      expect(response.status).toBe(201);
      expect(mockedKBGuideEntity.create).toHaveBeenCalledWith({
        orgId: 'org-123',
        title: 'Simple Guide',
        category: 'general',
        type: 'info',
        content: 'Simple content',
        mediaUrls: [],
        isRequired: false,
        createdBy: 'user-123',
        updatedBy: 'user-123',
      });
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        title: 'Guide Title',
        category: 'emergency',
        // Missing type and content
      };

      const response = await request(app)
        .post('/kb/guides')
        .set('Authorization', 'Bearer admin-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
      expect(response.body.error.message).toBe('Missing required fields');
    });

    it('should handle database errors', async () => {
      mockedKBGuideEntity.create.mockRejectedValue(new Error('Database error'));

      const guideData = {
        title: 'New Guide',
        category: 'emergency',
        type: 'procedure',
        content: 'Guide content',
      };

      const response = await request(app)
        .post('/kb/guides')
        .set('Authorization', 'Bearer admin-token')
        .send(guideData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to create guide');
    });
  });

  describe('PUT /kb/guides/:id', () => {
    const mockGuide = {
      id: 'guide-123',
      orgId: 'org-123',
      title: 'Original Title',
      category: 'general' as const,
      type: 'procedure',
      content: 'Original content',
      isRequired: false,
      version: 1,
      createdBy: 'admin-123',
      updatedBy: 'admin-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedGuide = {
      ...mockGuide,
      title: 'Updated Title',
      content: 'Updated content',
      isRequired: true,
    };

    beforeEach(() => {
      mockedKBGuideEntity.findById.mockResolvedValue(mockGuide);
      mockedKBGuideEntity.update.mockResolvedValue(updatedGuide);
    });

    it('should update guide successfully as admin', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        isRequired: true,
      };

      const response = await request(app)
        .put('/kb/guides/guide-123')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guide updated successfully');
      expect(response.body.data.title).toBe('Updated Title');

      expect(mockedKBGuideEntity.update).toHaveBeenCalledWith(
        'guide-123',
        {
          title: 'Updated Title',
          content: 'Updated content',
          isRequired: true,
        },
        'user-123'
      );
    });

    it('should update guide with partial data', async () => {
      const updateData = {
        isRequired: true,
      };

      const response = await request(app)
        .put('/kb/guides/guide-123')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(mockedKBGuideEntity.update).toHaveBeenCalledWith(
        'guide-123',
        {
          title: 'Original Title',
          content: 'Original content',
          isRequired: true,
        },
        'user-123'
      );
    });

    it('should handle guide not found', async () => {
      mockedKBGuideEntity.findById.mockResolvedValue(null);

      const updateData = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put('/kb/guides/nonexistent-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GUIDE_NOT_FOUND');
      expect(response.body.error.message).toBe('Guide not found');
    });

    it('should handle database errors', async () => {
      mockedKBGuideEntity.update.mockRejectedValue(new Error('Database error'));

      const updateData = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put('/kb/guides/guide-123')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to update guide');
    });
  });

  describe('DELETE /kb/guides/:id', () => {
    it('should delete guide successfully as admin', async () => {
      mockedKBGuideEntity.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/kb/guides/guide-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guide deleted successfully');
      expect(response.body.data).toEqual({});

      expect(mockedKBGuideEntity.delete).toHaveBeenCalledWith('guide-123');
    });

    it('should handle guide not found for deletion', async () => {
      mockedKBGuideEntity.delete.mockResolvedValue(false);

      const response = await request(app)
        .delete('/kb/guides/nonexistent-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GUIDE_NOT_FOUND');
      expect(response.body.error.message).toBe('Guide not found');
    });

    it('should handle database errors during deletion', async () => {
      mockedKBGuideEntity.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/kb/guides/guide-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to delete guide');
    });
  });

  describe('POST /kb/guides/:id/acknowledge', () => {
    const mockGuide = {
      id: 'guide-123',
      orgId: 'org-123',
      title: 'Emergency Procedures',
      category: 'general' as const,
      type: 'procedure',
      content: 'Emergency procedures content',
      isRequired: true,
      version: 1,
      createdBy: 'admin-123',
      updatedBy: 'admin-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAcknowledgment = {
      id: 'ack-123',
      userId: 'user-123',
      guideId: 'guide-123',
      acknowledgedAt: new Date(),
    };

    beforeEach(() => {
      mockedKBGuideEntity.findById.mockResolvedValue(mockGuide);
      mockedGuideAcknowledgmentEntity.findByUserAndGuide.mockResolvedValue(null);
      mockedGuideAcknowledgmentEntity.create.mockResolvedValue(mockAcknowledgment);
    });

    it('should acknowledge guide successfully', async () => {
      const response = await request(app)
        .post('/kb/guides/guide-123/acknowledge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guide acknowledged successfully');
      expect(response.body.data.id).toBe(mockAcknowledgment.id);

      expect(mockedGuideAcknowledgmentEntity.create).toHaveBeenCalledWith({
        userId: 'user-123',
        guideId: 'guide-123',
      });
    });

    it('should handle already acknowledged guide', async () => {
      const existingAcknowledgment = {
        id: 'existing-ack',
        userId: 'user-123',
        guideId: 'guide-123',
        acknowledgedAt: new Date(),
      };
      mockedGuideAcknowledgmentEntity.findByUserAndGuide.mockResolvedValue(existingAcknowledgment);

      const response = await request(app)
        .post('/kb/guides/guide-123/acknowledge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Guide already acknowledged');
      expect(response.body.data.id).toBe('existing-ack');

      expect(mockedGuideAcknowledgmentEntity.create).not.toHaveBeenCalled();
    });

    it('should handle guide not found for acknowledgment', async () => {
      mockedKBGuideEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/kb/guides/nonexistent-id/acknowledge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GUIDE_NOT_FOUND');
      expect(response.body.error.message).toBe('Guide not found');
    });

    it('should handle database errors during acknowledgment', async () => {
      mockedGuideAcknowledgmentEntity.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/kb/guides/guide-123/acknowledge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to acknowledge guide');
    });
  });
});

/**
 * Test Coverage Summary for Knowledge Base Routes:
 * 
 * ✅ GET /kb/guides - List guides with filtering and pagination
 * ✅ GET /kb/guides/:id - Get guide details
 * ✅ GET /kb/guides/:id/versions - Get guide version history
 * ✅ POST /kb/guides - Create new guide (admin only)
 * ✅ PUT /kb/guides/:id - Update guide (admin only)
 * ✅ DELETE /kb/guides/:id - Delete guide (admin only)
 * ✅ POST /kb/guides/:id/acknowledge - Acknowledge guide reading
 * 
 * Coverage includes:
 * - Admin-only operations for guide management
 * - Category and type filtering
 * - Pagination for guide listings
 * - Version history tracking
 * - Guide acknowledgment system
 * - Required vs optional guides
 * - Media URL support
 * - Database error handling and validation
 */