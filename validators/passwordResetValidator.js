import Joi from 'joi';

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'in'] } }).required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required.',
    'any.required': 'Reset token is required.',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'New password is required.',
    'string.min': 'New password must be at least 6 characters long.',
    'any.required': 'New password is required.',
  }),
});

export { forgotPasswordSchema, resetPasswordSchema };