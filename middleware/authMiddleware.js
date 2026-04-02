import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import env from '../config/env.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Backend: Token received:', token ? 'Token present' : 'No token');

      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);
      console.log('Backend: Token decoded successfully for user ID:', decoded.id);

      // Find user by ID from the token payload and attach to request
      // Exclude password and other sensitive fields
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error('Backend: JWT verification error:', error.message); // Log the specific JWT error
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Middleware to authorize users based on their role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403); // Forbidden
      throw new Error(`Not authorized as ${req.user?.role || 'guest'}. Access restricted to: ${roles.join(', ')}`);
    }
    next();
  };
};

export { protect, authorizeRoles };