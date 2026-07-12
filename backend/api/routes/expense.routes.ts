import { Router } from 'express';
import { listExpenses, listFuelLogs, createExpense } from '../controllers/expense.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: GET /api/expenses
 * API Name: List Expenses
 * Usecase: Retrieve all expense records with optional vehicleId, category, and tripId filters.
 * Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), listExpenses);

/**
 * Route: GET /api/expenses/fuel-logs
 * API Name: List Fuel Logs
 * Usecase: Retrieve all fuel log records with optional vehicleId or driverId filters.
 * Restricted to FLEET_MANAGER and FINANCIAL_ANALYST.
 */
router.get('/fuel-logs', authenticate, restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'), listFuelLogs);

/**
 * Route: POST /api/expenses
 * API Name: Record Expense
 * Usecase: Log miscellaneous transit expenses (tolls, cleaning, fuel) in the ledger.
 * Restricted to FLEET_MANAGER, DRIVER, and FINANCIAL_ANALYST.
 */
router.post('/', authenticate, restrictTo('FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST'), createExpense);

export default router;
