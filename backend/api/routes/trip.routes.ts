import { Router } from 'express';
import { createTrip, dispatchTrip, updateTripStatus, completeTrip, cancelTrip } from '../controllers/trip.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: POST /api/trips
 * API Name: Create Trip (Draft)
 * Usecase: Validates load capacity and records a new trip draft order. Restricted to FLEET_MANAGER and DRIVER.
 */
router.post('/', authenticate, restrictTo('FLEET_MANAGER', 'DRIVER'), createTrip);

/**
 * Route: PUT /api/trips/:id/dispatch
 * API Name: Dispatch Trip
 * Usecase: Executes dispatch validations and updates vehicle, driver, and trip statuses. Restricted to FLEET_MANAGER.
 */
router.put('/:id/dispatch', authenticate, restrictTo('FLEET_MANAGER'), dispatchTrip);

/**
 * Route: PUT /api/trips/:id/status
 * API Name: Update Trip Status
 * Usecase: Updates the current active dispatch tracking states. Restricted to FLEET_MANAGER and DRIVER.
 */
router.put('/:id/status', authenticate, restrictTo('FLEET_MANAGER', 'DRIVER'), updateTripStatus);

/**
 * Route: PUT /api/trips/:id/complete
 * API Name: Complete Trip
 * Usecase: Records final trip parameters, resets driver/vehicle availability, and logs fuel cost. Restricted to FLEET_MANAGER and DRIVER.
 */
router.put('/:id/complete', authenticate, restrictTo('FLEET_MANAGER', 'DRIVER'), completeTrip);

/**
 * Route: PUT /api/trips/:id/cancel
 * API Name: Cancel Trip
 * Usecase: Restores vehicle and driver availability and sets trip status to Cancelled. Restricted to FLEET_MANAGER and DRIVER.
 */
router.put('/:id/cancel', authenticate, restrictTo('FLEET_MANAGER', 'DRIVER'), cancelTrip);

export default router;
