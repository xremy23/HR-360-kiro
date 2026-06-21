/**
 * Earthquake Service - PHIVOLCS/USGS Integration
 * Fetches real earthquake data from USGS and PHIVOLCS
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { logger } from './monitoringService';

export interface EarthquakeBulletin {
  id: string;
  title: string;
  description: string;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  location: string;
  timestamp: Date;
  felt?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  created_at?: Date;
  source?: 'usgs' | 'phivolcs';
}

export interface VolcanoUpdate {
  id: string;
  volcanName: string;
  alertLevel: 'normal' | 'advisory' | 'warning' | 'critical';
  description: string;
  timestamp: Date;
}

class EarthquakeService {
  private readonly USGS_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
  private readonly PHIVOLCS_RSS_URL = process.env.PHIVOLCS_RSS_URL || 'https://www.phivolcs.dost.gov.ph/rss';
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * Get recent earthquake bulletins from USGS for Philippines region
   */
  async getEarthquakeBulletins(): Promise<EarthquakeBulletin[]> {
    try {
      const cached = this.getFromCache('earthquakes');
      if (cached) {
        logger.debug('Returning cached earthquake bulletins');
        return cached;
      }

      logger.info('Fetching earthquake bulletins from USGS');
      
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 7); // Last 7 days

      // Query USGS API for Philippines region
      // Coordinates: Philippines bounding box (5-20N, 120-130E)
      const response = await axios.get(this.USGS_API, {
        params: {
          format: 'geojson',
          starttime: startTime.toISOString().split('T')[0],
          minlatitude: 5,
          maxlatitude: 20,
          minlongitude: 120,
          maxlongitude: 130,
          minmagnitude: 4.0, // Only significant earthquakes
          orderby: 'time',
          limit: 100,
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'CICT-Safety-Portal',
        },
      });

      const bulletins: EarthquakeBulletin[] = [];

      if (response.data?.features && Array.isArray(response.data.features)) {
        response.data.features.forEach((feature: any, index: number) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;
          const magnitude = props.mag || 0;

          // Convert magnitude to severity
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (magnitude >= 7) severity = 'critical';
          else if (magnitude >= 6) severity = 'high';
          else if (magnitude >= 5.5) severity = 'medium';
          else severity = 'low';

          const location = props.place || `${coords[1].toFixed(2)}°N, ${coords[0].toFixed(2)}°E`;

          bulletins.push({
            id: `usgs-${props.code || Date.now()}-${index}`,
            title: `Earthquake M${magnitude} - ${location}`,
            description: `Location: ${location} | Depth: ${coords[2]}km | Magnitude: ${magnitude} | ${new Date(props.time).toLocaleString()}`,
            magnitude,
            depth: coords[2],
            latitude: coords[1],
            longitude: coords[0],
            location,
            timestamp: new Date(props.time),
            severity,
            created_at: new Date(props.time),
            source: 'usgs',
          });
        });
      }

      logger.info(`Fetched ${bulletins.length} earthquake bulletins from USGS`);
      this.setCache('earthquakes', bulletins);
      return bulletins;
    } catch (error) {
      logger.error('Failed to fetch earthquake bulletins from USGS', { error });
      return [];
    }
  }

  /**
   * Get volcano updates from PHIVOLCS RSS
   */
  async getVolcanoUpdates(): Promise<VolcanoUpdate[]> {
    try {
      const cached = this.getFromCache('volcanoes');
      if (cached) {
        logger.debug('Returning cached volcano updates');
        return cached;
      }

      logger.info('Fetching volcano updates from PHIVOLCS RSS');

      const response = await axios.get(this.PHIVOLCS_RSS_URL, {
        timeout: 15000,
        headers: {
          'User-Agent': 'CICT-Safety-Portal',
        },
      });

      const parsed = await parseStringPromise(response.data);
      const updates: VolcanoUpdate[] = [];

      // Parse RSS items (structure depends on PHIVOLCS RSS format)
      const items = parsed.rss?.channel?.[0]?.item || [];

      items.forEach((item: any, index: number) => {
        if (item.title?.[0]?.includes('Volcano')) {
          const alertLevel = this.parseVolcanoAlertLevel(item.description?.[0] || '');
          updates.push({
            id: `phivolcs-volcano-${index}`,
            volcanName: item.title?.[0] || 'Unknown Volcano',
            alertLevel,
            description: item.description?.[0] || '',
            timestamp: new Date(item.pubDate?.[0] || new Date()),
          });
        }
      });

      logger.info(`Fetched ${updates.length} volcano updates from PHIVOLCS`);
      this.setCache('volcanoes', updates);
      return updates;
    } catch (error) {
      logger.warn('Failed to fetch volcano updates from PHIVOLCS RSS', { error });
      return [];
    }
  }

  /**
   * Check for recent significant earthquakes in the last N hours
   */
  async getRecentSignificantEarthquakes(hours: number = 24): Promise<EarthquakeBulletin[]> {
    try {
      logger.info(`Fetching significant earthquakes from past ${hours} hours`);
      const bulletins = await this.getEarthquakeBulletins();
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      return bulletins.filter(b => {
        const isSignificant = b.magnitude >= 4.5; // Significant threshold
        const isRecent = new Date(b.timestamp) >= cutoffTime;
        return isSignificant && isRecent;
      });
    } catch (error) {
      logger.error('Failed to filter significant earthquakes', { error });
      return [];
    }
  }

  /**
   * Parse volcano alert level from description text
   */
  private parseVolcanoAlertLevel(description: string): 'normal' | 'advisory' | 'warning' | 'critical' {
    const lower = description.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency')) return 'critical';
    if (lower.includes('warning')) return 'warning';
    if (lower.includes('advisory')) return 'advisory';
    return 'normal';
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

  /**
   * Validate configuration status
   */
  isConfigured(): boolean {
    return !!process.env.PHIVOLCS_RSS_URL;
  }

  /**
   * Get configuration status for logging
   */
  getConfigStatus(): { isConfigured: boolean; message: string } {
    return {
      isConfigured: true,
      message: 'Earthquake service is using USGS API (live data) + PHIVOLCS RSS',
    };
  }
}

export const earthquakeService = new EarthquakeService();
