import { Router } from 'express';
import { getKPIs, getPerformance, exportCSV } from '../controllers/analytics.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: GET /api/analytics/kpis
 * API Name: Get Operational Metrics
 * Usecase: Retrieve fleet KPIs (available/active vehicle metrics and utilization). Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/kpis', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getKPIs);

/**
 * Route: GET /api/analytics/performance
 * API Name: Get Fleet Performance Report
 * Usecase: Return fuel efficiency aggregates, total costs, and ROI per vehicle. Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/performance', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getPerformance);

/**
 * Route: GET /api/analytics/export
 * API Name: Stream Data as CSV
 * Usecase: Downloads trip performance logs as a downloadable CSV spreadsheet. Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/export', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), exportCSV);

export default router;
