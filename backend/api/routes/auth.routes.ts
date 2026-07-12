import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * Route: POST /api/auth/login
 * API Name: User Login
 * Usecase: Authenticate user credentials and sign JWT token.
 */
router.post('/login', login);

/**
 * Route: POST /api/auth/register
 * API Name: User Registration
 * Usecase: Creates a new user profile with specific authorization roles.
 */
router.post('/register', register);

/**
 * Route: GET /api/auth/me
 * API Name: Get Current User Session
 * Usecase: Verify JWT authentication token and return current session user profile.
 */
router.get('/me', authenticate, getMe);

export default router;
