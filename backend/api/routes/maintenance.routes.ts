import { Router } from 'express';
import { listMaintenance, openMaintenance, closeMaintenance } from '../controllers/maintenance.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: GET /api/maintenance
 * API Name: List Maintenance Logs
 * Usecase: Retrieve all maintenance records with optional vehicleId, status, and search filters.
 * Restricted to FLEET_MANAGER and SAFETY_OFFICER.
 */
router.get('/', authenticate, restrictTo('FLEET_MANAGER', 'SAFETY_OFFICER'), listMaintenance);

/**
 * Route: POST /api/maintenance
 * API Name: Open Maintenance Record
 * Usecase: Lock vehicle to In Shop and open a maintenance ticket. Restricted to FLEET_MANAGER.
 */
router.post('/', authenticate, restrictTo('FLEET_MANAGER'), openMaintenance);

/**
 * Route: PUT /api/maintenance/:id/close
 * API Name: Close Maintenance Record
 * Usecase: Unlock vehicle status and close maintenance log with final resolved cost. Restricted to FLEET_MANAGER.
 */
router.put('/:id/close', authenticate, restrictTo('FLEET_MANAGER'), closeMaintenance);

export default router;
