/**
 * Alert Aggregator Service
 * Aggregates disaster and emergency alerts from multiple sources:
 * - NDRRMC (National Disaster Risk Reduction and Management Council)
 * - ReliefWeb (International humanitarian information platform)
 * - Local emergency services
 * 
 * Consolidates all alerts into a unified dashboard
 */

import axios from 'axios';
import { logger } from './monitoringService';

export interface DisasterAlert {
  id: string;
  source: 'ndrrmc' | 'reliefweb' | 'pagasa' | 'phivolcs' | 'local';
  type: 'typhoon' | 'earthquake' | 'flood' | 'landslide' | 'volcano' | 'fire' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedAreas: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  lastUpdated: Date;
  externalUrl?: string;
}

export interface AggregatedAlerts {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  alerts: DisasterAlert[];
  lastRefreshed: Date;
}

class AlertAggregatorService {
  private readonly NDRRMC_API_URL = process.env.NDRRMC_API_URL || 'https://www.ndrrmc.gov.ph/api';
  private readonly RELIEFWEB_API_URL = process.env.RELIEFWEB_API_URL || 'https://reliefweb.int/api/v1';
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  private alertsCache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * Get all aggregated disaster alerts
   */
  async getAggregatedAlerts(): Promise<AggregatedAlerts> {
    try {
      logger.info('Aggregating disaster alerts from all sources');

      const alerts: DisasterAlert[] = [];

      // Fetch from all sources in parallel
      const [ndrrmc, reliefweb] = await Promise.allSettled([
        this.getNDRRMCAlerts(),
        this.getReliefWebAlerts(),
      ]);

      if (ndrrmc.status === 'fulfilled' && ndrrmc.value) {
        alerts.push(...ndrrmc.value);
      }
      if (reliefweb.status === 'fulfilled' && reliefweb.value) {
        alerts.push(...reliefweb.value);
      }

      // Sort by severity and timestamp
      alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Count by severity
      const severityCounts = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      };

      logger.info('Successfully aggregated disaster alerts', {
        total: alerts.length,
        critical: severityCounts.critical,
        high: severityCounts.high,
      });

      return {
        total: alerts.length,
        critical: severityCounts.critical,
        high: severityCounts.high,
        medium: severityCounts.medium,
        low: severityCounts.low,
        alerts,
        lastRefreshed: new Date(),
      };
    } catch (error) {
      logger.error('Failed to aggregate disaster alerts', { error });
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        alerts: [],
        lastRefreshed: new Date(),
      };
    }
  }

  /**
   * Get alerts from NDRRMC (National Disaster Risk Reduction and Management Council)
   */
  private async getNDRRMCAlerts(): Promise<DisasterAlert[]> {
    try {
      const cached = this.alertsCache.get('ndrrmc');
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug('Returning cached NDRRMC alerts');
        return cached.data;
      }

      logger.info('Fetching NDRRMC alerts');

      // TODO: Implement actual NDRRMC API call when endpoint is available
      // const response = await axios.get(`${this.NDRRMC_API_URL}/alerts`, {
      //   params: { country: 'PH', active: true }
      // });
      // return this.mapNDRRMCToAlerts(response.data);

      logger.debug('NDRRMC API not yet configured - returning placeholder');
      return [];
    } catch (error) {
      logger.error('Failed to fetch NDRRMC alerts', { error });
      return [];
    }
  }

  /**
   * Get alerts from ReliefWeb
   */
  private async getReliefWebAlerts(): Promise<DisasterAlert[]> {
    try {
      const cached = this.alertsCache.get('reliefweb');
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug('Returning cached ReliefWeb alerts');
        return cached.data;
      }

      logger.info('Fetching ReliefWeb alerts');

      // TODO: Implement ReliefWeb API call
      // ReliefWeb has public endpoints, no auth typically needed
      // const response = await axios.get(`${this.RELIEFWEB_API_URL}/alerts`, {
      //   params: {
      //     'filter[operator]': 'AND',
      //     'filter[conditions][0][field]': 'country.exact',
      //     'filter[conditions][0][value]': 'Philippines',
      //     'filter[conditions][1][field]': 'status',
      //     'filter[conditions][1][value]': 'current',
      //     limit: 50
      //   }
      // });
      // return this.mapReliefWebToAlerts(response.data);

      logger.debug('ReliefWeb API not yet configured - returning placeholder');
      return [];
    } catch (error) {
      logger.error('Failed to fetch ReliefWeb alerts', { error });
      return [];
    }
  }

  /**
   * Filter alerts by affected province
   */
  async getAlertsByProvince(province: string): Promise<DisasterAlert[]> {
    try {
      const allAlerts = await this.getAggregatedAlerts();
      return allAlerts.alerts.filter(alert =>
        alert.affectedAreas.some(area =>
          area.toLowerCase().includes(province.toLowerCase())
        )
      );
    } catch (error) {
      logger.error('Failed to filter alerts by province', { error, province });
      return [];
    }
  }

  /**
   * Get critical alerts only
   */
  async getCriticalAlerts(): Promise<DisasterAlert[]> {
    try {
      const allAlerts = await this.getAggregatedAlerts();
      return allAlerts.alerts.filter(a => a.severity === 'critical');
    } catch (error) {
      logger.error('Failed to get critical alerts', { error });
      return [];
    }
  }

  /**
   * Map NDRRMC data to alert format
   */
  private mapNDRRMCToAlerts(data: any): DisasterAlert[] {
    if (!data) return [];

    try {
      // Handle different potential wrapper structures (data, items, alerts, or plain array)
      let items: any[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.alerts && Array.isArray(data.alerts)) {
        items = data.alerts;
      } else {
        // If it's a single object that looks like an alert, wrap it
        items = [data];
      }

      return items.map((item: any) => {
        // Fallback extractors for various common field names
        const extractField = (fields: string[], fallback: string = '') => {
          for (const field of fields) {
            if (item[field] !== undefined && item[field] !== null) {
              return String(item[field]);
            }
          }
          return fallback;
        };

        const id = extractField(['id', 'guid', 'uuid', 'reference_id', 'alert_id'], `ndrrmc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

        const rawType = extractField(['type', 'category', 'event_type', 'hazard']).toLowerCase();
        let mappedType: DisasterAlert['type'] = 'other';
        if (rawType.includes('typhoon') || rawType.includes('cyclone') || rawType.includes('storm')) mappedType = 'typhoon';
        else if (rawType.includes('earthquake') || rawType.includes('seismic')) mappedType = 'earthquake';
        else if (rawType.includes('flood')) mappedType = 'flood';
        else if (rawType.includes('landslide') || rawType.includes('mudslide')) mappedType = 'landslide';
        else if (rawType.includes('volcano') || rawType.includes('eruption')) mappedType = 'volcano';
        else if (rawType.includes('fire')) mappedType = 'fire';

        const rawSeverity = extractField(['severity', 'level', 'urgency', 'priority']).toLowerCase();
        let mappedSeverity: DisasterAlert['severity'] = 'low';
        if (rawSeverity.includes('critical') || rawSeverity.includes('extreme') || rawSeverity === '4' || rawSeverity === '5') mappedSeverity = 'critical';
        else if (rawSeverity.includes('high') || rawSeverity.includes('severe') || rawSeverity === '3') mappedSeverity = 'high';
        else if (rawSeverity.includes('medium') || rawSeverity.includes('moderate') || rawSeverity === '2') mappedSeverity = 'medium';

        const title = extractField(['title', 'headline', 'subject', 'name'], 'NDRRMC Alert');
        const description = extractField(['description', 'details', 'summary', 'message'], 'No details provided.');

        // Extract affected areas (might be an array or comma-separated string)
        let affectedAreas: string[] = [];
        if (Array.isArray(item.affected_areas)) affectedAreas = item.affected_areas;
        else if (Array.isArray(item.areas)) affectedAreas = item.areas;
        else if (Array.isArray(item.provinces)) affectedAreas = item.provinces;
        else if (typeof item.affected_areas === 'string') affectedAreas = item.affected_areas.split(',').map((s: string) => s.trim());
        else if (typeof item.location === 'string') affectedAreas = [item.location];
        else affectedAreas = ['Philippines']; // Default fallback

        // Extract coordinates if available
        let coordinates: { latitude: number; longitude: number } | undefined;
        if (item.coordinates && typeof item.coordinates.lat === 'number' && typeof item.coordinates.lon === 'number') {
          coordinates = { latitude: item.coordinates.lat, longitude: item.coordinates.lon };
        } else if (item.latitude && item.longitude) {
          coordinates = { latitude: Number(item.latitude), longitude: Number(item.longitude) };
        }

        // Extract timestamps
        const timestampStr = extractField(['timestamp', 'created_at', 'date', 'issued_at']);
        const timestamp = timestampStr ? new Date(timestampStr) : new Date();

        const lastUpdatedStr = extractField(['last_updated', 'updated_at', 'modified_at']);
        const lastUpdated = lastUpdatedStr ? new Date(lastUpdatedStr) : timestamp;

        const externalUrl = extractField(['url', 'link', 'source_url', 'reference_link']);

        return {
          id,
          source: 'ndrrmc',
          type: mappedType,
          severity: mappedSeverity,
          title,
          description,
          affectedAreas,
          ...(coordinates && { coordinates }),
          timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
          lastUpdated: isNaN(lastUpdated.getTime()) ? new Date() : lastUpdated,
          ...(externalUrl && { externalUrl })
        };
      });
    } catch (error) {
      logger.error('Error mapping NDRRMC data', { error });
      return [];
    }
  }

  /**
   * Map ReliefWeb data to alert format
   */
  private mapReliefWebToAlerts(data: any): DisasterAlert[] {
    // TODO: Implement mapping based on ReliefWeb API response format
    return [];
  }

  /**
   * Check if services are configured
   */
  isConfigured(): boolean {
    return !!process.env.NDRRMC_API_URL || !!process.env.RELIEFWEB_API_URL;
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { isConfigured: boolean; sources: string[] } {
    const sources: string[] = [];
    if (process.env.NDRRMC_API_URL) sources.push('NDRRMC');
    if (process.env.RELIEFWEB_API_URL) sources.push('ReliefWeb');

    return {
      isConfigured: sources.length > 0,
      sources: sources.length > 0 ? sources : ['placeholder'],
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.alertsCache.clear();
    logger.info('Alert aggregator cache cleared');
  }
}

export const alertAggregatorService = new AlertAggregatorService();
