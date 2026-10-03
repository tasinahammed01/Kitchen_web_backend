import { env } from '../config/env';

/**
 * Centralized cookie configuration for authentication
 *
 * Ensures consistent cookie settings across register, login, and logout.
 * Cookie lifetime is synchronized with JWT expiration via SESSION_DURATION_MS.
 */

const isProduction = env.NODE_ENV === 'production';

/**
 * Get auth cookie options for setting cookies
 * Used in register and login endpoints
 */
export const getAuthCookieOptions = () => {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: env.SESSION_DURATION_MS, // Synchronized with JWT_EXPIRES_IN
  };
};

/**
 * Get auth cookie options for clearing cookies
 * Used in logout endpoint
 * Must match the exact options used when setting the cookie
 */
export const getClearCookieOptions = () => {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };
};
