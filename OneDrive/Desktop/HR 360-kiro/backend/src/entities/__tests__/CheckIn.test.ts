/**
 * CheckIn Entity Tests
 */

import { CheckInEntity, CheckIn } from '../CheckIn';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('CheckInEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCheckIn: CheckIn = {
    id: 'checkin-123',
    userId: 'user-123',
    teamId: 'team-123',
    status: 'safe',
    notes: 'All good here',
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: new Date('2024-01-01T00:00:00Z'),
    incidentId: 'incident-123',
    isDrill: false,
  };

  describe('create', () => {
    it('should create a new check-in successfully', async () => {
      const checkInData = {
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe' as const,
        notes: 'All good here',
        latitude: 40.7128,
        longitude: -74.0060,
        incidentId: 'incident-123',
        isDrill: false,
      };

      mockedQuery.mockResolvedValue({
        rows: [mockCheckIn],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.create(checkInData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO check_ins'),
        [
          checkInData.userId,
          checkInData.teamId,
          checkInData.status,
          checkInData.notes,
          checkInData.latitude,
          checkInData.longitude,
          checkInData.incidentId,
          checkInData.isDrill,
        ]
      );
      expect(result).toEqual(mockCheckIn);
    });

    it('should create check-in with minimal required fields', async () => {
      const minimalCheckInData = {
        userId: 'user-456',
        teamId: 'team-456',
        status: 'need_help' as const,
        isDrill: true,
      };

      const minimalCheckIn = {
        ...mockCheckIn,
        id: 'checkin-456',
        userId: 'user-456',
        teamId: 'team-456',
        status: 'need_help' as const,
        notes: undefined,
        latitude: undefined,
        longitude: undefined,
        incidentId: undefined,
        isDrill: true,
      };

      mockedQuery.mockResolvedValue({
        rows: [minimalCheckIn],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.create(minimalCheckInData);

      expect(result).toEqual(minimalCheckIn);
    });

    it('should handle different status values', async () => {
      const statusValues: Array<'safe' | 'need_help' | 'sos'> = ['safe', 'need_help', 'sos'];

      for (const status of statusValues) {
        const checkInData = {
          userId: 'user-123',
          teamId: 'team-123',
          status,
          isDrill: false,
        };

        const checkInWithStatus = {
          ...mockCheckIn,
          status,
        };

        mockedQuery.mockResolvedValue({
          rows: [checkInWithStatus],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: [],
        });

        const result = await CheckInEntity.create(checkInData);
        expect(result.status).toBe(status);
      }
    });

    it('should handle zero coordinates', async () => {
      const checkInData = {
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe' as const,
        latitude: 0,
        longitude: 0,
        isDrill: false,
      };

      const checkInWithZeroCoords = {
        ...mockCheckIn,
        latitude: 0,
        longitude: 0,
      };

      mockedQuery.mockResolvedValue({
        rows: [checkInWithZeroCoords],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.create(checkInData);
      expect(result.latitude).toBe(0);
      expect(result.longitude).toBe(0);
    });

    it('should handle database errors during creation', async () => {
      const checkInData = {
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe' as const,
        isDrill: false,
      };

      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(CheckInEntity.create(checkInData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find check-in by id successfully', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockCheckIn],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findById('checkin-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id'),
        ['checkin-123']
      );
      expect(result).toEqual(mockCheckIn);
    });

    it('should return null when check-in not found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(CheckInEntity.findById('checkin-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    const mockCheckIns = [
      mockCheckIn,
      { ...mockCheckIn, id: 'checkin-456', status: 'need_help' as const },
      { ...mockCheckIn, id: 'checkin-789', status: 'sos' as const },
    ];

    it('should find check-ins by user id with default pagination', async () => {
      mockedQuery.mockResolvedValue({
        rows: mockCheckIns,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByUserId('user-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp DESC LIMIT $2 OFFSET $3'),
        ['user-123', 50, 0]
      );
      expect(result).toEqual(mockCheckIns);
    });

    it('should find check-ins with custom pagination', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockCheckIn],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByUserId('user-123', 10, 20);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        ['user-123', 10, 20]
      );
      expect(result).toEqual([mockCheckIn]);
    });

    it('should return empty array when no check-ins found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByUserId('nonexistent-user');

      expect(result).toEqual([]);
    });

    it('should handle database errors during findByUserId', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(CheckInEntity.findByUserId('user-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByTeamId', () => {
    const mockTeamCheckIns = [
      mockCheckIn,
      { ...mockCheckIn, id: 'checkin-456', userId: 'user-456', isDrill: true },
      { ...mockCheckIn, id: 'checkin-789', userId: 'user-789', incidentId: 'incident-456' },
    ];

    it('should find check-ins by team id without filters', async () => {
      mockedQuery.mockResolvedValue({
        rows: mockTeamCheckIns,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByTeamId('team-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE team_id = $1 ORDER BY timestamp DESC'),
        ['team-123']
      );
      expect(result).toEqual(mockTeamCheckIns);
    });

    it('should filter by incident id', async () => {
      const incidentCheckIns = mockTeamCheckIns.filter(c => c.incidentId === 'incident-123');
      
      mockedQuery.mockResolvedValue({
        rows: incidentCheckIns,
        rowCount: incidentCheckIns.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByTeamId('team-123', 'incident-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND incident_id = $2'),
        ['team-123', 'incident-123']
      );
      expect(result).toEqual(incidentCheckIns);
    });

    it('should filter by isDrill parameter', async () => {
      const drillCheckIns = mockTeamCheckIns.filter(c => c.isDrill);
      
      mockedQuery.mockResolvedValue({
        rows: drillCheckIns,
        rowCount: drillCheckIns.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByTeamId('team-123', undefined, true);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2'),
        ['team-123', true]
      );
      expect(result).toEqual(drillCheckIns);
    });

    it('should filter by both incident id and isDrill', async () => {
      const filteredCheckIns = mockTeamCheckIns.filter(c => c.incidentId === 'incident-123' && !c.isDrill);
      
      mockedQuery.mockResolvedValue({
        rows: filteredCheckIns,
        rowCount: filteredCheckIns.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByTeamId('team-123', 'incident-123', false);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND incident_id = $2 AND is_drill = $3'),
        ['team-123', 'incident-123', false]
      );
      expect(result).toEqual(filteredCheckIns);
    });

    it('should handle database errors during findByTeamId', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(CheckInEntity.findByTeamId('team-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByIncidentId', () => {
    it('should find check-ins by incident id', async () => {
      const incidentCheckIns = [
        mockCheckIn,
        { ...mockCheckIn, id: 'checkin-456', userId: 'user-456' },
      ];

      mockedQuery.mockResolvedValue({
        rows: incidentCheckIns,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByIncidentId('incident-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE incident_id = $1 ORDER BY timestamp DESC'),
        ['incident-123']
      );
      expect(result).toEqual(incidentCheckIns);
    });

    it('should return empty array when no check-ins found for incident', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.findByIncidentId('nonexistent-incident');

      expect(result).toEqual([]);
    });

    it('should handle database errors during findByIncidentId', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(CheckInEntity.findByIncidentId('incident-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('countByIncidentIdAndStatus', () => {
    it('should count check-ins by incident and status', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '5' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.countByIncidentIdAndStatus('incident-123', 'safe');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM check_ins WHERE incident_id = $1 AND status = $2'),
        ['incident-123', 'safe']
      );
      expect(result).toBe(5);
    });

    it('should return zero when no matching check-ins found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.countByIncidentIdAndStatus('incident-123', 'sos');

      expect(result).toBe(0);
    });

    it('should handle database errors during countByIncidentIdAndStatus', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(CheckInEntity.countByIncidentIdAndStatus('incident-123', 'safe')).rejects.toThrow('Database connection failed');
    });
  });

  describe('getIncidentSummary', () => {
    it('should return incident summary with all status counts', async () => {
      const mockSummary = {
        total: '10',
        safe: '7',
        need_help: '2',
        sos: '1',
      };

      mockedQuery.mockResolvedValue({
        rows: [mockSummary],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.getIncidentSummary('incident-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total'),
        ['incident-123']
      );
      expect(result).toEqual(mockSummary);
    });

    it('should return zero counts when no check-ins exist', async () => {
      const emptySummary = {
        total: '0',
        safe: '0',
        need_help: '0',
        sos: '0',
      };

      mockedQuery.mockResolvedValue({
        rows: [emptySummary],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.getIncidentSummary('empty-incident');

      expect(result).toEqual(emptySummary);
    });

    it('should handle database errors during getIncidentSummary', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(CheckInEntity.getIncidentSummary('incident-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('edge cases and data validation', () => {
    it('should handle long notes', async () => {
      const longNotes = 'A'.repeat(500);
      const checkInData = {
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe' as const,
        notes: longNotes,
        isDrill: false,
      };

      const checkInWithLongNotes = {
        ...mockCheckIn,
        notes: longNotes,
      };

      mockedQuery.mockResolvedValue({
        rows: [checkInWithLongNotes],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.create(checkInData);
      expect(result.notes).toBe(longNotes);
    });

    it('should handle special characters in notes', async () => {
      const specialNotes = 'Notes with émojis 🚨 and symbols: @#$%^&*()';
      const checkInData = {
        userId: 'user-123',
        teamId: 'team-123',
        status: 'need_help' as const,
        notes: specialNotes,
        isDrill: false,
      };

      const checkInWithSpecialNotes = {
        ...mockCheckIn,
        status: 'need_help' as const,
        notes: specialNotes,
      };

      mockedQuery.mockResolvedValue({
        rows: [checkInWithSpecialNotes],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.create(checkInData);
      expect(result.notes).toBe(specialNotes);
    });

    it('should handle extreme coordinate values', async () => {
      const checkInData = {
        userId: 'user-123',
        teamId: 'team-123',
        status: 'safe' as const,
        latitude: -90,
        longitude: 180,
        isDrill: false,
      };

      const checkInWithExtremeCoords = {
        ...mockCheckIn,
        latitude: -90,
        longitude: 180,
      };

      mockedQuery.mockResolvedValue({
        rows: [checkInWithExtremeCoords],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await CheckInEntity.create(checkInData);
      expect(result.latitude).toBe(-90);
      expect(result.longitude).toBe(180);
    });
  });
});