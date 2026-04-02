import Joi from 'joi';

const updateStoreSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().min(10).optional(),
  category: Joi.string().valid('Groceries', 'Bakery', 'Butcher', 'Cafe', 'Electronics', 'Furniture', 'Decor', 'Clothing', 'Other').optional(),
  address: Joi.object({
    houseNo: Joi.string().trim().optional(),
    landmark: Joi.string().trim().optional().allow(''),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().optional(),
    pinCode: Joi.string().pattern(/^\d{6}$/).optional().messages({
      'string.pattern.base': 'Pin Code must be 6 digits.',
    }),
  }).optional(),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).optional().messages({
    'string.pattern.base': 'Phone number is invalid.',
  }),
  email: Joi.string().email().optional(),
  logo: Joi.string().uri().optional().allow(''),
  isActive: Joi.boolean().optional(),
});

export { updateStoreSchema };