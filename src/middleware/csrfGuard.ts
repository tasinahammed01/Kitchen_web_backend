import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware for Admin Mutations
 *
 * This middleware protects state-changing admin endpoints from CSRF attacks
 * by requiring a custom header (X-CSRF-Guard: 1) on authenticated requests.
 *
 * ARCHITECTURE:
 * - Relies on browser same-origin policy and CORS configuration
 * - Cross-origin arbitrary sites cannot send custom credentialed headers without passing CORS
 * - Admin GET routes do NOT require this header (read-only)
 * - POST/PATCH/DELETE admin routes DO require this header (state-changing)
 *
 * CORS relationship:
 * - CORS is configured to allow only the trusted frontend origin
 * - Credentials (cookies) are enabled
 * - Cross-origin sites cannot send authenticated requests with custom headers
 * - This makes the custom header a effective CSRF guard
 *
 * The defense relies on browser security semantics, not security by obscurity.
 */
const CSRF_HEADER = 'x-csrf-guard';
const CSRF_HEADER_VALUE = '1';

export const csrfGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only apply to state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Check for required CSRF header
  const csrfHeaderValue = req.headers[CSRF_HEADER];

  if (csrfHeaderValue !== CSRF_HEADER_VALUE) {
    res.status(403).json({
      success: false,
      message: 'Forbidden.',
    });
    return;
  }

  next();
};
