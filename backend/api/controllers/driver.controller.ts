import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import pool from '../config/db';

const driverRegisterSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiryDate: z.string().transform((str) => new Date(str)),
  contactNumber: z.string().regex(/^\+91\d{10}$/, {
    message: 'Invalid Indian contact number format. Must start with +91 followed by 10 digits (e.g. +919876543210)',
  }),
  safetyScore: z.number().min(0).max(100).default(100),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

const driverUpdateSchema = driverRegisterSchema.partial();

/**
 * API Name: List Drivers
 * Usecase: Retrieves registered drivers, with optional status filtering or driver name search.
 */
export const listDrivers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM drivers WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY createdAt DESC';

    const [drivers]: any = await pool.execute(query, params);

    return res.status(200).json({
      success: true,
      drivers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Register Driver
 * Usecase: Registers a new fleet driver, verifying license validity, contact format, and license number uniqueness.
 *          Automatically provisions a matching User login account for the driver in a transaction.
 */
export const registerDriver = async (req: Request, res: Response, next: NextFunction) => {
  const conn = await pool.getConnection();
  try {
    const body = driverRegisterSchema.parse(req.body);

    if (body.licenseExpiryDate.getTime() < Date.now()) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Driver license is expired',
      });
    }

    const [existing]: any = await conn.execute(
      'SELECT id FROM drivers WHERE licenseNumber = ?',
      [body.licenseNumber]
    );

    if (existing.length > 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: `Driver with license number ${body.licenseNumber} already registered`,
      });
    }

    const driverEmail = body.email || `${body.name.replace(/\s+/g, '').toLowerCase()}_driver_${Math.floor(1000 + Math.random() * 9000)}@transitops.in`;
    const driverPassword = body.password || 'SecurePassword123';

    await conn.beginTransaction();

    const [existingUser]: any = await conn.execute('SELECT id FROM users WHERE email = ?', [driverEmail]);
    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      userId = 'usr_' + Math.floor(1000000 + Math.random() * 9000000);
      const passwordHash = await bcrypt.hash(driverPassword, 10);
      await conn.execute(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [userId, body.name, driverEmail, passwordHash, 'DRIVER']
      );
    }

    const randomId = 'drv_' + Math.floor(1000000 + Math.random() * 9000000);

    await conn.execute(
      'INSERT INTO drivers (id, name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomId,
        body.name,
        body.licenseNumber,
        body.licenseCategory,
        body.licenseExpiryDate,
        body.contactNumber,
        body.safetyScore,
        'Available',
        userId,
      ]
    );

    await conn.commit();
    conn.release();

    const [rows]: any = await pool.execute('SELECT * FROM drivers WHERE id = ?', [randomId]);

    return res.status(201).json({
      success: true,
      message: 'Driver registered successfully. User account auto-provisioned.',
      driver: rows[0],
      provisionedCredentials: {
        email: driverEmail,
        password: body.password ? '[PROVIDED]' : driverPassword,
      }
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    next(error);
  }
};

/**
 * API Name: Update Driver Details
 * Usecase: Updates fields (e.g. status, safety score, license expiry) for an active driver record.
 */
export const updateDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = driverUpdateSchema.parse(req.body);

    if (body.licenseExpiryDate && body.licenseExpiryDate.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Driver license is expired',
      });
    }

    const fields: string[] = [];
    const params: any[] = [];

    Object.keys(body).forEach((key) => {
      // Exclude auth-specific register fields from driver table updates
      if (key !== 'email' && key !== 'password') {
        fields.push(`${key} = ?`);
        params.push((body as any)[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`;

    const [result]: any = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const [rows]: any = await pool.execute('SELECT * FROM drivers WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      driver: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Delete Driver
 * Usecase: Removes a driver record by ID.
 */
export const deleteDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.execute('DELETE FROM drivers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
