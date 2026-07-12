import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/db';

const openMaintSchema = z.object({
  vehicleId: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['Scheduled', 'Unscheduled']).default('Scheduled'),
  cost: z.number().nonnegative().default(0),
  startDate: z.string().transform((str) => new Date(str)),
});

const closeMaintSchema = z.object({
  endDate: z.string().transform((str) => new Date(str)),
  finalCost: z.number().nonnegative(),
  notes: z.string().optional(),
});

/**
 * API Name: Open Maintenance Record
 * Usecase: Initiates a maintenance request for a vehicle, marks vehicle status to 'In Shop' inside a transaction.
 */
export const openMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  const conn = await pool.getConnection();
  try {
    const body = openMaintSchema.parse(req.body);

    await conn.beginTransaction();

    const [vehicles]: any = await conn.execute('SELECT id FROM vehicles WHERE id = ?', [body.vehicleId]);
    if (vehicles.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const randomId = 'maint_' + Math.floor(1000000 + Math.random() * 9000000);

    await conn.execute("UPDATE vehicles SET status = 'In Shop' WHERE id = ?", [body.vehicleId]);

    await conn.execute(
      'INSERT INTO maintenance_logs (id, vehicleId, description, type, cost, startDate, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomId, body.vehicleId, body.description, body.type, body.cost, body.startDate, 'Open']
    );

    await conn.commit();
    conn.release();

    const [rows]: any = await pool.execute('SELECT * FROM maintenance_logs WHERE id = ?', [randomId]);

    return res.status(201).json({
      success: true,
      message: "Maintenance log created. Vehicle marked 'In Shop'.",
      maintenanceLog: rows[0],
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    next(error);
  }
};

/**
 * API Name: Close Maintenance Record
 * Usecase: Closes an open maintenance request, logs the final maintenance cost in expenses, and sets vehicle status to 'Available' inside a transaction.
 */
export const closeMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    const { endDate, finalCost, notes } = closeMaintSchema.parse(req.body);

    await conn.beginTransaction();

    const [logs]: any = await conn.execute('SELECT * FROM maintenance_logs WHERE id = ?', [id]);
    const log = logs[0];

    if (!log) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Maintenance log not found' });
    }

    const [vehicles]: any = await conn.execute('SELECT status FROM vehicles WHERE id = ?', [log.vehicleId]);
    const vehicle = vehicles[0];

    if (vehicle && vehicle.status !== 'Retired') {
      await conn.execute("UPDATE vehicles SET status = 'Available' WHERE id = ?", [log.vehicleId]);
    }

    const expId = 'exp_' + Math.floor(1000000 + Math.random() * 9000000);
    await conn.execute(
      'INSERT INTO expenses (id, vehicleId, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        expId,
        log.vehicleId,
        finalCost,
        'Maintenance',
        `Resolved maintenance log: ${log.description}. Note: ${notes || ''}`,
        endDate,
      ]
    );

    await conn.execute(
      'UPDATE maintenance_logs SET status = ?, endDate = ?, finalCost = ?, notes = ? WHERE id = ?',
      ['Closed', endDate, finalCost, notes || null, id]
    );

    await conn.commit();
    conn.release();

    const [updatedLogs]: any = await pool.execute('SELECT * FROM maintenance_logs WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Maintenance completed. Vehicle status restored to Available.',
      maintenanceLog: updatedLogs[0],
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    next(error);
  }
};
