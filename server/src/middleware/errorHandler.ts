import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler — catches unhandled errors from routes / middleware.
 * In production, only returns a generic message (no stack traces).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';
  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;

  console.error('[ERROR]', isProd ? message : stack || message);

  res.status(500).json({
    error: isProd ? 'Internal server error' : message,
  });
}
