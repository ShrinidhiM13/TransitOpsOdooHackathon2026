import { Router } from 'express';
import { listDrivers, registerDriver, updateDriver, deleteDriver } from '../controllers/driver.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: GET /api/drivers
 * API Name: List Drivers
 * Usecase: Retrieve list of drivers. Restricted to FLEET_MANAGER and SAFETY_OFFICER.
 */
router.get('/', authenticate, restrictTo('FLEET_MANAGER', 'SAFETY_OFFICER'), listDrivers);

/**
 * Route: POST /api/drivers
 * API Name: Register Driver
 * Usecase: Validate compliance rules and register a new driver. Restricted to FLEET_MANAGER.
 */
router.post('/', authenticate, restrictTo('FLEET_MANAGER'), registerDriver);

/**
 * Route: PUT /api/drivers/:id
 * API Name: Update Driver Details
 * Usecase: Edit active driver details. Restricted to FLEET_MANAGER.
 */
router.put('/:id', authenticate, restrictTo('FLEET_MANAGER'), updateDriver);

/**
 * Route: DELETE /api/drivers/:id
 * API Name: Delete Driver
 * Usecase: Remove driver record. Restricted to FLEET_MANAGER.
 */
router.delete('/:id', authenticate, restrictTo('FLEET_MANAGER'), deleteDriver);

export default router;
