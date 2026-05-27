import { IncidentEntity, Incident } from '../Incident';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('IncidentEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new incident successfully', async () => {
      const incidentData = {
        orgId: 'org-123',
        type: 'fire',
        severity: 'emergency' as const,
        startTime: new Date('2026-05-27T10:00:00Z'),
        endTime: new Date('2026-05-27T12:00:00Z'),
        isDrill: false,
        createdBy: 'user-123',
      };

      const expectedIncident: Incident = {
        id: 'incident-123',
        ...incidentData,
      };

      mockQuery.mockResolvedValue({
        rows: [expectedIncident],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.create(incidentData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO incidents'),
        [
          incidentData.orgId,
          incidentData.type,
          incidentData.severity,
          incidentData.startTime,
          incidentData.endTime,
          incidentData.isDrill,
          incidentData.createdBy,
        ]
      );
      expect(result).toEqual(expectedIncident);
    });

    it('should create an incident without end time', async () => {
      const incidentData = {
        orgId: 'org-123',
        type: 'earthquake',
        severity: 'watch' as const,
        startTime: new Date('2026-05-27T10:00:00Z'),
        isDrill: true,
        createdBy: 'user-456',
      };

      const expectedIncident: Incident = {
        id: 'incident-456',
        ...incidentData,
      };

      mockQuery.mockResolvedValue({
        rows: [expectedIncident],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.create(incidentData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO incidents'),
        [
          incidentData.orgId,
          incidentData.type,
          incidentData.severity,
          incidentData.startTime,
          undefined, // endTime
          incidentData.isDrill,
          incidentData.createdBy,
        ]
      );
      expect(result).toEqual(expectedIncident);
    });

    it('should handle database errors during creation', async () => {
      const incidentData = {
        orgId: 'org-123',
        type: 'fire',
        severity: 'emergency' as const,
        startTime: new Date('2026-05-27T10:00:00Z'),
        isDrill: false,
        createdBy: 'user-123',
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(IncidentEntity.create(incidentData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find incident by id successfully', async () => {
      const incidentId = 'incident-123';
      const expectedIncident: Incident = {
        id: incidentId,
        orgId: 'org-123',
        type: 'fire',
        severity: 'emergency',
        startTime: new Date('2026-05-27T10:00:00Z'),
        endTime: new Date('2026-05-27T12:00:00Z'),
        isDrill: false,
        createdBy: 'user-123',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedIncident],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.findById(incidentId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id as "orgId"'),
        [incidentId]
      );
      expect(result).toEqual(expectedIncident);
    });

    it('should return null when incident not found', async () => {
      const incidentId = 'nonexistent-incident';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await IncidentEntity.findById(incidentId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id as "orgId"'),
        [incidentId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const incidentId = 'incident-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(IncidentEntity.findById(incidentId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByOrgId', () => {
    it('should find all incidents for an organization', async () => {
      const orgId = 'org-123';
      const expectedIncidents: Incident[] = [
        {
          id: 'incident-1',
          orgId,
          type: 'fire',
          severity: 'emergency',
          startTime: new Date('2026-05-27T10:00:00Z'),
          isDrill: false,
          createdBy: 'user-123',
        },
        {
          id: 'incident-2',
          orgId,
          type: 'earthquake',
          severity: 'watch',
          startTime: new Date('2026-05-26T15:00:00Z'),
          isDrill: true,
          createdBy: 'user-456',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedIncidents,
        rowCount: 2,
      } as any);

      const result = await IncidentEntity.findByOrgId(orgId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM incidents WHERE org_id = $1'),
        [orgId, 50, 0] // default limit and offset
      );
      expect(result).toEqual(expectedIncidents);
    });

    it('should find incidents filtered by drill status', async () => {
      const orgId = 'org-123';
      const isDrill = true;
      const expectedIncidents: Incident[] = [
        {
          id: 'incident-2',
          orgId,
          type: 'earthquake',
          severity: 'watch',
          startTime: new Date('2026-05-26T15:00:00Z'),
          isDrill: true,
          createdBy: 'user-456',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedIncidents,
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.findByOrgId(orgId, isDrill);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2'),
        [orgId, isDrill, 50, 0]
      );
      expect(result).toEqual(expectedIncidents);
    });

    it('should find incidents with custom limit and offset', async () => {
      const orgId = 'org-123';
      const limit = 10;
      const offset = 20;
      const expectedIncidents: Incident[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedIncidents,
        rowCount: 0,
      } as any);

      const result = await IncidentEntity.findByOrgId(orgId, undefined, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [orgId, limit, offset]
      );
      expect(result).toEqual(expectedIncidents);
    });

    it('should find incidents with drill filter, custom limit and offset', async () => {
      const orgId = 'org-123';
      const isDrill = false;
      const limit = 25;
      const offset = 10;
      const expectedIncidents: Incident[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedIncidents,
        rowCount: 0,
      } as any);

      const result = await IncidentEntity.findByOrgId(orgId, isDrill, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2'),
        [orgId, isDrill, limit, offset]
      );
      expect(result).toEqual(expectedIncidents);
    });

    it('should handle database errors during findByOrgId', async () => {
      const orgId = 'org-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(IncidentEntity.findByOrgId(orgId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('countByOrgId', () => {
    it('should count all incidents for an organization', async () => {
      const orgId = 'org-123';
      const expectedCount = 15;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.countByOrgId(orgId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM incidents WHERE org_id = $1'),
        [orgId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should count incidents filtered by drill status', async () => {
      const orgId = 'org-123';
      const isDrill = true;
      const expectedCount = 5;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.countByOrgId(orgId, isDrill);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2'),
        [orgId, isDrill]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no incidents found', async () => {
      const orgId = 'org-456';

      mockQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.countByOrgId(orgId);

      expect(result).toBe(0);
    });

    it('should handle database errors during countByOrgId', async () => {
      const orgId = 'org-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(IncidentEntity.countByOrgId(orgId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update incident end time successfully', async () => {
      const incidentId = 'incident-123';
      const endTime = new Date('2026-05-27T12:00:00Z');
      const updateData = { endTime };

      const expectedIncident: Incident = {
        id: incidentId,
        orgId: 'org-123',
        type: 'fire',
        severity: 'emergency',
        startTime: new Date('2026-05-27T10:00:00Z'),
        endTime,
        isDrill: false,
        createdBy: 'user-123',
      };

      mockQuery.mockResolvedValue({
        rows: [expectedIncident],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.update(incidentId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE incidents SET end_time = $1'),
        [endTime, incidentId]
      );
      expect(result).toEqual(expectedIncident);
    });

    it('should return existing incident when no updates provided', async () => {
      const incidentId = 'incident-123';
      const updateData = {};

      const expectedIncident: Incident = {
        id: incidentId,
        orgId: 'org-123',
        type: 'fire',
        severity: 'emergency',
        startTime: new Date('2026-05-27T10:00:00Z'),
        isDrill: false,
        createdBy: 'user-123',
      };

      // Mock findById call
      mockQuery.mockResolvedValue({
        rows: [expectedIncident],
        rowCount: 1,
      } as any);

      const result = await IncidentEntity.update(incidentId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id as "orgId"'),
        [incidentId]
      );
      expect(result).toEqual(expectedIncident);
    });

    it('should return null when incident not found for update', async () => {
      const incidentId = 'nonexistent-incident';
      const updateData = { endTime: new Date('2026-05-27T12:00:00Z') };

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await IncidentEntity.update(incidentId, updateData);

      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      const incidentId = 'incident-123';
      const updateData = { endTime: new Date('2026-05-27T12:00:00Z') };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(IncidentEntity.update(incidentId, updateData)).rejects.toThrow('Database connection failed');
    });
  });
});