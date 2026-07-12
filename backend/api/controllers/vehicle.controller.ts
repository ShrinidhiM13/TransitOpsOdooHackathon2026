import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/db';
import { broadcast } from '../services/websocket.service';

const vehicleRegisterSchema = z.object({
  registrationNumber: z.string().regex(/^[A-Z]{2}-\d{2}-[A-Z]{1,3}-\d{4}$/, {
    message: 'Invalid Indian RTO registration number format (e.g. MH-12-PQ-1234)',
  }),
  model: z.string().min(1),
  type: z.enum(['VAN', 'TRUCK', 'CAR']),
  maxLoadCapacity: z.number().positive(),
  odometer: z.number().nonnegative().default(0),
  acquisitionCost: z.number().nonnegative(),
  region: z.string().min(1),
});

const vehicleUpdateSchema = vehicleRegisterSchema.partial();

/**
 * API Name: List Vehicles
 * Usecase: Retrieves all registered vehicles, optional filtering by status, type, region, or registration search.
 */
export const listVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, search, region, sortBy, sortOrder } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }
    if (search) {
      query += ' AND (registrationNumber LIKE ? OR model LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const allowedSort = ['registrationNumber', 'model', 'odometer', 'acquisitionCost', 'createdAt'];
    const sortField = allowedSort.includes(sortBy as string) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortDir}`;

    const [vehicles]: any = await pool.execute(query, params);

    return res.status(200).json({
      success: true,
      vehicles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Register Vehicle
 * Usecase: Registers a new vehicle with Indian localization details and enforces registration number uniqueness.
 */
export const registerVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = vehicleRegisterSchema.parse(req.body);

    const [existing]: any = await pool.execute(
      'SELECT id FROM vehicles WHERE registrationNumber = ?',
      [body.registrationNumber]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with registration number ${body.registrationNumber} already registered`,
      });
    }

    const randomId = 'veh_' + Math.floor(1000000 + Math.random() * 9000000);

    await pool.execute(
      'INSERT INTO vehicles (id, registrationNumber, model, type, maxLoadCapacity, odometer, acquisitionCost, region, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomId,
        body.registrationNumber,
        body.model,
        body.type,
        body.maxLoadCapacity,
        body.odometer,
        body.acquisitionCost,
        body.region,
        'Available',
      ]
    );

    const [rows]: any = await pool.execute('SELECT * FROM vehicles WHERE id = ?', [randomId]);
    broadcast('VEHICLE_UPDATED', { vehicleId: randomId, vehicle: rows[0] });

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      vehicle: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Update Vehicle Details
 * Usecase: Updates specific metadata fields for a vehicle by ID.
 */
export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = vehicleUpdateSchema.parse(req.body);

    // Verify vehicle exists
    const [existing]: any = await pool.execute('SELECT id, status FROM vehicles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const fields: string[] = [];
    const params: any[] = [];

    Object.keys(body).forEach((key) => {
      fields.push(`${key} = ?`);
      params.push((body as any)[key]);
    });

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`;

    const [result]: any = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const [rows]: any = await pool.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    broadcast('VEHICLE_UPDATED', { vehicleId: id, vehicle: rows[0] });

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Retire Vehicle
 * Usecase: Permanently marks a vehicle as 'Retired', removing it from the active dispatch pool.
 *          Cannot retire a vehicle currently on a trip.
 */
export const retireVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [vehicles]: any = await pool.execute('SELECT id, status FROM vehicles WHERE id = ?', [id]);
    const vehicle = vehicles[0];

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({
        success: false,
        message: 'Cannot retire a vehicle that is currently on a trip. Complete or cancel the trip first.',
      });
    }

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ success: false, message: 'Vehicle is already retired' });
    }

    await pool.execute("UPDATE vehicles SET status = 'Retired' WHERE id = ?", [id]);

    const [rows]: any = await pool.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    broadcast('VEHICLE_UPDATED', { vehicleId: id, vehicle: rows[0] });

    return res.status(200).json({
      success: true,
      message: 'Vehicle has been retired and removed from the dispatch pool.',
      vehicle: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Delete Vehicle
 * Usecase: Removes a vehicle asset registry by ID.
 */
export const deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.execute('DELETE FROM vehicles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    broadcast('VEHICLE_UPDATED', { vehicleId: id, deleted: true });

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
