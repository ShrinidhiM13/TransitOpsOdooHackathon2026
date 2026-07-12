import { Router } from 'express';
import { getKPIs, getPerformance, getChartData, getSafetyReport, exportCSV, exportPDF } from '../controllers/analytics.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: GET /api/analytics/kpis
 * API Name: Get Operational Metrics
 * Usecase: Retrieve fleet KPIs (available/active vehicle metrics and utilization).
 * Restricted to FLEET_MANAGER, FINANCIAL_ANALYST, and SAFETY_OFFICER.
 */
router.get('/kpis', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), getKPIs);

/**
 * Route: GET /api/analytics/performance
 * API Name: Get Fleet Performance Report
 * Usecase: Return fuel efficiency aggregates, total costs, and ROI per vehicle.
 * Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/performance', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), getPerformance);

/**
 * Route: GET /api/analytics/charts
 * API Name: Get Chart Data
 * Usecase: Returns time-series and categorical data for all dashboard charts.
 * Restricted to FLEET_MANAGER, FINANCIAL_ANALYST, and SAFETY_OFFICER.
 */
router.get('/charts', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), getChartData);

/**
 * Route: GET /api/analytics/safety
 * API Name: Safety Officer Compliance Report
 * Usecase: Returns expiring/expired licenses, suspended drivers, and safety score stats.
 * Restricted to FLEET_MANAGER and SAFETY_OFFICER.
 */
router.get('/safety', authenticate, restrictTo('FLEET_MANAGER', 'SAFETY_OFFICER'), getSafetyReport);

/**
 * Route: GET /api/analytics/export
 * API Name: Stream Data as CSV
 * Usecase: Downloads trip performance logs as a downloadable CSV spreadsheet.
 * Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/export', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), exportCSV);

/**
 * Route: GET /api/analytics/export/pdf
 * API Name: Export HTML/PDF Report
 * Usecase: Generates a comprehensive HTML fleet report that the browser can print/save as PDF.
 * Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/export/pdf', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), exportPDF);

export default router;
