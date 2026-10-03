"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * JWT algorithm - explicitly specified for security
 */
const JWT_ALGORITHM = 'HS256';
/**
 * Sign a new JWT token with the specified payload.
 */
const signToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        algorithm: JWT_ALGORITHM,
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
};
exports.signToken = signToken;
/**
 * Verify a JWT token and return its decoded payload.
 * Explicitly requires HS256 algorithm to prevent algorithm confusion attacks.
 */
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
    });
};
exports.verifyToken = verifyToken;
