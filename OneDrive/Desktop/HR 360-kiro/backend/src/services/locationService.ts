import { query } from '../config/database';

export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  source: 'checkin' | 'background' | 'manual';
  createdAt: Date;
}

export interface NearbyContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  distance: number; // in kilometers
  latitude: number;
  longitude: number;
}

export interface NearbyService {
  id: string;
  name: string;
  type: string;
  distance: number; // in kilometers
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
}

export interface Geofence {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  alertType: 'entry' | 'exit' | 'both';
  isActive: boolean;
  createdAt: Date;
}

class LocationService {
  /**
   * Track user location
   */
  static async trackLocation(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    source: 'checkin' | 'background' | 'manual',
    altitude?: number,
    heading?: number,
    speed?: number
  ): Promise<Location> {
    const result = await query(
      `INSERT INTO location_history (user_id, latitude, longitude, accuracy, altitude, heading, speed, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id as "userId", latitude, longitude, accuracy, altitude, heading, speed, source, created_at as "createdAt"`,
      [userId, latitude, longitude, accuracy, altitude || null, heading || null, speed || null, source]
    );
    return result.rows[0];
  }

  /**
   * Get location history for user
   */
  static async getLocationHistory(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Location[]> {
    const result = await query(
      `SELECT id, user_id as "userId", latitude, longitude, accuracy, altitude, heading, speed, source, created_at as "createdAt"
       FROM location_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get current user location (most recent)
   */
  static async getCurrentLocation(userId: string): Promise<Location | null> {
    const result = await query(
      `SELECT id, user_id as "userId", latitude, longitude, accuracy, altitude, heading, speed, source, created_at as "createdAt"
       FROM location_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get nearby contacts using PostGIS
   * Requires PostGIS extension: CREATE EXTENSION IF NOT EXISTS postgis;
   */
  static async getNearbyContacts(
    latitude: number,
    longitude: number,
    radiusKm: number,
    userId?: string
  ): Promise<NearbyContact[]> {
    try {
      const result = await query(
        `SELECT 
          c.id, 
          c.name, 
          c.email, 
          c.phone,
          ST_Distance(
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            ST_SetSRID(ST_MakePoint(c.latitude, c.longitude), 4326)::geography
          ) / 1000 as distance,
          c.latitude,
          c.longitude
        FROM emergency_contacts c
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          ST_SetSRID(ST_MakePoint(c.latitude, c.longitude), 4326)::geography,
          $3 * 1000
        )
        ${userId ? 'AND c.user_id = $4' : ''}
        ORDER BY distance ASC`,
        userId ? [longitude, latitude, radiusKm, userId] : [longitude, latitude, radiusKm]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting nearby contacts:', error);
      // Fallback to simple distance calculation if PostGIS not available
      return this.getNearbyContactsFallback(latitude, longitude, radiusKm, userId);
    }
  }

  /**
   * Fallback method for nearby contacts (without PostGIS)
   */
  private static async getNearbyContactsFallback(
    latitude: number,
    longitude: number,
    radiusKm: number,
    userId?: string
  ): Promise<NearbyContact[]> {
    const result = await query(
      `SELECT id, name, email, phone, latitude, longitude
       FROM emergency_contacts
       ${userId ? 'WHERE user_id = $1' : ''}`,
      userId ? [userId] : []
    );

    // Calculate distance using Haversine formula
    const nearby = result.rows
      .map(contact => ({
        ...contact,
        distance: this.calculateDistance(latitude, longitude, contact.latitude, contact.longitude),
      }))
      .filter(contact => contact.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return nearby;
  }

  /**
   * Get nearby services
   */
  static async getNearbyServices(
    latitude: number,
    longitude: number,
    serviceType?: string,
    radiusKm: number = 5
  ): Promise<NearbyService[]> {
    try {
      let query_str = `SELECT 
        id, 
        name, 
        type,
        address,
        phone,
        ST_Distance(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          ST_SetSRID(ST_MakePoint(latitude, longitude), 4326)::geography
        ) / 1000 as distance,
        latitude,
        longitude
      FROM nearby_services
      WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        ST_SetSRID(ST_MakePoint(latitude, longitude), 4326)::geography,
        $3 * 1000
      )`;

      const params: any[] = [longitude, latitude, radiusKm];

      if (serviceType) {
        query_str += ` AND type = $${params.length + 1}`;
        params.push(serviceType);
      }

      query_str += ` ORDER BY distance ASC`;

      const result = await query(query_str, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting nearby services:', error);
      return [];
    }
  }

  /**
   * Create geofence
   */
  static async createGeofence(
    userId: string,
    name: string,
    latitude: number,
    longitude: number,
    radiusKm: number,
    alertType: 'entry' | 'exit' | 'both' = 'both'
  ): Promise<Geofence> {
    const result = await query(
      `INSERT INTO geofences (user_id, name, latitude, longitude, radius_km, alert_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"`,
      [userId, name, latitude, longitude, radiusKm, alertType]
    );
    return result.rows[0];
  }

  /**
   * Get geofences for user
   */
  static async getGeofences(userId: string): Promise<Geofence[]> {
    const result = await query(
      `SELECT id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"
       FROM geofences
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Check if location is within geofence
   */
  static async checkGeofence(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<Geofence[]> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"
         FROM geofences
         WHERE user_id = $1
         AND is_active = true
         AND ST_DWithin(
           ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
           ST_SetSRID(ST_MakePoint(latitude, longitude), 4326)::geography,
           radius_km * 1000
         )`,
        [userId, longitude, latitude]
      );
      return result.rows;
    } catch (error) {
      console.error('Error checking geofence:', error);
      // Fallback to simple distance calculation
      const geofences = await query(
        `SELECT id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"
         FROM geofences
         WHERE user_id = $1 AND is_active = true`,
        [userId]
      );

      return geofences.rows.filter(geofence => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          geofence.latitude,
          geofence.longitude
        );
        return distance <= geofence.radiusKm;
      });
    }
  }

  /**
   * Delete geofence
   */
  static async deleteGeofence(geofenceId: string): Promise<void> {
    await query('DELETE FROM geofences WHERE id = $1', [geofenceId]);
  }

  /**
   * Update geofence
   */
  static async updateGeofence(
    geofenceId: string,
    updates: Partial<Geofence>
  ): Promise<Geofence> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.latitude !== undefined) {
      fields.push(`latitude = $${paramCount++}`);
      values.push(updates.latitude);
    }
    if (updates.longitude !== undefined) {
      fields.push(`longitude = $${paramCount++}`);
      values.push(updates.longitude);
    }
    if (updates.radiusKm !== undefined) {
      fields.push(`radius_km = $${paramCount++}`);
      values.push(updates.radiusKm);
    }
    if (updates.alertType !== undefined) {
      fields.push(`alert_type = $${paramCount++}`);
      values.push(updates.alertType);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }

    values.push(geofenceId);

    const result = await query(
      `UPDATE geofences SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"`,
      values
    );

    return result.rows[0];
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export default LocationService;
