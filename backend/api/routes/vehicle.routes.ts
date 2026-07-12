import { Router } from 'express';
import { listVehicles, registerVehicle, updateVehicle, deleteVehicle, retireVehicle } from '../controllers/vehicle.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: GET /api/vehicles
 * API Name: List Vehicles
 * Usecase: Retrieve vehicles list with optional status, type, search filters.
 * Restricted to FLEET_MANAGER and FINANCIAL_ANALYST (for ROI analysis).
 */
router.get('/', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), listVehicles);

/**
 * Route: POST /api/vehicles
 * API Name: Register Vehicle
 * Usecase: Register new vehicle with uniqueness validation. Restricted to FLEET_MANAGER.
 */
router.post('/', authenticate, restrictTo('FLEET_MANAGER'), registerVehicle);

/**
 * Route: PUT /api/vehicles/:id
 * API Name: Update Vehicle Details
 * Usecase: Update vehicle metadata fields. Restricted to FLEET_MANAGER.
 */
router.put('/:id', authenticate, restrictTo('FLEET_MANAGER'), updateVehicle);

/**
 * Route: PUT /api/vehicles/:id/retire
 * API Name: Retire Vehicle
 * Usecase: Marks a vehicle as 'Retired', permanently removing it from dispatch pool. Restricted to FLEET_MANAGER.
 */
router.put('/:id/retire', authenticate, restrictTo('FLEET_MANAGER'), retireVehicle);

/**
 * Route: DELETE /api/vehicles/:id
 * API Name: Delete Vehicle
 * Usecase: Remove vehicle asset registry by ID. Restricted to FLEET_MANAGER.
 */
router.delete('/:id', authenticate, restrictTo('FLEET_MANAGER'), deleteVehicle);

export default router;
