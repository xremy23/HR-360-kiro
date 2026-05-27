import { GuideAcknowledgmentEntity, GuideAcknowledgment } from '../GuideAcknowledgment';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('GuideAcknowledgmentEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new guide acknowledgment successfully', async () => {
      const acknowledgmentData = {
        userId: 'user-123',
        guideId: 'guide-456',
      };

      const expectedAcknowledgment: GuideAcknowledgment = {
        id: 'ack-123',
        ...acknowledgmentData,
        acknowledgedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedAcknowledgment],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.create(acknowledgmentData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO guide_acknowledgments'),
        [acknowledgmentData.userId, acknowledgmentData.guideId]
      );
      expect(result).toEqual(expectedAcknowledgment);
    });

    it('should handle database errors during creation', async () => {
      const acknowledgmentData = {
        userId: 'user-123',
        guideId: 'guide-456',
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.create(acknowledgmentData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find acknowledgment by id successfully', async () => {
      const acknowledgmentId = 'ack-123';
      const expectedAcknowledgment: GuideAcknowledgment = {
        id: acknowledgmentId,
        userId: 'user-123',
        guideId: 'guide-456',
        acknowledgedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedAcknowledgment],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.findById(acknowledgmentId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [acknowledgmentId]
      );
      expect(result).toEqual(expectedAcknowledgment);
    });

    it('should return null when acknowledgment not found', async () => {
      const acknowledgmentId = 'nonexistent-ack';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await GuideAcknowledgmentEntity.findById(acknowledgmentId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [acknowledgmentId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const acknowledgmentId = 'ack-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.findById(acknowledgmentId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserAndGuide', () => {
    it('should find acknowledgment by user and guide successfully', async () => {
      const userId = 'user-123';
      const guideId = 'guide-456';
      const expectedAcknowledgment: GuideAcknowledgment = {
        id: 'ack-123',
        userId,
        guideId,
        acknowledgedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedAcknowledgment],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.findByUserAndGuide(userId, guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND guide_id = $2'),
        [userId, guideId]
      );
      expect(result).toEqual(expectedAcknowledgment);
    });

    it('should return null when no acknowledgment found for user and guide', async () => {
      const userId = 'user-123';
      const guideId = 'guide-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await GuideAcknowledgmentEntity.findByUserAndGuide(userId, guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND guide_id = $2'),
        [userId, guideId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findByUserAndGuide', async () => {
      const userId = 'user-123';
      const guideId = 'guide-456';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.findByUserAndGuide(userId, guideId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should find all acknowledgments for a user with default pagination', async () => {
      const userId = 'user-123';
      const expectedAcknowledgments: GuideAcknowledgment[] = [
        {
          id: 'ack-1',
          userId,
          guideId: 'guide-1',
          acknowledgedAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'ack-2',
          userId,
          guideId: 'guide-2',
          acknowledgedAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedAcknowledgments,
        rowCount: 2,
      } as any);

      const result = await GuideAcknowledgmentEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 ORDER BY acknowledged_at DESC'),
        [userId, 50, 0] // default limit and offset
      );
      expect(result).toEqual(expectedAcknowledgments);
    });

    it('should find acknowledgments with custom pagination', async () => {
      const userId = 'user-123';
      const limit = 10;
      const offset = 20;
      const expectedAcknowledgments: GuideAcknowledgment[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedAcknowledgments,
        rowCount: 0,
      } as any);

      const result = await GuideAcknowledgmentEntity.findByUserId(userId, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [userId, limit, offset]
      );
      expect(result).toEqual(expectedAcknowledgments);
    });

    it('should handle database errors during findByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.findByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByGuideId', () => {
    it('should find all acknowledgments for a guide', async () => {
      const guideId = 'guide-123';
      const expectedAcknowledgments: GuideAcknowledgment[] = [
        {
          id: 'ack-1',
          userId: 'user-1',
          guideId,
          acknowledgedAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'ack-2',
          userId: 'user-2',
          guideId,
          acknowledgedAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedAcknowledgments,
        rowCount: 2,
      } as any);

      const result = await GuideAcknowledgmentEntity.findByGuideId(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE guide_id = $1 ORDER BY acknowledged_at DESC'),
        [guideId]
      );
      expect(result).toEqual(expectedAcknowledgments);
    });

    it('should return empty array when no acknowledgments found for guide', async () => {
      const guideId = 'guide-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await GuideAcknowledgmentEntity.findByGuideId(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE guide_id = $1'),
        [guideId]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findByGuideId', async () => {
      const guideId = 'guide-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.findByGuideId(guideId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('countByGuideId', () => {
    it('should count acknowledgments for a guide', async () => {
      const guideId = 'guide-123';
      const expectedCount = 15;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.countByGuideId(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM guide_acknowledgments WHERE guide_id = $1'),
        [guideId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no acknowledgments found', async () => {
      const guideId = 'guide-456';

      mockQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.countByGuideId(guideId);

      expect(result).toBe(0);
    });

    it('should handle database errors during countByGuideId', async () => {
      const guideId = 'guide-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.countByGuideId(guideId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('countByUserIdAndGuideId', () => {
    it('should count acknowledgments for user and guide', async () => {
      const userId = 'user-123';
      const guideId = 'guide-456';
      const expectedCount = 1;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.countByUserIdAndGuideId(userId, guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND guide_id = $2'),
        [userId, guideId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no acknowledgment found for user and guide', async () => {
      const userId = 'user-123';
      const guideId = 'guide-456';

      mockQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.countByUserIdAndGuideId(userId, guideId);

      expect(result).toBe(0);
    });

    it('should handle database errors during countByUserIdAndGuideId', async () => {
      const userId = 'user-123';
      const guideId = 'guide-456';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.countByUserIdAndGuideId(userId, guideId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('delete', () => {
    it('should delete acknowledgment successfully', async () => {
      const acknowledgmentId = 'ack-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      const result = await GuideAcknowledgmentEntity.delete(acknowledgmentId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM guide_acknowledgments WHERE id = $1',
        [acknowledgmentId]
      );
      expect(result).toBe(true);
    });

    it('should return false when acknowledgment not found for deletion', async () => {
      const acknowledgmentId = 'nonexistent-ack';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await GuideAcknowledgmentEntity.delete(acknowledgmentId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM guide_acknowledgments WHERE id = $1',
        [acknowledgmentId]
      );
      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      const acknowledgmentId = 'ack-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.delete(acknowledgmentId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deleteByGuideId', () => {
    it('should delete all acknowledgments for a guide', async () => {
      const guideId = 'guide-123';
      const expectedCount = 5;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: expectedCount,
      } as any);

      const result = await GuideAcknowledgmentEntity.deleteByGuideId(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM guide_acknowledgments WHERE guide_id = $1',
        [guideId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no acknowledgments found for guide', async () => {
      const guideId = 'guide-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await GuideAcknowledgmentEntity.deleteByGuideId(guideId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM guide_acknowledgments WHERE guide_id = $1',
        [guideId]
      );
      expect(result).toBe(0);
    });

    it('should handle database errors during deleteByGuideId', async () => {
      const guideId = 'guide-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(GuideAcknowledgmentEntity.deleteByGuideId(guideId)).rejects.toThrow('Database connection failed');
    });
  });
});