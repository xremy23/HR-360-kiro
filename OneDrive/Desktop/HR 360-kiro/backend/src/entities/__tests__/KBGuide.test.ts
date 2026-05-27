import { KBGuideEntity, KBGuide } from '../KBGuide';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('KBGuideEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new KB guide successfully', async () => {
      const guideData = {
        orgId: 'org-123',
        title: 'Emergency Evacuation Procedures',
        category: 'org-specific' as const,
        type: 'evacuation',
        content: 'In case of emergency, follow these steps...',
        mediaUrls: ['https://example.com/video1.mp4', 'https://example.com/image1.jpg'],
        isRequired: true,
        createdBy: 'user-123',
        updatedBy: 'user-123',
      };

      const expectedGuide: KBGuide = {
        id: 'guide-123',
        ...guideData,
        version: 1,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.create(guideData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO kb_guides'),
        [
          guideData.orgId,
          guideData.title,
          guideData.category,
          guideData.type,
          guideData.content,
          guideData.mediaUrls,
          guideData.isRequired,
          guideData.createdBy,
          guideData.updatedBy,
        ]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should create a guide without media URLs', async () => {
      const guideData = {
        orgId: 'org-123',
        title: 'General Safety Guidelines',
        category: 'general' as const,
        type: 'safety',
        content: 'General safety guidelines for all employees...',
        isRequired: false,
        createdBy: 'user-456',
        updatedBy: 'user-456',
      };

      const expectedGuide: KBGuide = {
        id: 'guide-456',
        ...guideData,
        version: 1,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.create(guideData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO kb_guides'),
        [
          guideData.orgId,
          guideData.title,
          guideData.category,
          guideData.type,
          guideData.content,
          undefined, // mediaUrls
          guideData.isRequired,
          guideData.createdBy,
          guideData.updatedBy,
        ]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should handle database errors during creation', async () => {
      const guideData = {
        orgId: 'org-123',
        title: 'Test Guide',
        category: 'general' as const,
        type: 'test',
        content: 'Test content',
        isRequired: false,
        createdBy: 'user-123',
        updatedBy: 'user-123',
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(KBGuideEntity.create(guideData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find KB guide by id successfully', async () => {
      const guideId = 'guide-123';
      const expectedGuide: KBGuide = {
        id: guideId,
        orgId: 'org-123',
        title: 'Emergency Evacuation Procedures',
        category: 'org-specific',
        type: 'evacuation',
        content: 'In case of emergency, follow these steps...',
        mediaUrls: ['https://example.com/video1.mp4'],
        isRequired: true,
        version: 1,
        createdBy: 'user-123',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
        updatedBy: 'user-123',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.findById(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id as "orgId"'),
        [guideId]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should return null when guide not found', async () => {
      const guideId = 'nonexistent-guide';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await KBGuideEntity.findById(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id as "orgId"'),
        [guideId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const guideId = 'guide-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(KBGuideEntity.findById(guideId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByOrgId', () => {
    it('should find all guides for an organization', async () => {
      const orgId = 'org-123';
      const expectedGuides: KBGuide[] = [
        {
          id: 'guide-1',
          orgId,
          title: 'Emergency Procedures',
          category: 'org-specific',
          type: 'emergency',
          content: 'Emergency procedures...',
          isRequired: true,
          version: 1,
          createdBy: 'user-123',
          createdAt: new Date('2026-05-27T10:00:00Z'),
          updatedAt: new Date('2026-05-27T10:00:00Z'),
          updatedBy: 'user-123',
        },
        {
          id: 'guide-2',
          orgId,
          title: 'General Safety',
          category: 'general',
          type: 'safety',
          content: 'General safety guidelines...',
          isRequired: false,
          version: 1,
          createdBy: 'user-456',
          createdAt: new Date('2026-05-26T15:00:00Z'),
          updatedAt: new Date('2026-05-26T15:00:00Z'),
          updatedBy: 'user-456',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedGuides,
        rowCount: 2,
      } as any);

      const result = await KBGuideEntity.findByOrgId(orgId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM kb_guides WHERE org_id = $1'),
        [orgId, 50, 0] // default limit and offset
      );
      expect(result).toEqual(expectedGuides);
    });

    it('should find guides filtered by category', async () => {
      const orgId = 'org-123';
      const category = 'org-specific';
      const expectedGuides: KBGuide[] = [
        {
          id: 'guide-1',
          orgId,
          title: 'Emergency Procedures',
          category: 'org-specific',
          type: 'emergency',
          content: 'Emergency procedures...',
          isRequired: true,
          version: 1,
          createdBy: 'user-123',
          createdAt: new Date('2026-05-27T10:00:00Z'),
          updatedAt: new Date('2026-05-27T10:00:00Z'),
          updatedBy: 'user-123',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedGuides,
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.findByOrgId(orgId, category);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND category = $2'),
        [orgId, category, 50, 0]
      );
      expect(result).toEqual(expectedGuides);
    });

    it('should find guides filtered by type', async () => {
      const orgId = 'org-123';
      const type = 'safety';
      const expectedGuides: KBGuide[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedGuides,
        rowCount: 0,
      } as any);

      const result = await KBGuideEntity.findByOrgId(orgId, undefined, type);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND type = $2'),
        [orgId, type, 50, 0]
      );
      expect(result).toEqual(expectedGuides);
    });

    it('should find guides filtered by category and type', async () => {
      const orgId = 'org-123';
      const category = 'general';
      const type = 'safety';
      const expectedGuides: KBGuide[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedGuides,
        rowCount: 0,
      } as any);

      const result = await KBGuideEntity.findByOrgId(orgId, category, type);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND category = $2'),
        [orgId, category, type, 50, 0]
      );
      expect(result).toEqual(expectedGuides);
    });

    it('should find guides with custom limit and offset', async () => {
      const orgId = 'org-123';
      const limit = 10;
      const offset = 20;
      const expectedGuides: KBGuide[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedGuides,
        rowCount: 0,
      } as any);

      const result = await KBGuideEntity.findByOrgId(orgId, undefined, undefined, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [orgId, limit, offset]
      );
      expect(result).toEqual(expectedGuides);
    });

    it('should handle database errors during findByOrgId', async () => {
      const orgId = 'org-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(KBGuideEntity.findByOrgId(orgId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('countByOrgId', () => {
    it('should count all guides for an organization', async () => {
      const orgId = 'org-123';
      const expectedCount = 25;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.countByOrgId(orgId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM kb_guides WHERE org_id = $1'),
        [orgId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should count guides filtered by category', async () => {
      const orgId = 'org-123';
      const category = 'org-specific';
      const expectedCount = 10;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.countByOrgId(orgId, category);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND category = $2'),
        [orgId, category]
      );
      expect(result).toBe(expectedCount);
    });

    it('should count guides filtered by type', async () => {
      const orgId = 'org-123';
      const type = 'safety';
      const expectedCount = 5;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.countByOrgId(orgId, undefined, type);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND type = $2'),
        [orgId, type]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no guides found', async () => {
      const orgId = 'org-456';

      mockQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.countByOrgId(orgId);

      expect(result).toBe(0);
    });

    it('should handle database errors during countByOrgId', async () => {
      const orgId = 'org-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(KBGuideEntity.countByOrgId(orgId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update guide title successfully', async () => {
      const guideId = 'guide-123';
      const updatedBy = 'user-456';
      const updateData = { title: 'Updated Emergency Procedures' };

      const expectedGuide: KBGuide = {
        id: guideId,
        orgId: 'org-123',
        title: 'Updated Emergency Procedures',
        category: 'org-specific',
        type: 'emergency',
        content: 'Emergency procedures...',
        isRequired: true,
        version: 2,
        createdBy: 'user-123',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
        updatedBy: 'user-456',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.update(guideId, updateData, updatedBy);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE kb_guides SET title = $1, version = version + 1'),
        ['Updated Emergency Procedures', updatedBy, guideId]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should update guide content successfully', async () => {
      const guideId = 'guide-123';
      const updatedBy = 'user-456';
      const updateData = { content: 'Updated emergency procedures content...' };

      const expectedGuide: KBGuide = {
        id: guideId,
        orgId: 'org-123',
        title: 'Emergency Procedures',
        category: 'org-specific',
        type: 'emergency',
        content: 'Updated emergency procedures content...',
        isRequired: true,
        version: 2,
        createdBy: 'user-123',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
        updatedBy: 'user-456',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.update(guideId, updateData, updatedBy);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE kb_guides SET content = $1, version = version + 1'),
        ['Updated emergency procedures content...', updatedBy, guideId]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should update guide required status successfully', async () => {
      const guideId = 'guide-123';
      const updatedBy = 'user-456';
      const updateData = { isRequired: false };

      const expectedGuide: KBGuide = {
        id: guideId,
        orgId: 'org-123',
        title: 'Emergency Procedures',
        category: 'org-specific',
        type: 'emergency',
        content: 'Emergency procedures...',
        isRequired: false,
        version: 2,
        createdBy: 'user-123',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
        updatedBy: 'user-456',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.update(guideId, updateData, updatedBy);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE kb_guides SET is_required = $1, version = version + 1'),
        [false, updatedBy, guideId]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should update multiple fields successfully', async () => {
      const guideId = 'guide-123';
      const updatedBy = 'user-456';
      const updateData = { 
        title: 'Updated Title',
        content: 'Updated content...',
        isRequired: false 
      };

      const expectedGuide: KBGuide = {
        id: guideId,
        orgId: 'org-123',
        title: 'Updated Title',
        category: 'org-specific',
        type: 'emergency',
        content: 'Updated content...',
        isRequired: false,
        version: 2,
        createdBy: 'user-123',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T11:00:00Z'),
        updatedBy: 'user-456',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.update(guideId, updateData, updatedBy);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE kb_guides SET title = $1, content = $2, is_required = $3, version = version + 1'),
        ['Updated Title', 'Updated content...', false, updatedBy, guideId]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should return existing guide when no updates provided', async () => {
      const guideId = 'guide-123';
      const updatedBy = 'user-456';
      const updateData = {};

      const expectedGuide: KBGuide = {
        id: guideId,
        orgId: 'org-123',
        title: 'Emergency Procedures',
        category: 'org-specific',
        type: 'emergency',
        content: 'Emergency procedures...',
        isRequired: true,
        version: 1,
        createdBy: 'user-123',
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
        updatedBy: 'user-123',
      };

      // Mock findById call
      mockQuery.mockResolvedValue({
        rows: [expectedGuide],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.update(guideId, updateData, updatedBy);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id as "orgId"'),
        [guideId]
      );
      expect(result).toEqual(expectedGuide);
    });

    it('should return null when guide not found for update', async () => {
      const guideId = 'nonexistent-guide';
      const updatedBy = 'user-456';
      const updateData = { title: 'Updated Title' };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await KBGuideEntity.update(guideId, updateData, updatedBy);

      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      const guideId = 'guide-123';
      const updatedBy = 'user-456';
      const updateData = { title: 'Updated Title' };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(KBGuideEntity.update(guideId, updateData, updatedBy)).rejects.toThrow('Database connection failed');
    });
  });

  describe('delete', () => {
    it('should delete guide successfully', async () => {
      const guideId = 'guide-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      const result = await KBGuideEntity.delete(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM kb_guides WHERE id = $1',
        [guideId]
      );
      expect(result).toBe(true);
    });

    it('should return false when guide not found for deletion', async () => {
      const guideId = 'nonexistent-guide';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await KBGuideEntity.delete(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM kb_guides WHERE id = $1',
        [guideId]
      );
      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      const guideId = 'guide-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(KBGuideEntity.delete(guideId)).rejects.toThrow('Database connection failed');
    });
  });
});