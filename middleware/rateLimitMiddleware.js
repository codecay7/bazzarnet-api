import rateLimit from 'express-rate-limit';

// Rate limit for authentication routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limit for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 requests per hour per IP
  message: 'Too many password reset requests from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

export { authLimiter, passwordResetLimiter };