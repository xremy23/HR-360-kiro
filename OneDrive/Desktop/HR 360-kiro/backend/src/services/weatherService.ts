/**
 * Weather Service - PAGASA Integration
 * Placeholder for Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA) API integration
 * 
 * PAGASA provides weather forecasts and typhoon advisories for the Philippines
 */

import axios from 'axios';
import { logger } from './monitoringService';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  advisory?: string;
  timestamp: Date;
}

export interface WeatherAlert {
  id: string;
  type: 'typhoon' | 'heavy_rain' | 'thunderstorm' | 'flood_warning' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedAreas: string[];
  issuedAt: Date;
  validUntil: Date;
}

class WeatherService {
  private readonly PAGASA_API_BASE = process.env.PAGASA_API_URL || 'https://api.pagasa.gov.ph';
  private readonly PAGASA_API_KEY = process.env.PAGASA_API_KEY || '';

  /**
   * Get current weather data for a location
   * @param location - City/Province name in Philippines
   */
  async getWeather(location: string): Promise<WeatherData | null> {
    try {
      logger.info('Fetching weather data from PAGASA', { location });

      if (!this.isConfigured()) {
        logger.debug('PAGASA weather API not yet configured - returning placeholder', { location });
        return {
          location,
          temperature: 28,
          condition: 'Partly Cloudy',
          humidity: 75,
          windSpeed: 15,
          advisory: 'Monitor weather updates from PAGASA',
          timestamp: new Date(),
        };
      }

      const response = await axios.get(`${this.PAGASA_API_BASE}/weather`, {
        params: { location },
        headers: { 'Authorization': `Bearer ${this.PAGASA_API_KEY}` }
      });

      return {
        location: response.data.location || location,
        temperature: response.data.temperature,
        condition: response.data.condition,
        humidity: response.data.humidity,
        windSpeed: response.data.windSpeed,
        advisory: response.data.advisory,
        timestamp: response.data.timestamp ? new Date(response.data.timestamp) : new Date(),
      };
    } catch (error) {
      logger.error('Failed to fetch weather data from PAGASA', { error, location });
      return null;
    }
  }

  /**
   * Get current weather alerts (typhoons, warnings, etc.)
   */
  async getWeatherAlerts(): Promise<WeatherAlert[]> {
    try {
      logger.info('Fetching weather alerts from PAGASA');

      if (!this.isConfigured()) {
        logger.debug('PAGASA alerts API not yet configured - returning empty array');
        return [];
      }

      const response = await axios.get(`${this.PAGASA_API_BASE}/alerts`, {
        headers: { 'Authorization': `Bearer ${this.PAGASA_API_KEY}` }
      });

      if (Array.isArray(response.data)) {
        return response.data.map((alert: any) => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          description: alert.description,
          affectedAreas: alert.affectedAreas || [],
          issuedAt: new Date(alert.issuedAt),
          validUntil: new Date(alert.validUntil),
        }));
      }

      return [];
    } catch (error) {
      logger.error('Failed to fetch weather alerts from PAGASA', { error });
      return [];
    }
  }

  /**
   * Get typhoon information and tracking
   */
  async getTyphoonInfo(): Promise<any> {
    try {
      logger.info('Fetching typhoon information from PAGASA');

      if (!this.isConfigured()) {
        logger.debug('PAGASA typhoon API not yet configured');
        return null;
      }

      const response = await axios.get(`${this.PAGASA_API_BASE}/typhoons`, {
        headers: { 'Authorization': `Bearer ${this.PAGASA_API_KEY}` }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch typhoon information', { error });
      return null;
    }
  }

  /**
   * Validate API configuration
   */
  isConfigured(): boolean {
    return !!this.PAGASA_API_KEY;
  }

  /**
   * Get configuration status for logging
   */
  getConfigStatus(): { isConfigured: boolean; message: string } {
    if (this.isConfigured()) {
      return {
        isConfigured: true,
        message: 'PAGASA API is configured and ready',
      };
    }
    return {
      isConfigured: false,
      message: 'PAGASA_API_KEY not set - using placeholder data only',
    };
  }
}

export const weatherService = new WeatherService();
