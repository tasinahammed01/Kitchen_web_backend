import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * JWT algorithm - explicitly specified for security
 */
const JWT_ALGORITHM = 'HS256';

/**
 * Sign a new JWT token with the specified payload.
 */
export const signToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verify a JWT token and return its decoded payload.
 * Explicitly requires HS256 algorithm to prevent algorithm confusion attacks.
 */
export const verifyToken = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });
};
