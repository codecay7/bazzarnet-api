import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { createRazorpayOrder } from '../controllers/razorpayController.js';
import { validate } from '../middleware/validationMiddleware.js';
import Joi from 'joi';

const router = express.Router();

// Joi schema for creating a Razorpay order
const createRazorpayOrderSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number.',
    'number.positive': 'Amount must be a positive number.',
    'any.required': 'Amount is required.',
  }),
  currency: Joi.string().valid('INR', 'USD').default('INR').optional(), // Allow other currencies if Razorpay supports them for your account
});

// Route to create a Razorpay order (protected for customers)
router.post('/create-order', protect, authorizeRoles('customer'), validate(createRazorpayOrderSchema), createRazorpayOrder);

export default router;