import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/db';

const tripCreateSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  cargoWeight: z.number().positive(),
  plannedDistance: z.number().positive(),
});

const tripStatusUpdateSchema = z.object({
  status: z.enum(['En Route to Pickup', 'Loading Cargo', 'In Transit']),
});

const tripCompleteSchema = z.object({
  finalOdometer: z.number().positive(),
  fuelConsumedLiters: z.number().positive(),
  fuelCost: z.number().positive(),
});

/**
 * API Name: Create Trip (Draft)
 * Usecase: Inserts a new trip in 'Draft' state after validating that the cargo weight does not exceed the vehicle's capacity.
 */
export const createTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = tripCreateSchema.parse(req.body);

    const [vehicles]: any = await pool.execute('SELECT maxLoadCapacity FROM vehicles WHERE id = ?', [body.vehicleId]);
    const vehicle = vehicles[0];

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (body.cargoWeight > Number(vehicle.maxLoadCapacity)) {
      return res.status(400).json({
        success: false,
        message: `Cargo weight (${body.cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)`,
      });
    }

    const [drivers]: any = await pool.execute('SELECT id FROM drivers WHERE id = ?', [body.driverId]);
    if (drivers.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const randomId = 'trp_' + Math.floor(1000000 + Math.random() * 9000000);

    await pool.execute(
      'INSERT INTO trips (id, source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomId,
        body.source,
        body.destination,
        body.vehicleId,
        body.driverId,
        body.cargoWeight,
        body.plannedDistance,
        'Draft',
      ]
    );

    const [rows]: any = await pool.execute('SELECT * FROM trips WHERE id = ?', [randomId]);

    return res.status(201).json({
      success: true,
      message: 'Trip created as draft',
      trip: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Dispatch Trip
 * Usecase: Validates driver license and vehicle availability, updates statuses of both resources to 'On Trip', and sets trip status to 'Dispatched' inside a transaction.
 */
export const dispatchTrip = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [trips]: any = await conn.execute('SELECT * FROM trips WHERE id = ?', [id]);
    const trip = trips[0];

    if (!trip) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.status !== 'Draft' && trip.status !== 'Cancelled') {
      conn.release();
      return res.status(400).json({
        success: false,
        message: `Only Draft or Cancelled trips can be dispatched. Current status is ${trip.status}`,
      });
    }

    const [vehicles]: any = await conn.execute('SELECT * FROM vehicles WHERE id = ?', [trip.vehicleId]);
    const vehicle = vehicles[0];

    const [drivers]: any = await conn.execute('SELECT * FROM drivers WHERE id = ?', [trip.driverId]);
    const driver = drivers[0];

    if (!vehicle || !driver) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Vehicle or Driver associated with this trip not found' });
    }

    if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      conn.release();
      return res.status(400).json({
        success: false,
        message: `Cannot dispatch trip. Vehicle is currently ${vehicle.status}.`,
      });
    }

    if (new Date(driver.licenseExpiryDate).getTime() < Date.now()) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Cannot dispatch trip. Driver license is expired.',
      });
    }

    if (driver.status === 'Suspended') {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Cannot dispatch trip. Driver is Suspended.',
      });
    }

    if (vehicle.status === 'On Trip') {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Cannot dispatch trip. Vehicle is already on another trip.',
      });
    }

    if (driver.status === 'On Trip') {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Cannot dispatch trip. Driver is already on another trip.',
      });
    }

    await conn.execute('UPDATE vehicles SET status = ? WHERE id = ?', ['On Trip', vehicle.id]);
    await conn.execute('UPDATE drivers SET status = ? WHERE id = ?', ['On Trip', driver.id]);
    await conn.execute('UPDATE trips SET status = ? WHERE id = ?', ['Dispatched', id]);

    await conn.commit();
    conn.release();

    const [updatedTrips]: any = await pool.execute('SELECT * FROM trips WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Trip dispatched. Vehicle and driver status updated to On Trip.',
      trip: updatedTrips[0],
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    next(error);
  }
};

/**
 * API Name: Update Trip Status
 * Usecase: Transitions active dispatch states (e.g. En Route to Pickup, Loading Cargo, In Transit).
 */
export const updateTripStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = tripStatusUpdateSchema.parse(req.body);

    const [trips]: any = await pool.execute('SELECT id FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    await pool.execute('UPDATE trips SET status = ? WHERE id = ?', [status, id]);

    const [updatedTrips]: any = await pool.execute('SELECT * FROM trips WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Trip status updated to ${status}`,
      trip: updatedTrips[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Complete Trip
 * Usecase: Finalizes odometer readings, restores driver/vehicle availability, and logs the fuel expense in a single transaction.
 */
export const completeTrip = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { finalOdometer, fuelConsumedLiters, fuelCost } = tripCompleteSchema.parse(req.body);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [trips]: any = await conn.execute('SELECT * FROM trips WHERE id = ?', [id]);
    const trip = trips[0];

    if (!trip) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const [vehicles]: any = await conn.execute('SELECT odometer FROM vehicles WHERE id = ?', [trip.vehicleId]);
    const vehicle = vehicles[0];

    if (!vehicle) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (finalOdometer < Number(vehicle.odometer)) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: `Final odometer (${finalOdometer}km) cannot be less than vehicle's starting odometer (${vehicle.odometer}km)`,
      });
    }

    await conn.execute('UPDATE vehicles SET odometer = ?, status = ? WHERE id = ?', [finalOdometer, 'Available', trip.vehicleId]);
    await conn.execute('UPDATE drivers SET status = ? WHERE id = ?', ['Available', trip.driverId]);

    const expId = 'exp_' + Math.floor(1000000 + Math.random() * 9000000);
    await conn.execute(
      'INSERT INTO expenses (id, vehicleId, tripId, driverId, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        expId,
        trip.vehicleId,
        trip.id,
        trip.driverId,
        fuelCost,
        'Fuel',
        `Fuel logging on trip completion: ${fuelConsumedLiters}L`,
        new Date(),
      ]
    );

    // Also log to fuel_logs table since FuelLog model was specified in Step 4
    const fuelLogId = 'fuel_' + Math.floor(1000000 + Math.random() * 9000000);
    await conn.execute(
      'INSERT INTO fuel_logs (id, vehicle_id, trip_id, liters, cost, log_date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        fuelLogId,
        trip.vehicleId,
        trip.id,
        fuelConsumedLiters,
        fuelCost,
        new Date(),
      ]
    );

    await conn.execute(
      'UPDATE trips SET status = ?, finalOdometer = ?, fuelConsumedLiters = ?, fuelCost = ? WHERE id = ?',
      ['Completed', finalOdometer, fuelConsumedLiters, fuelCost, id]
    );

    await conn.commit();
    conn.release();

    const [updatedTrips]: any = await pool.execute('SELECT * FROM trips WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Trip completed successfully. Vehicle and driver status restored to Available.',
      trip: updatedTrips[0],
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    next(error);
  }
};

/**
 * API Name: Cancel Trip
 * Usecase: Restores vehicle and driver availability and updates trip status to 'Cancelled' inside a transaction.
 */
export const cancelTrip = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [trips]: any = await conn.execute('SELECT * FROM trips WHERE id = ?', [id]);
    const trip = trips[0];

    if (!trip) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    await conn.execute('UPDATE vehicles SET status = ? WHERE id = ?', ['Available', trip.vehicleId]);
    await conn.execute('UPDATE drivers SET status = ? WHERE id = ?', ['Available', trip.driverId]);
    await conn.execute('UPDATE trips SET status = ? WHERE id = ?', ['Cancelled', id]);

    await conn.commit();
    conn.release();

    const [updatedTrips]: any = await pool.execute('SELECT * FROM trips WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Trip cancelled. Vehicle and driver status restored to Available.',
      trip: updatedTrips[0],
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    next(error);
  }
};
