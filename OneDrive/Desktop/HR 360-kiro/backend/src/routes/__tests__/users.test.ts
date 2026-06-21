/**
 * Users Routes Tests
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { sessionService } from '../../services/sessionService';
import { userService } from '../../services/userService';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../services/sessionService');
jest.mock('../../services/userService');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedSessionService = sessionService as jest.Mocked<typeof sessionService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

// Import users router after mocking
import usersRouter from '../users';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe.skip('Users Routes', () => {
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
        userId: 'user-123',
        email: 'test@example.com',
        role: 'employee',
      };
    });

    // Mock sessionService methods
    mockedSessionService.isTokenBlacklisted.mockResolvedValue(false);
    mockedSessionService.get.mockResolvedValue(JSON.stringify({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'employee',
      orgId: 'org-123',
      teamId: 'team-123',
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }));
    mockedSessionService.updateSessionActivity.mockResolvedValue(undefined);
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'employee' as const,
    organizationId: 'org-123',
    teamId: 'team-123',
    address: '123 Main St',
    phone: '555-0100',
    position: 'Engineer',
    avatarUrl: 'https://example.com/avatar.jpg',
    personalEmergencyContact: 'Contact info',
    isActive: true,
    biometricEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUpdatedUser = {
    ...mockUser,
    firstName: 'Jane',
    lastName: 'Smith',
    address: '456 Oak Ave',
    phone: '555-0101',
  };

  describe('GET /users/profile', () => {
    it('should get user profile successfully', async () => {
      mockedUserService.getUserProfile.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.email).toBe(mockUser.email);
      expect(response.body.data.firstName).toBe(mockUser.firstName);
      expect(response.body.data.lastName).toBe(mockUser.lastName);
      expect(mockedUserService.getUserProfile).toHaveBeenCalledWith('user-123');
    });

    it('should handle user not found in database', async () => {
      mockedUserService.getUserProfile.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle database errors', async () => {
      mockedUserService.getUserProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROFILE_FETCH_FAILED');
    });
  });

  describe('PUT /users/profile', () => {
    it('should update user profile successfully', async () => {
      mockedUserService.updateUser.mockResolvedValue(mockUpdatedUser);

      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave',
        phone: '555-0101',
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUpdatedUser.id);
      expect(response.body.data.firstName).toBe('Jane');
      expect(response.body.data.lastName).toBe('Smith');
      expect(response.body.data.address).toBe('456 Oak Ave');
      expect(mockedUserService.updateUser).toHaveBeenCalledWith('user-123', expect.objectContaining(updateData));
    });

    it('should update profile with partial data', async () => {
      const partialUpdate = { firstName: 'Jane' };
      const partialUpdatedUser = { ...mockUser, firstName: 'Jane' };
      mockedUserService.updateUser.mockResolvedValue(partialUpdatedUser);

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Jane');
    });

    it('should validate input - firstName must be string', async () => {
      const invalidData = {
        firstName: 123,
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should handle user not found during update', async () => {
      mockedUserService.updateUser.mockResolvedValue(null);

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .put('/users/profile')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle database errors during update', async () => {
      mockedUserService.updateUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROFILE_UPDATE_FAILED');
    });
  });

  describe('POST /users/biometric/enable', () => {
    it('should enable biometric authentication with faceId', async () => {
      mockedUserService.updateUser.mockResolvedValue({
        ...mockUser,
        biometricEnabled: true,
      });

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'faceId' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith('user-123', expect.any(Object));
    });

    it('should enable biometric authentication with fingerprint', async () => {
      mockedUserService.updateUser.mockResolvedValue({
        ...mockUser,
        biometricEnabled: true,
      });

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'fingerprint' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should enable biometric authentication with both types', async () => {
      mockedUserService.updateUser.mockResolvedValue({
        ...mockUser,
        biometricEnabled: true,
      });

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'both' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid biometric type', async () => {
      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'invalid-type' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should handle user not found during biometric enable', async () => {
      mockedUserService.updateUser.mockResolvedValue(null);

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
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should handle database errors during biometric enable', async () => {
      mockedUserService.updateUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/users/biometric/enable')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: 'faceId' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROFILE_UPDATE_FAILED');
    });
  });

  describe('POST /users/biometric/disable', () => {
    it('should disable biometric authentication successfully', async () => {
      mockedUserService.updateUser.mockResolvedValue({
        ...mockUser,
        biometricEnabled: false,
      });

      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith('user-123', expect.any(Object));
    });

    it('should handle user not found during biometric disable', async () => {
      mockedUserService.updateUser.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/users/biometric/disable');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle database errors during biometric disable', async () => {
      mockedUserService.updateUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/users/biometric/disable')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROFILE_UPDATE_FAILED');
    });
  });
});