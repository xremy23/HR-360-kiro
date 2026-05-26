import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validatePhoneNumber, validateCoordinates } from '../utils/validators';

const router = Router();

// Mock database
const users: any = {};

/**
 * GET /users/profile
 * Get user profile
 */
router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // TODO: Fetch from database
    const user = {
      id: req.user.id,
      email: req.user.email,
      firstName: 'John',
      lastName: 'Doe',
      role: req.user.role,
      orgId: req.user.orgId,
      teamId: req.user.teamId,
      departmentId: '',
      address: '123 Main St',
      latitude: 14.5995,
      longitude: 120.9842,
      biometricEnabled: false,
      emergencyContacts: [],
    };

    return sendSuccess(res, user, 'Profile retrieved successfully', 200);
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to retrieve profile', 500);
  }
});

/**
 * PUT /users/profile
 * Update user profile
 */
router.put('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { firstName, lastName, address, latitude, longitude, emergencyContacts } = req.body;

    // Validate coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      if (!validateCoordinates(latitude || 0, longitude || 0)) {
        return sendError(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
      }
    }

    // TODO: Update in database
    const updatedUser = {
      id: req.user.id,
      email: req.user.email,
      firstName: firstName || 'John',
      lastName: lastName || 'Doe',
      role: req.user.role,
      orgId: req.user.orgId,
      teamId: req.user.teamId,
      address: address || '123 Main St',
      latitude: latitude || 14.5995,
      longitude: longitude || 120.9842,
      biometricEnabled: false,
      emergencyContacts: emergencyContacts || [],
    };

    return sendSuccess(res, updatedUser, 'Profile updated successfully', 200);
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update profile', 500);
  }
});

/**
 * POST /users/biometric/enable
 * Enable biometric authentication
 */
router.post('/biometric/enable', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { type } = req.body;

    if (!['faceId', 'fingerprint', 'both'].includes(type)) {
      return sendError(res, 'INVALID_TYPE', 'Invalid biometric type', 400);
    }

    // TODO: Enable biometric in database
    return sendSuccess(res, { biometricType: type }, 'Biometric authentication enabled', 200);
  } catch (error) {
    console.error('Enable biometric error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to enable biometric', 500);
  }
});

/**
 * POST /users/biometric/disable
 * Disable biometric authentication
 */
router.post('/biometric/disable', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // TODO: Disable biometric in database
    return sendSuccess(res, {}, 'Biometric authentication disabled', 200);
  } catch (error) {
    console.error('Disable biometric error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to disable biometric', 500);
  }
});

export default router;
