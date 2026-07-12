import { Router } from 'express';
import { listVehicles, registerVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicle.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: GET /api/vehicles
 * API Name: List Vehicles
 * Usecase: Retrieve vehicles list. Restricted to FLEET_MANAGER.
 */
router.get('/', authenticate, restrictTo('FLEET_MANAGER'), listVehicles);

/**
 * Route: POST /api/vehicles
 * API Name: Register Vehicle
 * Usecase: Register new vehicle. Restricted to FLEET_MANAGER.
 */
router.post('/', authenticate, restrictTo('FLEET_MANAGER'), registerVehicle);

/**
 * Route: PUT /api/vehicles/:id
 * API Name: Update Vehicle Details
 * Usecase: Update vehicle metadata. Restricted to FLEET_MANAGER.
 */
router.put('/:id', authenticate, restrictTo('FLEET_MANAGER'), updateVehicle);

/**
 * Route: DELETE /api/vehicles/:id
 * API Name: Delete Vehicle
 * Usecase: Delete vehicle. Restricted to FLEET_MANAGER.
 */
router.delete('/:id', authenticate, restrictTo('FLEET_MANAGER'), deleteVehicle);

export default router;
