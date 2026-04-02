import Joi from 'joi';

const orderItemSchema = Joi.object({
  product: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Product ID must be a valid hexadecimal string.',
    'string.length': 'Product ID must be 24 characters long.',
    'any.required': 'Product ID is required.',
  }),
  name: Joi.string().required(),
  image: Joi.string().uri().required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  unit: Joi.string().required(),
});

const shippingAddressSchema = Joi.object({
  houseNo: Joi.string().trim().required().messages({ 'string.empty': 'House No. is required.' }),
  landmark: Joi.string().trim().allow(''),
  city: Joi.string().trim().required().messages({ 'string.empty': 'City is required.' }),
  state: Joi.string().trim().required().messages({ 'string.empty': 'State is required.' }),
  pinCode: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.empty': 'Pin Code is required.',
    'string.pattern.base': 'Pin Code must be 6 digits.',
  }),
  mobile: Joi.string().pattern(/^\+?\d{10,15}$/).required().messages({ // NEW: Added mobile to address
    'string.empty': 'Mobile number is required.',
    'string.pattern.base': 'Mobile number is invalid.',
    'any.required': 'Mobile number is required.',
  }),
});

const placeOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'Order must contain at least one item.',
    'any.required': 'Order items are required.',
  }),
  shippingAddress: shippingAddressSchema.required(),
  paymentMethod: Joi.string().valid('Credit Card', 'UPI', 'Cash on Delivery', 'UPI QR Payment', 'Razorpay').required().messages({ // NEW: Added 'Razorpay'
    'any.only': 'Invalid payment method.',
    'any.required': 'Payment method is required.',
  }),
  transactionId: Joi.string().when('paymentMethod', { // Conditionally require transactionId for UPI QR Payment and Razorpay
    is: Joi.valid('UPI QR Payment', 'Razorpay'),
    then: Joi.string().required().messages({
      'string.empty': 'Transaction ID is required for this payment method.',
      'any.required': 'Transaction ID is required for this payment method.',
    }),
    otherwise: Joi.string().allow(null, ''), // Allow null or empty for other methods
  }),
  razorpayOrderId: Joi.string().when('paymentMethod', { // NEW: Conditionally require Razorpay Order ID
    is: 'Razorpay',
    then: Joi.string().required().messages({
      'string.empty': 'Razorpay Order ID is required.',
      'any.required': 'Razorpay Order ID is required.',
    }),
    otherwise: Joi.string().allow(null, ''),
  }),
  razorpaySignature: Joi.string().when('paymentMethod', { // NEW: Conditionally require Razorpay Signature
    is: 'Razorpay',
    then: Joi.string().required().messages({
      'string.empty': 'Razorpay Signature is required.',
      'any.required': 'Razorpay Signature is required.',
    }),
    otherwise: Joi.string().allow(null, ''),
  }),
  totalPrice: Joi.number().positive().required().messages({
    'number.base': 'Total price must be a number.',
    'number.positive': 'Total price must be a positive number.',
    'any.required': 'Total price is required.',
  }),
  appliedCoupon: Joi.object({
    _id: Joi.string().hex().length(24).required(),
    code: Joi.string().required(),
    discountAmount: Joi.number().min(0).required(),
    discountType: Joi.string().valid('percentage', 'fixed').optional(), // Added
    discountValue: Joi.number().min(0).optional(), // Added
    isNewUserOnly: Joi.boolean().optional(),
  }).optional().allow(null),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded').required().messages({
    'any.only': 'Invalid order status.',
    'any.required': 'Order status is required.',
  }),
});

const confirmDeliverySchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.empty': 'OTP is required.',
    'string.length': 'OTP must be 6 digits.',
    'string.pattern.base': 'OTP must be numeric.',
    'any.required': 'OTP is required.',
  }),
});

export { placeOrderSchema, updateOrderStatusSchema, confirmDeliverySchema };