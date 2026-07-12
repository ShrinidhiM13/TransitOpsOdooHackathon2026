import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'transitops-super-secret-key-2026-hackathon';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
});

/**
 * API Name: User Login
 * Usecase: Authenticates users (Fleet Manager, Driver, Safety Officer, Financial Analyst) via email & password, returning a JWT.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: User Registration
 * Usecase: Registers a new user account with hashed credentials and role permissions.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = registerSchema.parse(req.body);

    const [existing]: any = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const randomId = 'usr_' + Math.floor(1000000 + Math.random() * 9000000);

    await pool.execute(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [randomId, name, email, passwordHash, role]
    );

    const [rows]: any = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [randomId]);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * API Name: Get Current User Session
 * Usecase: Retrieves the authenticated user's session profile details using the JWT payload.
 */
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (req.user.role === 'DRIVER') {
      const [rows]: any = await pool.query('SELECT * FROM drivers WHERE userId = ?', [req.user.id]);
      const driver = rows[0];
      return res.status(200).json({
        success: true,
        user: req.user,
        driver: driver || null,
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
