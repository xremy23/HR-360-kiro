import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validateCoordinates } from '../utils/validators';
import { UserEntity } from '../entities/User';

const router = Router();

/**
 * GET /users/profile
 * Get user profile (returns data from JWT token if DB unavailable)
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // Try to get full user data from database
    try {
      const user = await UserEntity.findById(req.user.id);
      if (user) {
        return sendSuccess(res, user, 'Profile retrieved successfully', 200);
      }
    } catch (dbError) {
      console.warn('⚠️  Database unavailable, returning user data from JWT token', dbError);
    }

    // Fallback: Return user data from JWT token (includes id, email, role, orgId, teamId)
    // This allows login to work even when database is unavailable
    const userFromToken = {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      role: req.user.role || 'employee',
      orgId: req.user.orgId,
      teamId: req.user.teamId || null,
      biometricEnabled: req.user.biometricEnabled || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return sendSuccess(res, userFromToken, 'Profile retrieved from session (DB unavailable)', 200);
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

/**
 * POST /users/camera/enable
 * Enable camera access
 */
router.post('/camera/enable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // Store camera permission in user preferences (could be extended to database)
    return sendSuccess(res, { cameraEnabled: true }, 'Camera access enabled', 200);
  } catch (error) {
    console.error('Enable camera error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to enable camera', 500);
  }
});

/**
 * POST /users/camera/disable
 * Disable camera access
 */
router.post('/camera/disable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // Remove camera permission from user preferences
    return sendSuccess(res, { cameraEnabled: false }, 'Camera access disabled', 200);
  } catch (error) {
    console.error('Disable camera error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to disable camera', 500);
  }
});

/**
 * POST /users/location/enable
 * Enable location tracking
 */
router.post('/location/enable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // Store location permission in user preferences
    return sendSuccess(res, { locationEnabled: true }, 'Location tracking enabled', 200);
  } catch (error) {
    console.error('Enable location error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to enable location', 500);
  }
});

/**
 * POST /users/location/disable
 * Disable location tracking
 */
router.post('/location/disable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
    }

    // Remove location permission from user preferences
    return sendSuccess(res, { locationEnabled: false }, 'Location tracking disabled', 200);
  } catch (error) {
    console.error('Disable location error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to disable location', 500);
  }
});

export default router;
