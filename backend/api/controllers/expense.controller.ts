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
 * API Name: List Expenses
 * Usecase: Returns all expense records, optionally filtered by vehicleId, category, or tripId.
 */
export const listExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, category, tripId, search } = req.query;

    let query = `
      SELECT e.*, v.registrationNumber, v.model AS vehicleModel,
             d.name AS driverName
      FROM expenses e
      JOIN vehicles v ON e.vehicleId = v.id
      LEFT JOIN drivers d ON e.driverId = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (vehicleId) {
      query += ' AND e.vehicleId = ?';
      params.push(vehicleId);
    }
    if (category) {
      query += ' AND e.category = ?';
      params.push(category);
    }
    if (tripId) {
      query += ' AND e.tripId = ?';
      params.push(tripId);
    }
    if (search) {
      query += ' AND (e.description LIKE ? OR v.registrationNumber LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.date DESC';

    const [expenses]: any = await pool.execute(query, params);

    // Compute totals
    const totalByCategory: Record<string, number> = {};
    let grandTotal = 0;
    expenses.forEach((e: any) => {
      const amt = Number(e.amount);
      totalByCategory[e.category] = (totalByCategory[e.category] || 0) + amt;
      grandTotal += amt;
    });

    return res.status(200).json({
      success: true,
      expenses,
      summary: {
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        totalByCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: List Fuel Logs
 * Usecase: Returns all fuel log records, optionally filtered by vehicleId or driverId.
 */
export const listFuelLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, driverId } = req.query;

    let query = `
      SELECT fl.*, v.registrationNumber, v.model AS vehicleModel, d.name AS driverName
      FROM fuel_logs fl
      JOIN vehicles v ON fl.vehicleId = v.id
      JOIN drivers d ON fl.driverId = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (vehicleId) {
      query += ' AND fl.vehicleId = ?';
      params.push(vehicleId);
    }
    if (driverId) {
      query += ' AND fl.driverId = ?';
      params.push(driverId);
    }

    query += ' ORDER BY fl.date DESC';

    const [fuelLogs]: any = await pool.execute(query, params);

    const totalLiters = fuelLogs.reduce((sum: number, f: any) => sum + Number(f.liters), 0);
    const totalCost = fuelLogs.reduce((sum: number, f: any) => sum + Number(f.totalCost), 0);

    return res.status(200).json({
      success: true,
      fuelLogs,
      summary: {
        totalLiters: parseFloat(totalLiters.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        avgCostPerLiter: fuelLogs.length > 0
          ? parseFloat((totalCost / totalLiters).toFixed(2))
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    const [rows]: any = await pool.execute(
      `SELECT e.*, v.registrationNumber FROM expenses e 
       JOIN vehicles v ON e.vehicleId = v.id WHERE e.id = ?`,
      [randomId]
    );

    return res.status(201).json({
      success: true,
      expense: rows[0],
    });
  } catch (error) {
    next(error);
  }
};
