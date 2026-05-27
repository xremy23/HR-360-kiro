/**
 * Alert Entity Tests
 */

import { AlertEntity, Alert } from '../Alert';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('AlertEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAlert: Alert = {
    id: 'alert-123',
    orgId: 'org-123',
    teamIds: ['team-1', 'team-2'],
    title: 'Emergency Alert',
    message: 'This is an emergency alert message',
    severity: 'emergency',
    type: 'weather',
    createdBy: 'user-123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    expiresAt: new Date('2024-01-01T12:00:00Z'),
    isDrill: false,
    incidentId: 'incident-123',
  };

  describe('create', () => {
    it('should create a new alert successfully', async () => {
      const alertData = {
        orgId: 'org-123',
        teamIds: ['team-1', 'team-2'],
        title: 'Emergency Alert',
        message: 'This is an emergency alert message',
        severity: 'emergency' as const,
        type: 'weather',
        createdBy: 'user-123',
        expiresAt: new Date('2024-01-01T12:00:00Z'),
        isDrill: false,
        incidentId: 'incident-123',
      };

      mockedQuery.mockResolvedValue({
        rows: [mockAlert],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.create(alertData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alerts'),
        [
          alertData.orgId,
          alertData.teamIds,
          alertData.title,
          alertData.message,
          alertData.severity,
          alertData.type,
          alertData.createdBy,
          alertData.expiresAt,
          alertData.isDrill,
          alertData.incidentId,
        ]
      );
      expect(result).toEqual(mockAlert);
    });

    it('should create alert with minimal required fields', async () => {
      const minimalAlertData = {
        orgId: 'org-456',
        title: 'Simple Alert',
        message: 'Simple message',
        severity: 'advisory' as const,
        type: 'general',
        createdBy: 'user-456',
        isDrill: true,
      };

      const minimalAlert = {
        ...mockAlert,
        id: 'alert-456',
        orgId: 'org-456',
        teamIds: undefined,
        title: 'Simple Alert',
        message: 'Simple message',
        severity: 'advisory' as const,
        type: 'general',
        createdBy: 'user-456',
        expiresAt: undefined,
        isDrill: true,
        incidentId: undefined,
      };

      mockedQuery.mockResolvedValue({
        rows: [minimalAlert],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.create(minimalAlertData);

      expect(result).toEqual(minimalAlert);
    });

    it('should handle different severity levels', async () => {
      const severityLevels: Array<'advisory' | 'watch' | 'emergency'> = ['advisory', 'watch', 'emergency'];

      for (const severity of severityLevels) {
        const alertData = {
          orgId: 'org-123',
          title: `${severity} Alert`,
          message: `This is a ${severity} alert`,
          severity,
          type: 'test',
          createdBy: 'user-123',
          isDrill: false,
        };

        const alertWithSeverity = {
          ...mockAlert,
          title: `${severity} Alert`,
          message: `This is a ${severity} alert`,
          severity,
        };

        mockedQuery.mockResolvedValue({
          rows: [alertWithSeverity],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: [],
        });

        const result = await AlertEntity.create(alertData);
        expect(result.severity).toBe(severity);
      }
    });

    it('should handle database errors during creation', async () => {
      const alertData = {
        orgId: 'org-123',
        title: 'Test Alert',
        message: 'Test message',
        severity: 'advisory' as const,
        type: 'test',
        createdBy: 'user-123',
        isDrill: false,
      };

      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(AlertEntity.create(alertData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find alert by id successfully', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockAlert],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findById('alert-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id'),
        ['alert-123']
      );
      expect(result).toEqual(mockAlert);
    });

    it('should return null when alert not found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(AlertEntity.findById('alert-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByOrgId', () => {
    const mockAlerts = [
      mockAlert,
      { ...mockAlert, id: 'alert-456', severity: 'watch' as const, isDrill: true },
      { ...mockAlert, id: 'alert-789', severity: 'advisory' as const, isDrill: false },
    ];

    it('should find alerts by organization id with default parameters', async () => {
      mockedQuery.mockResolvedValue({
        rows: mockAlerts,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findByOrgId('org-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, org_id'),
        ['org-123', 50, 0]
      );
      expect(result).toEqual(mockAlerts);
    });

    it('should find alerts with custom pagination', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockAlert],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findByOrgId('org-123', undefined, undefined, 10, 20);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        ['org-123', 10, 20]
      );
      expect(result).toEqual([mockAlert]);
    });

    it('should filter by isDrill parameter', async () => {
      const drillAlerts = mockAlerts.filter(alert => alert.isDrill);
      
      mockedQuery.mockResolvedValue({
        rows: drillAlerts,
        rowCount: drillAlerts.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findByOrgId('org-123', true);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2'),
        ['org-123', true, 50, 0]
      );
      expect(result).toEqual(drillAlerts);
    });

    it('should filter by severity parameter', async () => {
      const emergencyAlerts = mockAlerts.filter(alert => alert.severity === 'emergency');
      
      mockedQuery.mockResolvedValue({
        rows: emergencyAlerts,
        rowCount: emergencyAlerts.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findByOrgId('org-123', undefined, 'emergency');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND severity = $2'),
        ['org-123', 'emergency', 50, 0]
      );
      expect(result).toEqual(emergencyAlerts);
    });

    it('should filter by both isDrill and severity', async () => {
      const filteredAlerts = mockAlerts.filter(alert => !alert.isDrill && alert.severity === 'emergency');
      
      mockedQuery.mockResolvedValue({
        rows: filteredAlerts,
        rowCount: filteredAlerts.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findByOrgId('org-123', false, 'emergency');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2 AND severity = $3'),
        ['org-123', false, 'emergency', 50, 0]
      );
      expect(result).toEqual(filteredAlerts);
    });

    it('should return empty array when no alerts found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.findByOrgId('nonexistent-org');

      expect(result).toEqual([]);
    });

    it('should handle database errors during findByOrgId', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(AlertEntity.findByOrgId('org-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('countByOrgId', () => {
    it('should return alert count for organization', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '15' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.countByOrgId('org-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        ['org-123']
      );
      expect(result).toBe(15);
    });

    it('should count with isDrill filter', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '5' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.countByOrgId('org-123', true);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2'),
        ['org-123', true]
      );
      expect(result).toBe(5);
    });

    it('should count with severity filter', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '3' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.countByOrgId('org-123', undefined, 'emergency');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND severity = $2'),
        ['org-123', 'emergency']
      );
      expect(result).toBe(3);
    });

    it('should count with both filters', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '2' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.countByOrgId('org-123', false, 'watch');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_drill = $2 AND severity = $3'),
        ['org-123', false, 'watch']
      );
      expect(result).toBe(2);
    });

    it('should return zero when no alerts found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.countByOrgId('empty-org');

      expect(result).toBe(0);
    });

    it('should handle database errors during countByOrgId', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(AlertEntity.countByOrgId('org-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('edge cases and data validation', () => {
    it('should handle undefined team IDs', async () => {
      const alertData = {
        orgId: 'org-123',
        teamIds: undefined,
        title: 'Alert without teams',
        message: 'Message',
        severity: 'advisory' as const,
        type: 'general',
        createdBy: 'user-123',
        isDrill: false,
      };

      const alertWithNullTeams = {
        ...mockAlert,
        teamIds: undefined,
        title: 'Alert without teams',
      };

      mockedQuery.mockResolvedValue({
        rows: [alertWithNullTeams],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.create(alertData);
      expect(result.teamIds).toBeUndefined();
    });

    it('should handle empty team IDs array', async () => {
      const alertData = {
        orgId: 'org-123',
        teamIds: [],
        title: 'Alert with empty teams',
        message: 'Message',
        severity: 'watch' as const,
        type: 'general',
        createdBy: 'user-123',
        isDrill: false,
      };

      const alertWithEmptyTeams = {
        ...mockAlert,
        teamIds: [],
        title: 'Alert with empty teams',
        severity: 'watch' as const,
      };

      mockedQuery.mockResolvedValue({
        rows: [alertWithEmptyTeams],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.create(alertData);
      expect(result.teamIds).toEqual([]);
    });

    it('should handle long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      const alertData = {
        orgId: 'org-123',
        title: 'Long Message Alert',
        message: longMessage,
        severity: 'emergency' as const,
        type: 'test',
        createdBy: 'user-123',
        isDrill: false,
      };

      const alertWithLongMessage = {
        ...mockAlert,
        title: 'Long Message Alert',
        message: longMessage,
      };

      mockedQuery.mockResolvedValue({
        rows: [alertWithLongMessage],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.create(alertData);
      expect(result.message).toBe(longMessage);
    });

    it('should handle special characters in title and message', async () => {
      const alertData = {
        orgId: 'org-123',
        title: 'Alert with "quotes" & <tags>',
        message: 'Message with émojis 🚨 and symbols: @#$%^&*()',
        severity: 'advisory' as const,
        type: 'special',
        createdBy: 'user-123',
        isDrill: false,
      };

      const alertWithSpecialChars = {
        ...mockAlert,
        title: 'Alert with "quotes" & <tags>',
        message: 'Message with émojis 🚨 and symbols: @#$%^&*()',
        severity: 'advisory' as const,
        type: 'special',
      };

      mockedQuery.mockResolvedValue({
        rows: [alertWithSpecialChars],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await AlertEntity.create(alertData);
      expect(result.title).toBe('Alert with "quotes" & <tags>');
      expect(result.message).toBe('Message with émojis 🚨 and symbols: @#$%^&*()');
    });
  });
});