/**
 * Alert Cache Service
 * Implements caching layer for external alerts with TTL to reduce API calls
 */

import NodeCache from 'node-cache';
import { logger } from './monitoringService';

interface CachedAlertData {
  alerts: any[];
  timestamp: number;
  source: string;
  fetchDurationMs: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  staleness: number;
}

export class AlertCacheService {
  private cache: NodeCache;
  private readonly TTL = 5 * 60; // 5 minutes TTL
  private readonly CHECK_PERIOD = 10; // Check for expired keys every 10 seconds
  private cacheMetrics: Record<string, CacheMetrics> = {
    pagasa: { hits: 0, misses: 0, staleness: 0 },
    philvolcs: { hits: 0, misses: 0, staleness: 0 },
    ndrrmc: { hits: 0, misses: 0, staleness: 0 },
  };

  constructor() {
    this.cache = new NodeCache({ stdTTL: this.TTL, checkperiod: this.CHECK_PERIOD });

    // Listen for cache events
    this.cache.on('del', (key: string) => {
      logger.debug(`Cache key expired: ${key}`);
    });
  }

  /**
   * Get cached alerts for a source
   */
  getAlerts(source: 'pagasa' | 'philvolcs' | 'ndrrmc'): CachedAlertData | null {
    const key = `alerts:${source}`;
    const cached = this.cache.get(key) as CachedAlertData | undefined;

    if (cached) {
      this.cacheMetrics[source].hits++;
      const ageSeconds = (Date.now() - cached.timestamp) / 1000;
      logger.debug(`Cache hit for ${source} alerts (age: ${ageSeconds.toFixed(1)}s)`);
      return cached;
    }

    this.cacheMetrics[source].misses++;
    logger.debug(`Cache miss for ${source} alerts`);
    return null;
  }

  /**
   * Set cached alerts for a source
   */
  setAlerts(source: 'pagasa' | 'philvolcs' | 'ndrrmc', alerts: any[], fetchDurationMs: number): void {
    const key = `alerts:${source}`;
    const cachedData: CachedAlertData = {
      alerts,
      timestamp: Date.now(),
      source,
      fetchDurationMs,
    };

    this.cache.set(key, cachedData);
    logger.info(`Cached ${alerts.length} ${source} alerts (fetched in ${fetchDurationMs}ms)`, {
      source,
      count: alerts.length,
      durationMs: fetchDurationMs,
    });
  }

  /**
   * Check if cache is still fresh for a source
   */
  isFresh(source: 'pagasa' | 'philvolcs' | 'ndrrmc'): boolean {
    const key = `alerts:${source}`;
    return this.cache.has(key);
  }

  /**
   * Get cache age in seconds
   */
  getCacheAge(source: 'pagasa' | 'philvolcs' | 'ndrrmc'): number | null {
    const cached = this.getAlerts(source);
    if (!cached) return null;

    const ageMs = Date.now() - cached.timestamp;
    return Math.floor(ageMs / 1000);
  }

  /**
   * Get time until cache expires
   */
  getTimeToExpire(source: 'pagasa' | 'philvolcs' | 'ndrrmc'): number | null {
    const age = this.getCacheAge(source);
    if (age === null) return null;

    const timeToExpire = this.TTL - age;
    return Math.max(0, timeToExpire);
  }

  /**
   * Clear cache for a specific source
   */
  invalidate(source: 'pagasa' | 'philvolcs' | 'ndrrmc'): void {
    const key = `alerts:${source}`;
    this.cache.del(key);
    logger.info(`Invalidated cache for ${source} alerts`);
  }

  /**
   * Clear all caches
   */
  invalidateAll(): void {
    const keys = ['alerts:pagasa', 'alerts:philvolcs', 'alerts:ndrrmc'];
    this.cache.del(keys);
    logger.info('Invalidated all alert caches');
  }

  /**
   * Get cache metrics
   */
  getMetrics(): {
    pagasa: CacheMetrics;
    philvolcs: CacheMetrics;
    ndrrmc: CacheMetrics;
    hitRate: number;
    totalRequests: number;
  } {
    const total =
      (this.cacheMetrics.pagasa.hits + this.cacheMetrics.pagasa.misses) +
      (this.cacheMetrics.philvolcs.hits + this.cacheMetrics.philvolcs.misses) +
      (this.cacheMetrics.ndrrmc.hits + this.cacheMetrics.ndrrmc.misses);

    const totalHits =
      this.cacheMetrics.pagasa.hits +
      this.cacheMetrics.philvolcs.hits +
      this.cacheMetrics.ndrrmc.hits;

    return {
      pagasa: this.cacheMetrics.pagasa,
      philvolcs: this.cacheMetrics.philvolcs,
      ndrrmc: this.cacheMetrics.ndrrmc,
      hitRate: total > 0 ? Math.round((totalHits / total) * 100) : 0,
      totalRequests: total,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.cacheMetrics = {
      pagasa: { hits: 0, misses: 0, staleness: 0 },
      philvolcs: { hits: 0, misses: 0, staleness: 0 },
      ndrrmc: { hits: 0, misses: 0, staleness: 0 },
    };
    logger.info('Reset cache metrics');
  }

  /**
   * Log detailed fetch information
   */
  logFetchDetails(
    source: 'pagasa' | 'philvolcs' | 'ndrrmc',
    status: 'success' | 'error',
    details: {
      count?: number;
      durationMs: number;
      timestamp: string;
      error?: string;
      raw?: any;
    }
  ): void {
    logger.info(`${source} fetch ${status}`, {
      source,
      status,
      alertCount: details.count || 0,
      durationMs: details.durationMs,
      timestamp: details.timestamp,
      error: details.error || null,
      cacheHit: this.isFresh(source),
    });
  }

  /**
   * Get all cache info
   */
  getCacheInfo(): {
    source: string;
    isFresh: boolean;
    ageSeconds: number | null;
    expiresInSeconds: number | null;
    alertCount: number;
    fetchDurationMs: number;
  }[] {
    const sources = ['pagasa', 'philvolcs', 'ndrrmc'] as const;
    const info = [];

    for (const source of sources) {
      const cached = this.getAlerts(source);
      info.push({
        source,
        isFresh: this.isFresh(source),
        ageSeconds: this.getCacheAge(source),
        expiresInSeconds: this.getTimeToExpire(source),
        alertCount: cached?.alerts.length || 0,
        fetchDurationMs: cached?.fetchDurationMs || 0,
      });
    }

    return info;
  }
}

export const alertCacheService = new AlertCacheService();
