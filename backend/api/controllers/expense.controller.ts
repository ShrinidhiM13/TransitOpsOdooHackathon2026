import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/db';

const expenseCreateSchema = z.object({
  vehicleId: z.string().min(1),
  tripId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
  amount: z.number().positive(),
  category: z.enum(['Toll', 'Fuel', 'Maintenance', 'Cleaning', 'Misc']),
  description: z.string().min(1),
  date: z.string().transform((str) => new Date(str)),
});

/**
 * API Name: Record Expense
 * Usecase: Inserts a transit expense log (tolls, cleaning, parking, misc) linked to a vehicle and optionally a trip.
 */
export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = expenseCreateSchema.parse(req.body);

    const [vehicles]: any = await pool.execute('SELECT id FROM vehicles WHERE id = ?', [body.vehicleId]);
    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const randomId = 'exp_' + Math.floor(1000000 + Math.random() * 9000000);

    await pool.execute(
      'INSERT INTO expenses (id, vehicleId, tripId, driverId, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomId,
        body.vehicleId,
        body.tripId || null,
        body.driverId || null,
        body.amount,
        body.category,
        body.description,
        body.date,
      ]
    );

    const [rows]: any = await pool.execute('SELECT * FROM expenses WHERE id = ?', [randomId]);

    return res.status(201).json({
      success: true,
      expense: rows[0],
    });
  } catch (error) {
    next(error);
  }
};
