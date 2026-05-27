/**
 * Users Routes Tests
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { UserEntity } from '../../entities/User';

// Mock dependencies
jest.mock('../../entities/User');
jest.mock('jsonwebtoken');

const mockedUserEntity = UserEntity as jest.Mocked<typeof UserEntity>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Import users router after mocking
import usersRouter from '../users';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-jwt-secret-for-users-testing-32-chars-minimum';
    
    // Mock JWT verify for auth middleware
    mockedJwt.verify.mockImplementation((token: any) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }
      return {
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        orgId: 'org-123',
        teamId: 'team-123',
      };
    });
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'employee' as const,
    orgId: 'org-123',
    teamId: 'team-123',
    address: '123 Main St',
    latitude: 40.7128,
    longitude: -74.0060,
    biometricEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUpdatedUser = {
    ...mockUser,
    firstName: 'Jane',
    lastName: 'Smith',
    address: '456 Oak Ave',
    latitude: 41.8781,
    longitude: -87.6298,
  };

  describe('GET /users/profile', () => {
    it('should get user profile successfully', async () => {
      mockedUserEntity.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile retrieved successfully');
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.email).toBe(mockUser.email);
      expect(response.body.data.firstName).toBe(mockUser.firstName);
      expect(response.body.data.lastName).toBe(mockUser.lastName);
      expect(mockedUserEntity.findById).toHaveBeenCalledWith('user-123');
    });

    it('should handle user not found in database', async () => {
      mockedUserEntity.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
      expect(response.body.error.message).toBe('User not found');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors', async () => {
      mockedUserEntity.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to retrieve profile');
    });
  });

  describe('PUT /users/profile', () => {
    it('should update user profile successfully', async () => {
      mockedUserEntity.update.mockResolvedValue(mockUpdatedUser);

      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave',
        latitude: 41.8781,
        longitude: -87.6298,
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.id).toBe(mockUpdatedUser.id);
      expect(response.body.data.firstName).toBe('Jane');
      expect(response.body.data.lastName).toBe('Smith');
      expect(response.body.data.address).toBe('456 Oak Ave');
      expect(mockedUserEntity.update).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should update profile with partial data', async () => {
      const partialUpdate = { firstName: 'Jane' };
      const partialUpdatedUser = { ...mockUser, firstName: 'Jane' };
      mockedUserEntity.update.mockResolvedValue(partialUpdatedUser);

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Jane');
      expect(mockedUserEntity.update).toHaveBeenCalledWith('user-123', partialUpdate);
    });

    it('should validate coordinates when provided', async () => {
      const invalidCoordinates = {
        firstName: 'Jane',
        latitude: 91, // Invalid latitude (> 90)
        longitude: -74.0060,
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidCoordinates);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
      expect(response.body.error.message).toBe('Invalid coordinates');
    });

    it('should validate longitude when provided', async () => {
      const invalidCoordinates = {
        firstName: 'Jane',
        latitude: 40.7128,
        longitude: 181, // Invalid longitude (> 180)
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidCoordinates);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_COORDINATES');
    });

    it('should handle user not found during update', async () => {
      mockedUserEntity.update.mockResolvedValue(null);

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
      expect(response.body.error.message).toBe('User not found');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .put('/users/profile')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors during update', async () => {
      mockedUserEntity.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to update profile');
    });
  });

  describe('POST /users/biometric/enable', () => {
    it('should enable biometric authentication with faceId', async () => {
      mockedUserEntity.update.mockResolvedValue({
        ...mockUser,
        biometricEnabled: true,
      });

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'faceId' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Biometric authentication enabled');
      expect(response.body.data.biometricType).toBe('faceId');
      expect(mockedUserEntity.update).toHaveBeenCalledWith('user-123', {
        biometricEnabled: true,
      });
    });

    it('should enable biometric authentication with fingerprint', async () => {
      mockedUserEntity.update.mockResolvedValue({
        ...mockUser,
        biometricEnabled: true,
      });

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'fingerprint' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.biometricType).toBe('fingerprint');
    });

    it('should enable biometric authentication with both types', async () => {
      mockedUserEntity.update.mockResolvedValue({
        ...mockUser,
        biometricEnabled: true,
      });

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'both' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.biometricType).toBe('both');
    });

    it('should reject invalid biometric type', async () => {
      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'invalid-type' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TYPE');
      expect(response.body.error.message).toBe('Invalid biometric type');
    });

    it('should handle user not found during biometric enable', async () => {
      mockedUserEntity.update.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'faceId' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/users/biometric/enable')
        .send({ type: 'faceId' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors during biometric enable', async () => {
      mockedUserEntity.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'faceId' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to enable biometric');
    });
  });

  describe('POST /users/biometric/disable', () => {
    it('should disable biometric authentication successfully', async () => {
      mockedUserEntity.update.mockResolvedValue({
        ...mockUser,
        biometricEnabled: false,
      });

      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Biometric authentication disabled');
      expect(response.body.data).toEqual({});
      expect(mockedUserEntity.update).toHaveBeenCalledWith('user-123', {
        biometricEnabled: false,
      });
    });

    it('should handle user not found during biometric disable', async () => {
      mockedUserEntity.update.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
      expect(response.body.error.message).toBe('User not found');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/users/biometric/disable');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle database errors during biometric disable', async () => {
      mockedUserEntity.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to disable biometric');
    });
  });
});