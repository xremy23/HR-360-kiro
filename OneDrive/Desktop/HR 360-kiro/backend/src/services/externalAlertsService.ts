/**
 * External Alerts Service
 * Fetches real-time disaster and weather alerts from live sources
 * - USGS Earthquake API (Philippines region) - LIVE DATA
 * - PAGASA (Philippine weather service) - placeholder
 * - PHIVOLCS (Philippine volcanology) - placeholder
 * - NDRRMC (National disaster management) - placeholder
 */

import axios from 'axios';
import { logger } from './monitoringService';

export interface ExternalAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'weather' | 'volcanic' | 'disaster' | 'infrastructure' | 'earthquake';
  source: 'usgs' | 'pagasa' | 'phivolcs' | 'ndrrmc';
  url?: string;
  isActive: boolean;
  created_at: string;
  timestamp?: string;
}

class ExternalAlertsService {
  private readonly USGS_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * Fetch all external alerts from all sources
   */
  async fetchAllExternalAlerts(): Promise<ExternalAlert[]> {
    try {
      logger.info('Fetching all external alerts');
      
      const alerts: ExternalAlert[] = [];

      // Fetch from USGS (working real data)
      const usgsAlerts = await this.fetchUSGSEarthquakeAlerts();
      alerts.push(...usgsAlerts);

      // Fetch from PAGASA (placeholder - API not accessible)
      const pagasaAlerts = await this.fetchPagasaAlerts();
      alerts.push(...pagasaAlerts);

      // Fetch from PHIVOLCS (placeholder)
      const phivolcsAlerts = await this.fetchPhilvolcsAlerts();
      alerts.push(...phivolcsAlerts);

      // Fetch from NDRRMC (placeholder)
      const ndrrrrmcAlerts = await this.fetchNDRRMCAlerts();
      alerts.push(...ndrrrrmcAlerts);

      logger.info(`Fetched ${alerts.length} total external alerts`);
      return alerts;
    } catch (error) {
      logger.error('Error fetching all external alerts:', { error });
      return [];
    }
  }

  /**
   * Fetch USGS Earthquake data for Philippines region (REAL DATA)
   */
  async fetchUSGSEarthquakeAlerts(): Promise<ExternalAlert[]> {
    try {
      const cached = this.getFromCache('usgs');
      if (cached) {
        logger.debug('Returning cached USGS earthquake data');
        return cached;
      }

      logger.info('Fetching earthquake data from USGS API');
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 7); // Last 7 days

      const response = await axios.get(this.USGS_API, {
        params: {
          format: 'geojson',
          starttime: startTime.toISOString().split('T')[0],
          minlatitude: 5,
          maxlatitude: 20,
          minlongitude: 120,
          maxlongitude: 130,
          minmagnitude: 4.5, // Only significant earthquakes
          orderby: 'time',
          limit: 50,
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'CICT-Safety-Portal',
        },
      });

      const alerts: ExternalAlert[] = [];

      if (response.data?.features && Array.isArray(response.data.features)) {
        response.data.features.forEach((feature: any, index: number) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;
          const magnitude = props.mag || 0;
          const timestamp = new Date(props.time);

          // Map magnitude to severity
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (magnitude >= 7) severity = 'critical';
          else if (magnitude >= 6) severity = 'high';
          else if (magnitude >= 5.5) severity = 'medium';
          else severity = 'low';

          const location = props.place || `${coords[1].toFixed(2)}°N, ${coords[0].toFixed(2)}°E`;

          alerts.push({
            id: `usgs-earthquake-${props.code || Date.now()}-${index}`,
            title: `Earthquake M${magnitude} - ${location}`,
            description: `Magnitude ${magnitude} earthquake at ${location}, depth ${coords[2]}km. Time: ${timestamp.toLocaleString()}`,
            severity,
            type: 'earthquake',
            source: 'usgs',
            url: props.url,
            isActive: true,
            created_at: timestamp.toISOString(),
            timestamp: timestamp.toISOString(),
          });
        });
      }

      logger.info(`Fetched ${alerts.length} earthquake alerts from USGS`);
      this.setCache('usgs', alerts);
      return alerts;
    } catch (error) {
      logger.error('Error fetching from USGS:', { error });
      return [];
    }
  }

  /**
   * Fetch PAGASA weather alerts (PLACEHOLDER - API not publicly accessible)
   */
  async fetchPagasaAlerts(): Promise<ExternalAlert[]> {
    try {
      logger.warn('PAGASA API not available - would need official partnership');
      return [];
    } catch (error) {
      logger.error('Error with PAGASA alerts:', { error });
      return [];
    }
  }

  /**
   * Fetch PHIVOLCS volcanic alerts (PLACEHOLDER)
   */
  async fetchPhilvolcsAlerts(): Promise<ExternalAlert[]> {
    try {
      logger.warn('PHIVOLCS API requires configuration');
      return [];
    } catch (error) {
      logger.error('Error with PHIVOLCS alerts:', { error });
      return [];
    }
  }

  /**
   * Fetch NDRRMC disaster alerts (PLACEHOLDER)
   */
  async fetchNDRRMCAlerts(): Promise<ExternalAlert[]> {
    try {
      logger.warn('NDRRMC API requires configuration');
      return [];
    } catch (error) {
      logger.error('Error with NDRRMC alerts:', { error });
      return [];
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

export const externalAlertsService = new ExternalAlertsService();
