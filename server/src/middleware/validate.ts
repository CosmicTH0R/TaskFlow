import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured field-level errors on failure.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((e: ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({ error: 'Validation failed', errors });
        return;
      }
      next(err);
    }
  };
}
