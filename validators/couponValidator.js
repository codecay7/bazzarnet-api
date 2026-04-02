import Joi from 'joi';

const createCouponSchema = Joi.object({
  code: Joi.string().uppercase().trim().min(3).max(20).required().messages({
    'string.empty': 'Coupon code is required.',
    'string.min': 'Coupon code must be at least 3 characters long.',
    'string.max': 'Coupon code cannot exceed 20 characters.',
    'any.required': 'Coupon code is required.',
  }),
  discountType: Joi.string().valid('percentage', 'fixed').required().messages({
    'any.only': 'Discount type must be either "percentage" or "fixed".',
    'any.required': 'Discount type is required.',
  }),
  discountValue: Joi.number().positive().required().messages({
    'number.base': 'Discount value must be a number.',
    'number.positive': 'Discount value must be a positive number.',
    'any.required': 'Discount value is required.',
  }),
  minOrderAmount: Joi.number().min(0).default(0),
  maxDiscountAmount: Joi.number().min(0).allow(null).default(null),
  expiryDate: Joi.date().iso().greater('now').required().messages({
    'date.base': 'Expiry date must be a valid date.',
    'date.iso': 'Expiry date must be in ISO format.',
    'date.greater': 'Expiry date must be in the future.',
    'any.required': 'Expiry date is required.',
  }),
  usageLimit: Joi.number().integer().min(1).allow(null).default(null),
  isActive: Joi.boolean().default(true),
  isNewUserOnly: Joi.boolean().default(false),
});

const updateCouponSchema = Joi.object({
  code: Joi.string().uppercase().trim().min(3).max(20).optional(),
  discountType: Joi.string().valid('percentage', 'fixed').optional(),
  discountValue: Joi.number().positive().optional(),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().min(0).allow(null).optional(),
  expiryDate: Joi.date().iso().greater('now').optional(),
  usageLimit: Joi.number().integer().min(1).allow(null).optional(),
  isActive: Joi.boolean().optional(),
  isNewUserOnly: Joi.boolean().optional(),
});

const validateCouponCodeSchema = Joi.object({
  code: Joi.string().uppercase().trim().required().messages({
    'string.empty': 'Coupon code is required.',
    'any.required': 'Coupon code is required.',
  }),
  totalPrice: Joi.number().positive().required().messages({
    'number.base': 'Total price must be a number.',
    'number.positive': 'Total price must be a positive number.',
    'any.required': 'Total price is required.',
  }),
});

export { createCouponSchema, updateCouponSchema, validateCouponCodeSchema };