import { Router } from 'express';
import { openMaintenance, closeMaintenance } from '../controllers/maintenance.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

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
