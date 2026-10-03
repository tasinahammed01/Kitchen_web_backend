"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load configuration from .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
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
const validateJwtSecret = () => {
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
            throw new Error('JWT_SECRET is a known placeholder. Use a cryptographically secure random secret in production.');
        }
        // Require minimum length (32 bytes = 256 bits)
        if (secret.length < 32) {
            throw new Error(`JWT_SECRET is too short (${secret.length} characters). Minimum 32 characters required in production.`);
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
exports.env = {
    NODE_ENV,
    PORT: parseInt(process.env.PORT || '5000', 10),
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/kitchen-store',
    JWT_SECRET,
    JWT_EXPIRES_IN,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'auth_token',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    SESSION_DURATION_MS,
    TRUST_PROXY: process.env.TRUST_PROXY || '0', // Default: do not trust proxy (safe for direct deployment)
};
