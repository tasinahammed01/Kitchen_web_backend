import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { toPublicUser } from '../utils/userSerializer';
import { env } from '../config/env';
import { getAuthCookieOptions, getClearCookieOptions } from '../utils/cookieConfig';

const BCRYPT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const BCRYPT_MAX_BYTES = 72; // bcrypt only uses first 72 bytes

/**
 * Register a new user
 * Public endpoint - always creates customer role
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validation using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
      return;
    }

    // Check password byte length (bcrypt only uses first 72 bytes)
    const passwordByteLength = Buffer.byteLength(password, 'utf8');
    if (passwordByteLength > BCRYPT_MAX_BYTES) {
      res.status(400).json({
        success: false,
        message: `Password is too long (exceeds ${BCRYPT_MAX_BYTES} bytes)`,
      });
      return;
    }

    // Normalize email first
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email using normalized value
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user with explicit allowlist - role is always customer
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'customer',
      isActive: true,
    });

    // Sign JWT
    const token = signToken({ sub: user._id.toString() });

    // Set HTTP-only cookie using centralized config
    res.cookie(env.AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    // Return sanitized user with no-cache headers
    res.set('Cache-Control', 'no-store');
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: toPublicUser(user),
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if ((error as any).code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

/**
 * Validation rules for registration
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`)
    .custom((value) => {
      // Check UTF-8 byte length (bcrypt only uses first 72 bytes)
      const byteLength = Buffer.byteLength(value, 'utf8');
      if (byteLength > BCRYPT_MAX_BYTES) {
        throw new Error(`Password exceeds ${BCRYPT_MAX_BYTES} byte limit`);
      }
      return true;
    }),
];

/**
 * Login user
 * Generic error messages to prevent account enumeration
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Sign JWT
    const token = signToken({ sub: user._id.toString() });

    // Set HTTP-only cookie using centralized config
    res.cookie(env.AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    // Return sanitized user with no-cache headers
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Login successful',
      data: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

/**
 * Validation rules for login
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Invalid email or password')
    .isEmail().withMessage('Invalid email or password')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Invalid email or password'),
];

/**
 * Get current user
 * Protected route - requires authentication
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

/**
 * Logout user
 * Clears the HTTP-only cookie
 * Idempotent - does not require authentication
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie(env.AUTH_COOKIE_NAME, getClearCookieOptions());

    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};
