import asyncHandler from '../middleware/asyncHandler.js';
import Razorpay from 'razorpay';
import env from '../config/env.js';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a new Razorpay order
// @route   POST /api/razorpay/create-order
// @access  Private/Customer
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR' } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Amount is required and must be a positive number.');
  }

  const options = {
    amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
    currency,
    receipt: `receipt_order_${Date.now()}`,
    payment_capture: 1, // Auto capture payment
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    res.status(201).json({
      orderId: order.id,
      currency: order.currency,
      amount: order.amount / 100, // Convert back to rupees for frontend display
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500);
    throw new Error('Failed to create Razorpay order.');
  }
});

export { createRazorpayOrder };