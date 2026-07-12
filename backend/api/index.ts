import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';
import driverRoutes from './routes/driver.routes';
import tripRoutes from './routes/trip.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import expenseRoutes from './routes/expense.routes';
import analyticsRoutes from './routes/analytics.routes';
import { getKPIs } from './controllers/analytics.controller';
import { authenticate } from './middlewares/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware: Set security-related HTTP headers
app.use(helmet());

// CORS Configuration
app.use(cors());
app.use(express.json());

// Global Rate Limiter: Limit requests per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Brute Force Limiter: Login protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.get('/api/dashboard/kpis', authenticate, getKPIs);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TransitOps Backend running on port ${PORT}`);
});

export default app;
