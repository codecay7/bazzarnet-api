import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generates a JWT token for a given user ID.
 * @param {string} id - The user's ID.
 * @returns {string} The generated JWT token.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {object|null} The decoded token payload if valid, otherwise null.
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
};

export { generateToken, verifyToken };