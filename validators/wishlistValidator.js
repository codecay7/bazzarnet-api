import Joi from 'joi';

const addItemToWishlistSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Product ID must be a valid hexadecimal string.',
    'string.length': 'Product ID must be 24 characters long.',
    'any.required': 'Product ID is required.',
  }),
  unit: Joi.string().optional(), // Unit is optional for wishlist, as it's not stored in the model
});

export { addItemToWishlistSchema };