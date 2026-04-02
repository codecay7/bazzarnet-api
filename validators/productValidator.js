import Joi from 'joi';

const validUnits = ['pc', 'kg', 'g', 'L', 'ml', 'dozen', 'pack', 'set', 'pair', 'unit'];

const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Product name is required.',
    'string.min': 'Product name must be at least 3 characters long.',
    'any.required': 'Product name is required.',
  }),
  description: Joi.string().min(10).required().messages({
    'string.empty': 'Description is required.',
    'string.min': 'Description must be at least 10 characters long.',
    'any.required': 'Description is required.',
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'Price must be a number.',
    'number.positive': 'Price must be a positive number.',
    'any.required': 'Price is required.',
  }),
  originalPrice: Joi.number().positive().optional().allow(null, '').messages({
    'number.positive': 'Original price must be a positive number.',
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number.',
    'number.min': 'Stock cannot be negative.',
    'any.required': 'Stock is required.',
  }),
  unit: Joi.string().valid(...validUnits).required().messages({ // New unit validation
    'string.empty': 'Unit is required.',
    'any.only': `Unit must be one of ${validUnits.join(', ')}.`,
    'any.required': 'Unit is required.',
  }),
  category: Joi.string().valid('Groceries', 'Bakery', 'Butcher', 'Cafe', 'Electronics', 'Furniture', 'Decor', 'Clothing', 'Other').required().messages({
    'any.required': 'Category is required.',
    'any.only': 'Please select a valid category.',
  }),
  image: Joi.string().uri().optional().allow('').messages({
    'string.uri': 'Please provide a valid image URL.',
  }),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().min(10).optional(),
  price: Joi.number().positive().optional(),
  originalPrice: Joi.number().positive().optional().allow(null, ''),
  stock: Joi.number().integer().min(0).optional(),
  unit: Joi.string().valid(...validUnits).optional(), // New unit validation
  category: Joi.string().valid('Groceries', 'Bakery', 'Butcher', 'Cafe', 'Electronics', 'Furniture', 'Decor', 'Clothing', 'Other').optional(),
  image: Joi.string().uri().optional().allow(''),
  isActive: Joi.boolean().optional(),
});

export { createProductSchema, updateProductSchema };