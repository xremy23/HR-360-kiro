import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import LocationService from '../services/locationService';

const router = Router();

/**
 * POST /location/track
 * Track user location
 */
router.post('/track', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const { latitude, longitude, accuracy, altitude, heading, speed, source } = req.body;

    if (latitude === undefined || longitude === undefined || accuracy === undefined) {
      return sendError(res, 'INVALID_DATA', 'latitude, longitude, and accuracy are required', 400);
    }

    const location = await LocationService.trackLocation(
      req.user.id,
      latitude,
      longitude,
      accuracy,
      source || 'manual',
      altitude,
      heading,
      speed
    );

    return sendSuccess(res, location, 'Location tracked successfully', 201);
  } catch (error) {
    console.error('Track location error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to track location', 500);
  }
});

/**
 * GET /location/current
 * Get current user location
 */
router.get('/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const location = await LocationService.getCurrentLocation(req.user.id);

    if (!location) {
      return sendSuccess(res, null, 'No location data available', 200);
    }

    return sendSuccess(res, location, 'Current location retrieved', 200);
  } catch (error) {
    console.error('Get current location error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get current location', 500);
  }
});

/**
 * GET /location/history
 * Get location history
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    const locations = await LocationService.getLocationHistory(req.user.id, limit, offset);

    return sendSuccess(res, locations, 'Location history retrieved', 200);
  } catch (error) {
    console.error('Get location history error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get location history', 500);
  }
});

/**
 * GET /location/nearby/contacts
 * Get nearby emergency contacts
 */
router.get('/nearby/contacts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const { latitude, longitude, radius } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return sendError(res, 'INVALID_DATA', 'latitude and longitude are required', 400);
    }

    const radiusKm = parseFloat(radius as string) || 10;
    const contacts = await LocationService.getNearbyContacts(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      radiusKm
    );

    return sendSuccess(res, contacts, 'Nearby contacts retrieved', 200);
  } catch (error) {
    console.error('Get nearby contacts error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get nearby contacts', 500);
  }
});

/**
 * GET /location/nearby/services
 * Get nearby services
 */
router.get('/nearby/services', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, type, radius } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return sendError(res, 'INVALID_DATA', 'latitude and longitude are required', 400);
    }

    const radiusKm = parseFloat(radius as string) || 10;
    const services = await LocationService.getNearbyServices(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      radiusKm
    );

    return sendSuccess(res, services, 'Nearby services retrieved', 200);
  } catch (error) {
    console.error('Get nearby services error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get nearby services', 500);
  }
});

/**
 * POST /location/geofence
 * Create geofence
 */
router.post('/geofence', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const { name, latitude, longitude, radiusKm, alertType } = req.body;

    if (!name || latitude === undefined || longitude === undefined || !radiusKm) {
      return sendError(res, 'INVALID_DATA', 'name, latitude, longitude, and radiusKm are required', 400);
    }

    const geofence = await LocationService.createGeofence(
      req.user.id,
      name,
      latitude,
      longitude,
      radiusKm,
      alertType || 'both'
    );

    return sendSuccess(res, geofence, 'Geofence created successfully', 201);
  } catch (error) {
    console.error('Create geofence error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to create geofence', 500);
  }
});

/**
 * GET /location/geofence
 * Get user geofences
 */
router.get('/geofence', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const geofences = await LocationService.getGeofences(req.user.id);

    return sendSuccess(res, geofences, 'Geofences retrieved', 200);
  } catch (error) {
    console.error('Get geofences error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to get geofences', 500);
  }
});

/**
 * PUT /location/geofence/:id
 * Update geofence
 */
router.put('/geofence/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const { id } = req.params;
    const updates = req.body;

    const geofence = await LocationService.updateGeofence(id, updates);

    return sendSuccess(res, geofence, 'Geofence updated successfully', 200);
  } catch (error) {
    console.error('Update geofence error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to update geofence', 500);
  }
});

/**
 * DELETE /location/geofence/:id
 * Delete geofence
 */
router.delete('/geofence/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const { id } = req.params;

    await LocationService.deleteGeofence(id);

    return sendSuccess(res, {}, 'Geofence deleted successfully', 200);
  } catch (error) {
    console.error('Delete geofence error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to delete geofence', 500);
  }
});

/**
 * POST /location/geofence/check
 * Check if current location is within any geofence
 */
router.post('/geofence/check', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return sendError(res, 'INVALID_DATA', 'latitude and longitude are required', 400);
    }

    const geofences = await LocationService.checkGeofence(req.user.id, latitude, longitude);

    return sendSuccess(res, geofences, 'Geofence check completed', 200);
  } catch (error) {
    console.error('Check geofence error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to check geofence', 500);
  }
});

export default router;
