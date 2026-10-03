import dotenv from 'dotenv';
import path from 'path';

// Load configuration from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

// Known placeholder secrets that must be rejected in production
const PLACEHOLDER_SECRETS = [
  'dev-jwt-secret-change-in-production',
  'change-me',
  'secret',
  'jwt-secret',
  'your-secret-key',
];

/**
 * Validate JWT secret strength
 * Production requires strong secrets (minimum 32 bytes)
 * Development allows a fallback for local testing
 */
const validateJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    // Development fallback
    console.warn('[Security Warning] Using development-only JWT secret. Set JWT_SECRET in production.');
    return 'dev-jwt-secret-change-in-production';
  }

  // Check for known placeholders in production
  if (NODE_ENV === 'production') {
    if (PLACEHOLDER_SECRETS.includes(secret)) {
      throw new Error(
        'JWT_SECRET is a known placeholder. Use a cryptographically secure random secret in production.'
      );
    }

    // Require minimum length (32 bytes = 256 bits)
    if (secret.length < 32) {
      throw new Error(
        `JWT_SECRET is too short (${secret.length} characters). Minimum 32 characters required in production.`
      );
    }
  }

  return secret;
};

const JWT_SECRET = validateJwtSecret();

// Single session duration source used for both JWT and cookie expiration
// Default: 7 days in milliseconds
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Convert SESSION_DURATION_MS to JWT_EXPIRES_IN format (e.g., '7d')
const SESSION_DURATION_DAYS = Math.floor(SESSION_DURATION_MS / (24 * 60 * 60 * 1000));
const JWT_EXPIRES_IN = `${SESSION_DURATION_DAYS}d`;

/**
 * Parse TRUST_PROXY environment variable
 *
 * Accepted formats:
 * - unset or "0" → 0 (no proxy, direct deployment - DEFAULT)
 * - "1" → 1 (single trusted reverse proxy)
 * - "2" → 2 (two trusted reverse proxies)
 * - "false" → false (no proxy, equivalent to 0)
 * - explicit IP/subnet values (e.g., "loopback, 123.45.67.89")
 *
 * REJECTED:
 * - "true" or any generic trust-all configuration
 * - negative numbers
 * - arbitrary strings that are not valid IP/subnet notation
 *
 * Returns: number | boolean | string (Express accepts all these types)
 */
export const parseTrustProxy = (trustProxyValue?: string | null): number | boolean | string => {
  const trustProxy = trustProxyValue !== undefined ? trustProxyValue : process.env.TRUST_PROXY;

  // If unset, default to 0 (no proxy - safe default)
  if (trustProxy === undefined || trustProxy === null || trustProxy === '') {
    return 0;
  }

  // If "0", return number 0 (no proxy)
  if (trustProxy === '0') {
    return 0;
  }

  // If "1", return number 1 (single trusted proxy)
  if (trustProxy === '1') {
    return 1;
  }

  // If "2", return number 2 (two trusted proxies)
  if (trustProxy === '2') {
    return 2;
  }

  // If "false", return boolean false (no proxy)
  if (trustProxy === 'false') {
    return false;
  }

  // REJECT "true" - generic trust-all is not allowed
  if (trustProxy === 'true') {
    throw new Error(
      'TRUST_PROXY=true is not allowed. Use explicit hop count (e.g., 1 for one Nginx proxy) or specific IP/subnet notation. Generic trust-all configurations are unsafe for IP-based rate limiting.'
    );
  }

  // REJECT negative numbers
  if (/^-\d+$/.test(trustProxy)) {
    throw new Error(
      `TRUST_PROXY="${trustProxy}" is invalid. Negative hop counts are not allowed.`
    );
  }

  // For other values (e.g., subnet notation like "loopback, 123.45.67.89"),
  // return as-is for Express to parse
  // Note: Express will validate these at runtime; invalid values will cause Express errors
  return trustProxy;
};

export const env = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/kitchen-store',
  JWT_SECRET,
  JWT_EXPIRES_IN,
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'auth_token',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  SESSION_DURATION_MS,
  TRUST_PROXY: parseTrustProxy(),
};
