/**
 * Location Route Tests
 * Tests for location tracking and geofencing endpoints
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import locationRouter from '../location';
import { authMiddleware } from '../../middleware/auth';
import LocationService from '../../services/locationService';

// Mock dependencies
jest.mock('../../services/locationService');
jest.mock('../../middleware/auth');

const mockedLocationService = LocationService as jest.Mocked<typeof LocationService>;
const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/location', locationRouter);

describe('Location Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth middleware to add user to request
    mockedAuthMiddleware.mockImplementation(((req: any, res: any, next: any) => {
      req.user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        orgId: 'org-123',
        teamId: 'team-123',
      };
      next();
    }) as any);
  });

  describe('POST /location/track', () => {
    const mockLocation = {
      id: 'location-123',
      userId: 'user-123',
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      altitude: 100,
      heading: 180,
      speed: 5,
      source: 'manual' as const,
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockedLocationService.trackLocation.mockResolvedValue(mockLocation);
    });

    it('should track location successfully', async () => {
      const locationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 100,
        heading: 180,
        speed: 5,
        source: 'gps',
      };

      const response = await request(app)
        .post('/location/track')
        .set('Authorization', 'Bearer valid-token')
        .send(locationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Location tracked successfully');
      expect(response.body.data.id).toBe(mockLocation.id);

      expect(mockedLocationService.trackLocation).toHaveBeenCalledWith(
        'user-123',
        40.7128,
        -74.0060,
        10,
        'gps',
        100,
        180,
        5
      );
    });

    it('should track location with minimal data', async () => {
      const locationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const response = await request(app)
        .post('/location/track')
        .set('Authorization', 'Bearer valid-token')
        .send(locationData);

      expect(response.status).toBe(201);
      expect(mockedLocationService.trackLocation).toHaveBeenCalledWith(
        'user-123',
        40.7128,
        -74.0060,
        10,
        'manual',
        undefined,
        undefined,
        undefined
      );
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        latitude: 40.7128,
        // Missing longitude and accuracy
      };

      const response = await request(app)
        .post('/location/track')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('latitude, longitude, and accuracy are required');
    });

    it('should handle service errors', async () => {
      mockedLocationService.trackLocation.mockRejectedValue(new Error('Service error'));

      const locationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const response = await request(app)
        .post('/location/track')
        .set('Authorization', 'Bearer valid-token')
        .send(locationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to track location');
    });
  });

  describe('GET /location/current', () => {
    const mockCurrentLocation = {
      id: 'location-123',
      userId: 'user-123',
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      source: 'manual' as const,
      createdAt: new Date(),
    };

    it('should get current location successfully', async () => {
      mockedLocationService.getCurrentLocation.mockResolvedValue(mockCurrentLocation);

      const response = await request(app)
        .get('/location/current')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Current location retrieved');
      expect(response.body.data.id).toBe(mockCurrentLocation.id);

      expect(mockedLocationService.getCurrentLocation).toHaveBeenCalledWith('user-123');
    });

    it('should handle no location data available', async () => {
      mockedLocationService.getCurrentLocation.mockResolvedValue(null);

      const response = await request(app)
        .get('/location/current')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('No location data available');
      expect(response.body.data).toBe(null);
    });

    it('should handle service errors', async () => {
      mockedLocationService.getCurrentLocation.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/location/current')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get current location');
    });
  });

  describe('GET /location/history', () => {
    const mockLocationHistory = Array.from({ length: 25 }, (_, i) => ({
      id: `location-${i}`,
      userId: 'user-123',
      latitude: 40.7128 + i * 0.001,
      longitude: -74.0060 + i * 0.001,
      accuracy: 10,
      source: 'manual' as const,
      createdAt: new Date(Date.now() - i * 60000),
    }));

    beforeEach(() => {
      mockedLocationService.getLocationHistory.mockResolvedValue(mockLocationHistory);
    });

    it('should get location history successfully', async () => {
      const response = await request(app)
        .get('/location/history?limit=25&offset=0')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Location history retrieved');
      expect(response.body.data).toHaveLength(25);

      expect(mockedLocationService.getLocationHistory).toHaveBeenCalledWith('user-123', 25, 0);
    });

    it('should use default pagination values', async () => {
      const response = await request(app)
        .get('/location/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedLocationService.getLocationHistory).toHaveBeenCalledWith('user-123', 100, 0);
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app)
        .get('/location/history?limit=2000')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedLocationService.getLocationHistory).toHaveBeenCalledWith('user-123', 1000, 0);
    });

    it('should handle service errors', async () => {
      mockedLocationService.getLocationHistory.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/location/history')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get location history');
    });
  });

  describe('GET /location/nearby/contacts', () => {
    const mockNearbyContacts = [
      {
        id: 'contact-1',
        name: 'Emergency Services',
        email: 'emergency@services.com',
        phone: '+1234567890',
        latitude: 40.7130,
        longitude: -74.0058,
        distance: 0.2,
      },
      {
        id: 'contact-2',
        name: 'Hospital',
        email: 'info@hospital.com',
        phone: '+1234567891',
        latitude: 40.7125,
        longitude: -74.0065,
        distance: 0.5,
      },
    ];

    beforeEach(() => {
      mockedLocationService.getNearbyContacts.mockResolvedValue(mockNearbyContacts);
    });

    it('should get nearby contacts successfully', async () => {
      const response = await request(app)
        .get('/location/nearby/contacts?latitude=40.7128&longitude=-74.0060&radius=5')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Nearby contacts retrieved');
      expect(response.body.data).toHaveLength(2);

      expect(mockedLocationService.getNearbyContacts).toHaveBeenCalledWith(
        40.7128,
        -74.0060,
        5,
        'user-123'
      );
    });

    it('should use default radius when not provided', async () => {
      const response = await request(app)
        .get('/location/nearby/contacts?latitude=40.7128&longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedLocationService.getNearbyContacts).toHaveBeenCalledWith(
        40.7128,
        -74.0060,
        5,
        'user-123'
      );
    });

    it('should reject missing coordinates', async () => {
      const response = await request(app)
        .get('/location/nearby/contacts?latitude=40.7128')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('latitude and longitude are required');
    });

    it('should handle service errors', async () => {
      mockedLocationService.getNearbyContacts.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/location/nearby/contacts?latitude=40.7128&longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get nearby contacts');
    });
  });

  describe('GET /location/nearby/services', () => {
    const mockNearbyServices = [
      {
        id: 'service-1',
        name: 'Fire Station',
        type: 'emergency',
        address: '123 Fire Station Rd',
        phone: '+1234567890',
        latitude: 40.7130,
        longitude: -74.0058,
        distance: 0.3,
      },
      {
        id: 'service-2',
        name: 'Police Station',
        type: 'emergency',
        address: '456 Police Plaza',
        phone: '+1234567891',
        latitude: 40.7125,
        longitude: -74.0065,
        distance: 0.6,
      },
    ];

    beforeEach(() => {
      mockedLocationService.getNearbyServices.mockResolvedValue(mockNearbyServices);
    });

    it('should get nearby services successfully', async () => {
      const response = await request(app)
        .get('/location/nearby/services?latitude=40.7128&longitude=-74.0060&type=emergency&radius=5')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Nearby services retrieved');
      expect(response.body.data).toHaveLength(2);

      expect(mockedLocationService.getNearbyServices).toHaveBeenCalledWith(
        40.7128,
        -74.0060,
        'emergency',
        5
      );
    });

    it('should get services without type filter', async () => {
      const response = await request(app)
        .get('/location/nearby/services?latitude=40.7128&longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockedLocationService.getNearbyServices).toHaveBeenCalledWith(
        40.7128,
        -74.0060,
        undefined,
        5
      );
    });

    it('should reject missing coordinates', async () => {
      const response = await request(app)
        .get('/location/nearby/services?longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('latitude and longitude are required');
    });

    it('should handle service errors', async () => {
      mockedLocationService.getNearbyServices.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/location/nearby/services?latitude=40.7128&longitude=-74.0060')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get nearby services');
    });
  });

  describe('POST /location/geofence', () => {
    const mockGeofence = {
      id: 'geofence-123',
      userId: 'user-123',
      name: 'Home Safe Zone',
      latitude: 40.7128,
      longitude: -74.0060,
      radiusKm: 1,
      alertType: 'both' as const,
      isActive: true,
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockedLocationService.createGeofence.mockResolvedValue(mockGeofence);
    });

    it('should create geofence successfully', async () => {
      const geofenceData = {
        name: 'Home Safe Zone',
        latitude: 40.7128,
        longitude: -74.0060,
        radiusKm: 1,
        alertType: 'both',
      };

      const response = await request(app)
        .post('/location/geofence')
        .set('Authorization', 'Bearer valid-token')
        .send(geofenceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Geofence created successfully');
      expect(response.body.data.id).toBe(mockGeofence.id);

      expect(mockedLocationService.createGeofence).toHaveBeenCalledWith(
        'user-123',
        'Home Safe Zone',
        40.7128,
        -74.0060,
        1,
        'both'
      );
    });

    it('should create geofence with default alert type', async () => {
      const geofenceData = {
        name: 'Work Zone',
        latitude: 40.7128,
        longitude: -74.0060,
        radiusKm: 0.5,
      };

      const response = await request(app)
        .post('/location/geofence')
        .set('Authorization', 'Bearer valid-token')
        .send(geofenceData);

      expect(response.status).toBe(201);
      expect(mockedLocationService.createGeofence).toHaveBeenCalledWith(
        'user-123',
        'Work Zone',
        40.7128,
        -74.0060,
        0.5,
        'both'
      );
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        name: 'Test Zone',
        latitude: 40.7128,
        // Missing longitude and radiusKm
      };

      const response = await request(app)
        .post('/location/geofence')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('name, latitude, longitude, and radiusKm are required');
    });

    it('should handle service errors', async () => {
      mockedLocationService.createGeofence.mockRejectedValue(new Error('Service error'));

      const geofenceData = {
        name: 'Test Zone',
        latitude: 40.7128,
        longitude: -74.0060,
        radiusKm: 1,
      };

      const response = await request(app)
        .post('/location/geofence')
        .set('Authorization', 'Bearer valid-token')
        .send(geofenceData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to create geofence');
    });
  });

  describe('GET /location/geofence', () => {
    const mockGeofences = [
      {
        id: 'geofence-1',
        userId: 'user-123',
        name: 'Home',
        latitude: 40.7128,
        longitude: -74.0060,
        radiusKm: 1,
        alertType: 'both' as const,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'geofence-2',
        userId: 'user-123',
        name: 'Work',
        latitude: 40.7500,
        longitude: -73.9857,
        radiusKm: 0.5,
        alertType: 'entry' as const,
        isActive: true,
        createdAt: new Date(),
      },
    ];

    it('should get user geofences successfully', async () => {
      mockedLocationService.getGeofences.mockResolvedValue(mockGeofences);

      const response = await request(app)
        .get('/location/geofence')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Geofences retrieved');
      expect(response.body.data).toHaveLength(2);

      expect(mockedLocationService.getGeofences).toHaveBeenCalledWith('user-123');
    });

    it('should handle service errors', async () => {
      mockedLocationService.getGeofences.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/location/geofence')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to get geofences');
    });
  });

  describe('PUT /location/geofence/:id', () => {
    const mockUpdatedGeofence = {
      id: 'geofence-123',
      userId: 'user-123',
      name: 'Updated Home Zone',
      latitude: 40.7128,
      longitude: -74.0060,
      radiusKm: 2,
      alertType: 'exit' as const,
      isActive: true,
      createdAt: new Date(),
    };

    it('should update geofence successfully', async () => {
      mockedLocationService.updateGeofence.mockResolvedValue(mockUpdatedGeofence);

      const updateData = {
        name: 'Updated Home Zone',
        radiusKm: 2,
        alertType: 'exit',
      };

      const response = await request(app)
        .put('/location/geofence/geofence-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Geofence updated successfully');
      expect(response.body.data.name).toBe('Updated Home Zone');

      expect(mockedLocationService.updateGeofence).toHaveBeenCalledWith('geofence-123', updateData);
    });

    it('should handle service errors', async () => {
      mockedLocationService.updateGeofence.mockRejectedValue(new Error('Service error'));

      const updateData = {
        name: 'Updated Zone',
      };

      const response = await request(app)
        .put('/location/geofence/geofence-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to update geofence');
    });
  });

  describe('DELETE /location/geofence/:id', () => {
    it('should delete geofence successfully', async () => {
      mockedLocationService.deleteGeofence.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/location/geofence/geofence-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Geofence deleted successfully');
      expect(response.body.data).toEqual({});

      expect(mockedLocationService.deleteGeofence).toHaveBeenCalledWith('geofence-123');
    });

    it('should handle service errors', async () => {
      mockedLocationService.deleteGeofence.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .delete('/location/geofence/geofence-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to delete geofence');
    });
  });

  describe('POST /location/geofence/check', () => {
    const mockGeofenceCheck = [
      {
        id: 'geofence-1',
        userId: 'user-123',
        name: 'Home',
        latitude: 40.7128,
        longitude: -74.0060,
        radiusKm: 1,
        alertType: 'both' as const,
        isActive: true,
        createdAt: new Date(),
      },
    ];

    it('should check geofence successfully', async () => {
      mockedLocationService.checkGeofence.mockResolvedValue(mockGeofenceCheck);

      const checkData = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const response = await request(app)
        .post('/location/geofence/check')
        .set('Authorization', 'Bearer valid-token')
        .send(checkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Geofence check completed');
      expect(response.body.data).toHaveLength(1);

      expect(mockedLocationService.checkGeofence).toHaveBeenCalledWith(
        'user-123',
        40.7128,
        -74.0060
      );
    });

    it('should reject missing coordinates', async () => {
      const incompleteData = {
        latitude: 40.7128,
        // Missing longitude
      };

      const response = await request(app)
        .post('/location/geofence/check')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATA');
      expect(response.body.error.message).toBe('latitude and longitude are required');
    });

    it('should handle service errors', async () => {
      mockedLocationService.checkGeofence.mockRejectedValue(new Error('Service error'));

      const checkData = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const response = await request(app)
        .post('/location/geofence/check')
        .set('Authorization', 'Bearer valid-token')
        .send(checkData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_ERROR');
      expect(response.body.error.message).toBe('Failed to check geofence');
    });
  });
});

/**
 * Test Coverage Summary for Location Routes:
 * 
 * ✅ POST /location/track - Track user location with GPS data
 * ✅ GET /location/current - Get current user location
 * ✅ GET /location/history - Get location history with pagination
 * ✅ GET /location/nearby/contacts - Find nearby emergency contacts
 * ✅ GET /location/nearby/services - Find nearby services by type
 * ✅ POST /location/geofence - Create geofence zones
 * ✅ GET /location/geofence - Get user geofences
 * ✅ PUT /location/geofence/:id - Update geofence settings
 * ✅ DELETE /location/geofence/:id - Delete geofence
 * ✅ POST /location/geofence/check - Check if location is within geofences
 * 
 * Coverage includes:
 * - Location tracking with GPS metadata
 * - Coordinate validation and error handling
 * - Geofencing functionality for safety zones
 * - Nearby services and contacts discovery
 * - Location history with pagination
 * - Service integration and error scenarios
 */