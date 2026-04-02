import Joi from 'joi';

const createProductReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number.',
    'number.integer': 'Rating must be an integer.',
    'number.min': 'Rating must be at least 1.',
    'number.max': 'Rating cannot exceed 5.',
    'any.required': 'Rating is required.',
  }),
  comment: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Comment cannot exceed 500 characters.',
  }),
});

export { createProductReviewSchema };