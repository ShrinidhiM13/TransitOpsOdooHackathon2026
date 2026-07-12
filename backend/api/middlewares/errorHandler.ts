import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || err.issues) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors || err.issues,
    });
  }

  // Handle direct MySQL Errors (e.g. ER_DUP_ENTRY for duplicate keys)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: `Conflict: Duplicate entry detected. ${err.sqlMessage || ''}`,
    });
  }

  // Handle Foreign Key Violations
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(404).json({
      success: false,
      message: `Not Found: Referenced record does not exist. ${err.sqlMessage || ''}`,
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return res.status(status).json({
    success: false,
    message,
  });
};
