/**
 * Location Service Tests
 * Tests for location tracking, geofencing, and nearby services/contacts
 */

import { jest } from '@jest/globals';
import LocationService from '../locationService';
import * as database from '../../config/database';

// Mock database
jest.mock('../../config/database');

const mockedDatabase = database as jest.Mocked<typeof database>;

describe('Location Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackLocation', () => {
    it('should track user location successfully', async () => {
      const mockLocation = {
        id: 'loc-123',
        userId: 'user-123',
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: 100,
        heading: 45,
        speed: 5,
        source: 'checkin' as const,
        createdAt: new Date(),
      };

      mockedDatabase.query.mockResolvedValue({ rows: [mockLocation] } as any);

      const result = await LocationService.trackLocation(
        'user-123',
        40.7128,
        -74.006,
        10,
        'checkin',
        100,
        45,
        5
      );

      expect(result).toEqual(mockLocation);
      expect(mockedDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO location_history'),
        expect.arrayContaining(['user-123', 40.7128, -74.006, 10])
      );
    });

    it('should handle location without optional fields', async () => {
      const mockLocation = {
        id: 'loc-123',
        userId: 'user-123',
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        source: 'manual' as const,
        createdAt: new Date(),
      };

      mockedDatabase.query.mockResolvedValue({ rows: [mockLocation] } as any);

      const result = await LocationService.trackLocation(
        'user-123',
        40.7128,
        -74.006,
        10,
        'manual'
      );

      expect(result).toEqual(mockLocation);
    });

    it('should track location from different sources', async () => {
      const sources = ['checkin', 'background', 'manual'] as const;

      for (const source of sources) {
        mockedDatabase.query.mockResolvedValue({
          rows: [{ id: 'loc-123', userId: 'user-123', source }],
        } as any);

        await LocationService.trackLocation('user-123', 40.7128, -74.006, 10, source);
      }

      expect(mockedDatabase.query).toHaveBeenCalledTimes(3);
    });

    it('should handle database errors', async () => {
      mockedDatabase.query.mockRejectedValue(new Error('Database error'));

      await expect(
        LocationService.trackLocation('user-123', 40.7128, -74.006, 10, 'checkin')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getLocationHistory', () => {
    it('should retrieve location history for user', async () => {
      const mockHistory = [
        {
          id: 'loc-1',
          userId: 'user-123',
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          source: 'checkin',
          createdAt: new Date(),
        },
        {
          id: 'loc-2',
          userId: 'user-123',
          latitude: 40.7129,
          longitude: -74.007,
          accuracy: 12,
          source: 'background',
          createdAt: new Date(),
        },
      ];

      mockedDatabase.query.mockResolvedValue({ rows: mockHistory } as any);

      const result = await LocationService.getLocationHistory('user-123');

      expect(result).toEqual(mockHistory);
      expect(mockedDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['user-123'])
      );
    });

    it('should support pagination', async () => {
      mockedDatabase.query.mockResolvedValue({ rows: [] } as any);

      await LocationService.getLocationHistory('user-123', 50, 100);

      const callArgs = mockedDatabase.query.mock.calls[0];
      expect(callArgs[1]).toContain(50);
      expect(callArgs[1]).toContain(100);
    });

    it('should return empty array when no history', async () => {
      mockedDatabase.query.mockResolvedValue({ rows: [] } as any);

      const result = await LocationService.getLocationHistory('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get most recent location', async () => {
      const mockLocation = {
        id: 'loc-123',
        userId: 'user-123',
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        source: 'checkin',
        createdAt: new Date(),
      };

      mockedDatabase.query.mockResolvedValue({ rows: [mockLocation] } as any);

      const result = await LocationService.getCurrentLocation('user-123');

      expect(result).toEqual(mockLocation);
    });

    it('should return null when no location found', async () => {
      mockedDatabase.query.mockResolvedValue({ rows: [] } as any);

      const result = await LocationService.getCurrentLocation('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getNearbyContacts', () => {
    it('should find nearby contacts using PostGIS', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          distance: 0.5,
          latitude: 40.7129,
          longitude: -74.007,
        },
      ];

      mockedDatabase.query.mockResolvedValue({ rows: mockContacts } as any);

      const result = await LocationService.getNearbyContacts(40.7128, -74.006, 5);

      expect(result).toEqual(mockContacts);
    });

    it('should filter by radius', async () => {
      mockedDatabase.query.mockResolvedValue({ rows: [] } as any);

      await LocationService.getNearbyContacts(40.7128, -74.006, 2);

      const callArgs = mockedDatabase.query.mock.calls[0];
      expect(callArgs[1]).toContain(2);
    });

    it('should handle PostGIS fallback', async () => {
      mockedDatabase.query.mockRejectedValueOnce(new Error('PostGIS not available'));
      mockedDatabase.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'contact-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
            latitude: 40.7129,
            longitude: -74.007,
          },
        ],
      } as any);

      const result = await LocationService.getNearbyContacts(40.7128, -74.006, 5);

      expect(result).toHaveLength(1);
    });
  });

  describe('getNearbyServices', () => {
    it('should find nearby services', async () => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'Hospital',
          type: 'medical',
          address: '123 Main St',
          phone: '555-1234',
          distance: 0.8,
          latitude: 40.7129,
          longitude: -74.007,
        },
      ];

      mockedDatabase.query.mockResolvedValue({ rows: mockServices } as any);

      const result = await LocationService.getNearbyServices(40.7128, -74.006);

      expect(result).toEqual(mockServices);
    });

    it('should handle service lookup errors', async () => {
      mockedDatabase.query.mockRejectedValue(new Error('Database error'));

      const result = await LocationService.getNearbyServices(40.7128, -74.006);

      expect(result).toEqual([]);
    });
  });

  describe('createGeofence', () => {
    it('should create geofence successfully', async () => {
      const mockGeofence = {
        id: 'geofence-123',
        userId: 'user-123',
        name: 'Office',
        latitude: 40.7128,
        longitude: -74.006,
        radiusKm: 0.5,
        alertType: 'both' as const,
        isActive: true,
        createdAt: new Date(),
      };

      mockedDatabase.query.mockResolvedValue({ rows: [mockGeofence] } as any);

      const result = await LocationService.createGeofence(
        'user-123',
        'Office',
        40.7128,
        -74.006,
        0.5,
        'both'
      );

      expect(result).toEqual(mockGeofence);
    });
  });

  describe('getGeofences', () => {
    it('should retrieve user geofences', async () => {
      const mockGeofences = [
        {
          id: 'geofence-1',
          userId: 'user-123',
          name: 'Office',
          latitude: 40.7128,
          longitude: -74.006,
          radiusKm: 0.5,
          alertType: 'both',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      mockedDatabase.query.mockResolvedValue({ rows: mockGeofences } as any);

      const result = await LocationService.getGeofences('user-123');

      expect(result).toEqual(mockGeofences);
    });

    it('should return empty array when no geofences', async () => {
      mockedDatabase.query.mockResolvedValue({ rows: [] } as any);

      const result = await LocationService.getGeofences('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('checkGeofence', () => {
    it('should detect location within geofence', async () => {
      const mockGeofences = [
        {
          id: 'geofence-1',
          userId: 'user-123',
          name: 'Office',
          latitude: 40.7128,
          longitude: -74.006,
          radiusKm: 0.5,
          alertType: 'both',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      mockedDatabase.query.mockResolvedValue({ rows: mockGeofences } as any);

      const result = await LocationService.checkGeofence('user-123', 40.7128, -74.006);

      expect(result).toEqual(mockGeofences);
    });

    it('should return empty array when no geofences triggered', async () => {
      mockedDatabase.query.mockResolvedValue({ rows: [] } as any);

      const result = await LocationService.checkGeofence('user-123', 40.7128, -74.006);

      expect(result).toEqual([]);
    });
  });

  describe('deleteGeofence', () => {
    it('should delete geofence successfully', async () => {
      mockedDatabase.query.mockResolvedValue({ rows: [] } as any);

      await LocationService.deleteGeofence('geofence-123');

      expect(mockedDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM geofences'),
        ['geofence-123']
      );
    });
  });

  describe('updateGeofence', () => {
    it('should update geofence successfully', async () => {
      const mockGeofence = {
        id: 'geofence-123',
        userId: 'user-123',
        name: 'Updated Office',
        latitude: 40.7129,
        longitude: -74.007,
        radiusKm: 1.0,
        alertType: 'entry' as const,
        isActive: true,
        createdAt: new Date(),
      };

      mockedDatabase.query.mockResolvedValue({ rows: [mockGeofence] } as any);

      const result = await LocationService.updateGeofence('geofence-123', {
        name: 'Updated Office',
        radiusKm: 1.0,
      });

      expect(result).toEqual(mockGeofence);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between coordinates', async () => {
      const distance = (LocationService as any).calculateDistance(
        40.7128,
        -74.006,
        42.3601,
        -71.0589
      );

      expect(distance).toBeGreaterThan(200);
      expect(distance).toBeLessThan(350);
    });

    it('should return zero distance for same coordinates', async () => {
      const distance = (LocationService as any).calculateDistance(40.7128, -74.006, 40.7128, -74.006);

      expect(distance).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockedDatabase.query.mockRejectedValue(new Error('Connection refused'));

      await expect(
        LocationService.trackLocation('user-123', 40.7128, -74.006, 10, 'checkin')
      ).rejects.toThrow('Connection refused');
    });
  });
});
