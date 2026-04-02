import crypto from 'crypto';

/**
 * Generates a 6-digit OTP.
 * @returns {string} A 6-digit OTP.
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generates a random token for password reset.
 * @returns {string} A random hexadecimal string.
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export { generateOtp, generatePasswordResetToken };