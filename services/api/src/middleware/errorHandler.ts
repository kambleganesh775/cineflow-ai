import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Structured logging for Cloud Logging and local debugging
  const errorLog = {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    errorMessage: err.message || 'Unknown error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    user: req.user?.email || 'unauthenticated',
  };
  console.error('[API Error]', JSON.stringify(errorLog));

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload parameters.',
        details: err.errors,
      },
    });
    return;
  }

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    },
  });
}
