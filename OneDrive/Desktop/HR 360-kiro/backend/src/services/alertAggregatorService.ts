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
    // TODO: Implement mapping based on actual NDRRMC API response format
    return [];
  }

  /**
   * Map ReliefWeb data to alert format
   */
  private mapReliefWebToAlerts(data: any): DisasterAlert[] {
    if (!data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((item: any) => {
      const fields = item.fields || {};

      // Determine type
      let disasterType: DisasterAlert['type'] = 'other';
      const primaryType = fields.primary_type?.name?.toLowerCase() || '';
      const allTypes = (fields.type || []).map((t: any) => t.name?.toLowerCase());
      const typeStr = [primaryType, ...allTypes].join(' ');

      if (typeStr.includes('typhoon') || typeStr.includes('cyclone') || typeStr.includes('hurricane')) {
        disasterType = 'typhoon';
      } else if (typeStr.includes('earthquake')) {
        disasterType = 'earthquake';
      } else if (typeStr.includes('flood')) {
        disasterType = 'flood';
      } else if (typeStr.includes('landslide') || typeStr.includes('mudslide')) {
        disasterType = 'landslide';
      } else if (typeStr.includes('volcano')) {
        disasterType = 'volcano';
      } else if (typeStr.includes('fire')) {
        disasterType = 'fire';
      }

      // Determine severity
      let severity: DisasterAlert['severity'] = 'medium';
      if (fields.status === 'current' || fields.status === 'ongoing') {
        severity = 'high';
      } else if (fields.status === 'past') {
        severity = 'low';
      }

      // Affected areas
      const affectedAreas: string[] = [];
      if (fields.primary_country?.name) {
        affectedAreas.push(fields.primary_country.name);
      }
      if (fields.country) {
        fields.country.forEach((c: any) => {
          if (c.name && !affectedAreas.includes(c.name)) {
            affectedAreas.push(c.name);
          }
        });
      }

      return {
        id: item.id || `rw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'reliefweb',
        type: disasterType,
        severity: severity,
        title: fields.name || 'Unknown Disaster',
        description: fields.description || fields.body || fields.name || 'No description available',
        affectedAreas: affectedAreas,
        timestamp: fields.date?.created ? new Date(fields.date.created) : new Date(),
        lastUpdated: fields.date?.changed ? new Date(fields.date.changed) : new Date(),
        externalUrl: fields.url || item.href,
      };
    });
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
