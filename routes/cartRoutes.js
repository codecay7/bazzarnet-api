import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { getCart, addItemToCart, updateCartItemQuantity, removeItemFromCart } from '../controllers/cartController.js';
import { validate } from '../middleware/validationMiddleware.js';
import Joi from 'joi';

const router = express.Router();

// Joi schema for adding item to cart
const addItemToCartSchema = Joi.object({
  productId: Joi.string().required().messages({
    'string.empty': 'Product ID is required.',
    'any.required': 'Product ID is required.',
  }),
  quantity: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Quantity must be a number.',
    'number.integer': 'Quantity must be an integer.',
    'number.min': 'Quantity must be at least 1.',
  }),
  unit: Joi.string().required().messages({ // Added unit field
    'string.empty': 'Unit is required.',
    'any.required': 'Unit is required.',
  }),
});

// Joi schema for updating item quantity in cart
const updateCartItemQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity is required and must be a number.',
    'number.integer': 'Quantity must be an integer.',
    'number.min': 'Quantity must be at least 1.',
    'any.required': 'Quantity is required.',
  }),
});

// All cart routes are protected and restricted to customer role
router.use(protect, authorizeRoles('customer'));

router.route('/')
  .get(getCart)
  .post(validate(addItemToCartSchema), addItemToCart);

router.route('/:productId')
  .put(validate(updateCartItemQuantitySchema), updateCartItemQuantity)
  .delete(removeItemFromCart);

export default router;