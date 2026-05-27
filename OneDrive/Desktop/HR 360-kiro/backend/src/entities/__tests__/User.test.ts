/**
 * User Entity Tests
 */

import { UserEntity, User } from '../User';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('UserEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'employee',
    orgId: 'org-123',
    teamId: 'team-123',
    departmentId: 'dept-123',
    address: '123 Main St',
    latitude: 40.7128,
    longitude: -74.0060,
    biometricEnabled: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee' as const,
        orgId: 'org-123',
        teamId: 'team-123',
        departmentId: 'dept-123',
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        biometricEnabled: true,
      };

      mockedQuery.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.create(userData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.role,
          userData.orgId,
          userData.teamId,
          userData.departmentId,
          userData.address,
          userData.latitude,
          userData.longitude,
          userData.biometricEnabled,
        ]
      );
      expect(result).toEqual(mockUser);
    });

    it('should create user with minimal required fields', async () => {
      const minimalUserData = {
        email: 'minimal@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'admin' as const,
        orgId: 'org-456',
        biometricEnabled: false,
      };

      const minimalUser = {
        ...mockUser,
        id: 'user-456',
        email: 'minimal@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'admin' as const,
        orgId: 'org-456',
        teamId: undefined,
        departmentId: undefined,
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        biometricEnabled: false,
      };

      mockedQuery.mockResolvedValue({
        rows: [minimalUser],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.create(minimalUserData);

      expect(result).toEqual(minimalUser);
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findById('user-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email'),
        ['user-123']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      mockedQuery.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findByEmail('test@example.com');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email'),
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByOrgId', () => {
    it('should find users by organization id with default pagination', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456', email: 'user2@example.com' }];

      mockedQuery.mockResolvedValue({
        rows: users,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findByOrgId('org-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email'),
        ['org-123', 50, 0]
      );
      expect(result).toEqual(users);
    });

    it('should find users by organization id with custom pagination', async () => {
      const users = [mockUser];

      mockedQuery.mockResolvedValue({
        rows: users,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findByOrgId('org-123', 10, 20);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        ['org-123', 10, 20]
      );
      expect(result).toEqual(users);
    });

    it('should return empty array when no users found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findByOrgId('nonexistent-org');

      expect(result).toEqual([]);
    });
  });

  describe('findByTeamId', () => {
    it('should find users by team id successfully', async () => {
      const teamUsers = [mockUser, { ...mockUser, id: 'user-456', email: 'teammate@example.com' }];

      mockedQuery.mockResolvedValue({
        rows: teamUsers,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findByTeamId('team-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE team_id = $1'),
        ['team-123']
      );
      expect(result).toEqual(teamUsers);
    });

    it('should return empty array when no team members found', async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.findByTeamId('empty-team');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update user with all fields', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave',
        latitude: 41.8781,
        longitude: -87.6298,
        biometricEnabled: false,
      };

      const updatedUser = { ...mockUser, ...updateData };

      mockedQuery.mockResolvedValue({
        rows: [updatedUser],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.update('user-123', updateData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([
          updateData.firstName,
          updateData.lastName,
          updateData.address,
          updateData.latitude,
          updateData.longitude,
          updateData.biometricEnabled,
          'user-123',
        ])
      );
      expect(result).toEqual(updatedUser);
    });

    it('should update user with partial fields', async () => {
      const updateData = {
        firstName: 'Jane',
        biometricEnabled: false,
      };

      const updatedUser = { ...mockUser, ...updateData };

      mockedQuery.mockResolvedValue({
        rows: [updatedUser],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.update('user-123', updateData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('first_name = $1'),
        expect.arrayContaining([updateData.firstName, updateData.biometricEnabled, 'user-123'])
      );
      expect(result).toEqual(updatedUser);
    });

    it('should handle zero coordinates update', async () => {
      const updateData = {
        latitude: 0,
        longitude: 0,
      };

      const updatedUser = { ...mockUser, ...updateData };

      mockedQuery.mockResolvedValue({
        rows: [updatedUser],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.update('user-123', updateData);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('latitude = $1'),
        expect.arrayContaining([0, 0, 'user-123'])
      );
      expect(result).toEqual(updatedUser);
    });

    it('should return existing user when no updates provided', async () => {
      // Mock findById call
      const findByIdSpy = jest.spyOn(UserEntity, 'findById').mockResolvedValue(mockUser);

      const result = await UserEntity.update('user-123', {});

      expect(findByIdSpy).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);

      findByIdSpy.mockRestore();
    });

    it('should return null when user not found for update', async () => {
      const updateData = { firstName: 'Jane' };

      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.update('nonexistent-id', updateData);

      expect(result).toBeNull();
    });
  });

  describe('countByOrgId', () => {
    it('should return user count for organization', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '25' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.countByOrgId('org-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        ['org-123']
      );
      expect(result).toBe(25);
    });

    it('should return zero when no users in organization', async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await UserEntity.countByOrgId('empty-org');

      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle database errors in create', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee' as const,
        orgId: 'org-123',
        biometricEnabled: true,
      };

      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(UserEntity.create(userData)).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors in findById', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(UserEntity.findById('user-123')).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors in update', async () => {
      mockedQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(UserEntity.update('user-123', { firstName: 'Jane' })).rejects.toThrow('Database connection failed');
    });
  });
});