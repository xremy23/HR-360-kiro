import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validateCoordinates } from '../utils/validators';
import { UserEntity } from '../entities/User';

const router = Router();

/**
 * GET /users/profile
 * Get user profile
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const user = await UserEntity.findById(req.user.id);
    if (!user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

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
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { firstName, lastName, address, latitude, longitude } = req.body;

    // Validate coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      if (!validateCoordinates(latitude || 0, longitude || 0)) {
        return sendError(res, 'INVALID_COORDINATES', 'Invalid coordinates', 400);
      }
    }

    const updatedUser = await UserEntity.update(req.user.id, {
      firstName,
      lastName,
      address,
      latitude,
      longitude,
    });

    if (!updatedUser) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

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
router.post('/biometric/enable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const { type } = req.body;

    if (!['faceId', 'fingerprint', 'both'].includes(type)) {
      return sendError(res, 'INVALID_TYPE', 'Invalid biometric type', 400);
    }

    const updatedUser = await UserEntity.update(req.user.id, {
      biometricEnabled: true,
    });

    if (!updatedUser) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

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
router.post('/biometric/disable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const updatedUser = await UserEntity.update(req.user.id, {
      biometricEnabled: false,
    });

    if (!updatedUser) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    return sendSuccess(res, {}, 'Biometric authentication disabled', 200);
  } catch (error) {
    console.error('Disable biometric error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to disable biometric', 500);
  }
});

export default router;
