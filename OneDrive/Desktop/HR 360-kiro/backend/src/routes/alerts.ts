/**
 * Alert Routes - PRODUCTION MODE
 * Returns real aggregated alerts from external sources
 */

import express from 'express';
import { externalAlertsService } from '../services/externalAlertsService';
import { earthquakeService } from '../services/earthquakeService';
import { alertAggregatorService } from '../services/alertAggregatorService';

const router = express.Router();

/**
 * GET /api/alerts
 * Get aggregated alerts from all sources
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    // Fetch external alerts in parallel
    const [externalAlerts, earthquakeAlerts, aggregatedAlerts] = await Promise.allSettled([
      externalAlertsService.fetchAllExternalAlerts(),
      earthquakeService.getRecentSignificantEarthquakes(24),
      alertAggregatorService.getAggregatedAlerts(),
    ]);

    // Combine all alerts
    let allAlerts = [];
    
    if (externalAlerts.status === 'fulfilled' && externalAlerts.value) {
      allAlerts.push(...externalAlerts.value);
    }
    
    if (earthquakeAlerts.status === 'fulfilled' && earthquakeAlerts.value) {
      allAlerts.push(...earthquakeAlerts.value);
    }
    
    if (aggregatedAlerts.status === 'fulfilled' && aggregatedAlerts.value?.alerts) {
      allAlerts.push(...aggregatedAlerts.value.alerts);
    }

    // Deduplicate by ID
    const uniqueAlerts = Array.from(
      new Map(allAlerts.map(alert => [alert.id, alert])).values()
    );

    // Sort by creation date descending
    uniqueAlerts.sort((a, b) => {
      const aTime = new Date(
        (a as any).created_at || 
        (a as any).timestamp || 
        (a as any).lastUpdated || 
        new Date()
      ).getTime();
      const bTime = new Date(
        (b as any).created_at || 
        (b as any).timestamp || 
        (b as any).lastUpdated || 
        new Date()
      ).getTime();
      return bTime - aTime;
    });

    // Paginate
    const paginatedAlerts = uniqueAlerts.slice(offset, offset + pageSize);
    const total = uniqueAlerts.length;
    const totalPages = Math.ceil(total / pageSize);

    res.json({
      success: true,
      data: paginatedAlerts,
      pagination: { page, pageSize, total, totalPages },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch alerts',
      },
      statusCode: 500,
    });
  }
});

/**
 * GET /api/alerts/weather
 * Get weather alerts from PAGASA
 */
router.get('/weather', async (req: express.Request, res: express.Response) => {
  try {
    const alerts = await externalAlertsService.fetchPagasaAlerts();
    res.json({
      success: true,
      data: alerts,
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    res.json({
      success: true,
      data: [],
      statusCode: 200, // Return 200 even on error to prevent caching issues
    });
  }
});

/**
 * GET /api/alerts/earthquakes
 * Get earthquake alerts from PHIVOLCS/USGS
 */
router.get('/earthquakes', async (req: express.Request, res: express.Response) => {
  try {
    const alerts = await earthquakeService.getRecentSignificantEarthquakes(24);
    res.json({
      success: true,
      data: alerts,
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error fetching earthquake alerts:', error);
    res.json({
      success: true,
      data: [],
      statusCode: 200,
    });
  }
});

/**
 * GET /api/alerts/disasters
 * Get aggregated disaster alerts
 */
router.get('/disasters', async (req: express.Request, res: express.Response) => {
  try {
    const aggregated = await alertAggregatorService.getAggregatedAlerts();
    res.json({
      success: true,
      data: aggregated,
      statusCode: 200,
    });
  } catch (error) {
    console.error('Error fetching disaster alerts:', error);
    res.json({
      success: true,
      data: { total: 0, critical: 0, high: 0, medium: 0, low: 0, alerts: [], lastRefreshed: new Date() },
      statusCode: 200,
    });
  }
});

export default router;
