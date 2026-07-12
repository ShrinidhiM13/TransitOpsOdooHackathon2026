import { Router } from 'express';
import { createExpense } from '../controllers/expense.controller';
import { authenticate, restrictTo } from '../middlewares/auth';

const router = Router();

/**
 * Route: POST /api/expenses
 * API Name: Record Expense
 * Usecase: Log miscellaneous transit expenses (tolls, cleaning, fuel) in the ledger. Restricted to FLEET_MANAGER, DRIVER, and FINANCIAL_ANALYST.
 */
router.post('/', authenticate, restrictTo('FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST'), createExpense);

export default router;
