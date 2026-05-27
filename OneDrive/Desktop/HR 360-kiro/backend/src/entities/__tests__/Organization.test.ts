/**
 * Organization Entity Tests
 */

import { OrganizationEntity, Organization } from '../Organization';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('OrganizationEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrganization: Organization = {
    id: 'org-123',
    name: 'Acme Corporation',
    emailDomain: 'acme.com',
    inviteCode: 'ACME2024',
    logo: 'https://example.com/logo.png',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  describe('create', () => {
    it('should create a new organization successfully', async () => {
      const orgData = {
        name: 'Acme Corporation',
        emailDomain: 'acme.com',
        inviteCode: 'ACME2024',
        logo: 'https://example.com/logo.png',
      };

      mockedQuery.mockResolvedValue({
        rows: [mockOrganization],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.create(orgData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO organizations'),
        [orgData.name, orgData.emailDomain, orgData.inviteCode, orgData.logo]
      );
      expect(result).toEqual(mockOrganization);
    });

    it('should create organization with minimal required fields', async () => {
      const minimalOrgData = {
        name: 'Simple Corp',
      };

      const minimalOrg = {
        ...mockOrganization,
        id: 'org-456',
        name: 'Simple Corp',
        emailDomain: undefined,
        inviteCode: undefined,
        logo: undefined,
      };

      mockedQuery.mockResolvedValue({
        rows: [minimalOrg],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.create(minimalOrgData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO organizations'),
        [minimalOrgData.name, undefined, undefined, undefined]
      );
      expect(result).toEqual(minimalOrg);
    });

    it('should handle database errors during creation', async () => {
      const orgData = {
        name: 'Test Corp',
      };

      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(OrganizationEntity.create(orgData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find organization by id successfully', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockOrganization],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.findById('org-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name'),
        ['org-123']
      );
      expect(result).toEqual(mockOrganization);
    });

    it('should return null when organization not found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(OrganizationEntity.findById('org-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByInviteCode', () => {
    it('should find organization by invite code successfully', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockOrganization],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.findByInviteCode('ACME2024');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE invite_code = $1'),
        ['ACME2024']
      );
      expect(result).toEqual(mockOrganization);
    });

    it('should return null when invite code not found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.findByInviteCode('INVALID');

      expect(result).toBeNull();
    });

    it('should handle database errors during findByInviteCode', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(OrganizationEntity.findByInviteCode('ACME2024')).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update organization with all fields', async () => {
      const updateData = {
        name: 'Updated Acme Corp',
        emailDomain: 'updated-acme.com',
        logo: 'https://example.com/new-logo.png',
      };

      const updatedOrg = { ...mockOrganization, ...updateData };

      mockedQuery.mockResolvedValue({
        rows: [updatedOrg],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.update('org-123', updateData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE organizations SET'),
        expect.arrayContaining([
          updateData.name,
          updateData.emailDomain,
          updateData.logo,
          'org-123',
        ])
      );
      expect(result).toEqual(updatedOrg);
    });

    it('should update organization with partial fields', async () => {
      const updateData = {
        name: 'New Name Only',
      };

      const updatedOrg = { ...mockOrganization, ...updateData };

      mockedQuery.mockResolvedValue({
        rows: [updatedOrg],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.update('org-123', updateData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('name = $1'),
        expect.arrayContaining([updateData.name, 'org-123'])
      );
      expect(result).toEqual(updatedOrg);
    });

    it('should return existing organization when no updates provided', async () => {
      // Mock findById call
      const findByIdSpy = jest.spyOn(OrganizationEntity, 'findById').mockResolvedValue(mockOrganization);

      const result = await OrganizationEntity.update('org-123', {});

      expect(findByIdSpy).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockOrganization);

      findByIdSpy.mockRestore();
    });

    it('should return null when organization not found for update', async () => {
      const updateData = { name: 'New Name' };

      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.update('nonexistent-id', updateData);

      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      const updateData = { name: 'New Name' };

      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(OrganizationEntity.update('org-123', updateData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values in create', async () => {
      const orgData = {
        name: 'Test Corp',
        emailDomain: '',
        inviteCode: '',
        logo: '',
      };

      const orgWithEmptyStrings = {
        ...mockOrganization,
        emailDomain: '',
        inviteCode: '',
        logo: '',
      };

      mockedQuery.mockResolvedValue({
        rows: [orgWithEmptyStrings],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.create(orgData);

      expect(result).toEqual(orgWithEmptyStrings);
    });

    it('should handle special characters in organization name', async () => {
      const orgData = {
        name: 'Acme & Co. (International) Ltd.',
        emailDomain: 'acme-intl.com',
      };

      const specialCharOrg = {
        ...mockOrganization,
        name: 'Acme & Co. (International) Ltd.',
        emailDomain: 'acme-intl.com',
      };

      mockedQuery.mockResolvedValue({
        rows: [specialCharOrg],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.create(orgData);

      expect(result).toEqual(specialCharOrg);
    });

    it('should handle long organization names', async () => {
      const longName = 'A'.repeat(255); // Very long name
      const orgData = {
        name: longName,
      };

      const longNameOrg = {
        ...mockOrganization,
        name: longName,
      };

      mockedQuery.mockResolvedValue({
        rows: [longNameOrg],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await OrganizationEntity.create(orgData);

      expect(result.name).toBe(longName);
    });
  });
});