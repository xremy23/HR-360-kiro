import { SOSEscalationEntity, SOSEscalation } from '../SOSEscalation';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('SOSEscalationEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new SOS escalation successfully', async () => {
      const escalationData = {
        userId: 'user-123',
        status: 'initiated',
        notes: 'Emergency situation reported',
      };

      const expectedEscalation: SOSEscalation = {
        id: 'sos-123',
        ...escalationData,
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.create(escalationData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sos_escalations'),
        [escalationData.userId, escalationData.status, escalationData.notes]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should create escalation without notes', async () => {
      const escalationData = {
        userId: 'user-456',
        status: 'escalated',
      };

      const expectedEscalation: SOSEscalation = {
        id: 'sos-456',
        ...escalationData,
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.create(escalationData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sos_escalations'),
        [escalationData.userId, escalationData.status, undefined]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should handle database errors during creation', async () => {
      const escalationData = {
        userId: 'user-123',
        status: 'initiated',
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(SOSEscalationEntity.create(escalationData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find SOS escalation by id successfully', async () => {
      const escalationId = 'sos-123';
      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'initiated',
        managerNotifiedAt: new Date('2026-05-27T10:05:00Z'),
        emergencyContactsNotifiedAt: new Date('2026-05-27T10:10:00Z'),
        teamNotifiedAt: new Date('2026-05-27T10:15:00Z'),
        notes: 'Emergency situation',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.findById(escalationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should return null when escalation not found', async () => {
      const escalationId = 'nonexistent-sos';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await SOSEscalationEntity.findById(escalationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [escalationId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const escalationId = 'sos-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(SOSEscalationEntity.findById(escalationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByOrgId', () => {
    it('should find all SOS escalations for an organization', async () => {
      const orgId = 'org-123';
      const expectedEscalations: SOSEscalation[] = [
        {
          id: 'sos-1',
          userId: 'user-1',
          initiatedAt: new Date('2026-05-27T10:00:00Z'),
          status: 'resolved',
          managerNotifiedAt: new Date('2026-05-27T10:05:00Z'),
          resolvedAt: new Date('2026-05-27T11:00:00Z'),
          notes: 'False alarm',
        },
        {
          id: 'sos-2',
          userId: 'user-2',
          initiatedAt: new Date('2026-05-27T09:00:00Z'),
          status: 'escalated',
          managerNotifiedAt: new Date('2026-05-27T09:05:00Z'),
          emergencyContactsNotifiedAt: new Date('2026-05-27T09:10:00Z'),
          notes: 'Medical emergency',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedEscalations,
        rowCount: 2,
      } as any);

      const result = await SOSEscalationEntity.findByOrgId(orgId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('JOIN users u ON s.user_id = u.id'),
        [orgId]
      );
      expect(result).toEqual(expectedEscalations);
    });

    it('should return empty array when no escalations found for organization', async () => {
      const orgId = 'org-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await SOSEscalationEntity.findByOrgId(orgId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.org_id = $1'),
        [orgId]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findByOrgId', async () => {
      const orgId = 'org-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(SOSEscalationEntity.findByOrgId(orgId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update escalation status successfully', async () => {
      const escalationId = 'sos-123';
      const updateData = { status: 'resolved' };

      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'resolved',
        managerNotifiedAt: new Date('2026-05-27T10:05:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sos_escalations SET status = $1'),
        ['resolved', escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should update manager notification time successfully', async () => {
      const escalationId = 'sos-123';
      const managerNotifiedAt = new Date('2026-05-27T10:05:00Z');
      const updateData = { managerNotifiedAt };

      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'escalated',
        managerNotifiedAt,
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sos_escalations SET manager_notified_at = $1'),
        [managerNotifiedAt, escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should update emergency contacts notification time successfully', async () => {
      const escalationId = 'sos-123';
      const emergencyContactsNotifiedAt = new Date('2026-05-27T10:10:00Z');
      const updateData = { emergencyContactsNotifiedAt };

      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'escalated',
        emergencyContactsNotifiedAt,
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sos_escalations SET emergency_contacts_notified_at = $1'),
        [emergencyContactsNotifiedAt, escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should update team notification time successfully', async () => {
      const escalationId = 'sos-123';
      const teamNotifiedAt = new Date('2026-05-27T10:15:00Z');
      const updateData = { teamNotifiedAt };

      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'escalated',
        teamNotifiedAt,
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sos_escalations SET team_notified_at = $1'),
        [teamNotifiedAt, escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should update resolved time successfully', async () => {
      const escalationId = 'sos-123';
      const resolvedAt = new Date('2026-05-27T11:00:00Z');
      const updateData = { resolvedAt };

      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'resolved',
        resolvedAt,
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sos_escalations SET resolved_at = $1'),
        [resolvedAt, escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should update multiple fields successfully', async () => {
      const escalationId = 'sos-123';
      const updateData = {
        status: 'resolved',
        resolvedAt: new Date('2026-05-27T11:00:00Z'),
        teamNotifiedAt: new Date('2026-05-27T10:15:00Z'),
      };

      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'resolved',
        teamNotifiedAt: updateData.teamNotifiedAt,
        resolvedAt: updateData.resolvedAt,
      };

      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sos_escalations SET status = $1, team_notified_at = $2, resolved_at = $3'),
        ['resolved', updateData.teamNotifiedAt, updateData.resolvedAt, escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should return existing escalation when no updates provided', async () => {
      const escalationId = 'sos-123';
      const updateData = {};

      const expectedEscalation: SOSEscalation = {
        id: escalationId,
        userId: 'user-123',
        initiatedAt: new Date('2026-05-27T10:00:00Z'),
        status: 'initiated',
      };

      // Mock findById call
      mockQuery.mockResolvedValue({
        rows: [expectedEscalation],
        rowCount: 1,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [escalationId]
      );
      expect(result).toEqual(expectedEscalation);
    });

    it('should return null when escalation not found for update', async () => {
      const escalationId = 'nonexistent-sos';
      const updateData = { status: 'resolved' };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await SOSEscalationEntity.update(escalationId, updateData);

      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      const escalationId = 'sos-123';
      const updateData = { status: 'resolved' };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(SOSEscalationEntity.update(escalationId, updateData)).rejects.toThrow('Database connection failed');
    });
  });
});