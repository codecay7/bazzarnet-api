import Joi from 'joi';

const submitSupportSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 3 characters long.',
    'any.required': 'Name is required.',
  }),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'in'] } }).required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.',
  }),
  role: Joi.string().valid('customer', 'vendor', 'admin', 'guest').default('guest'),
  subject: Joi.string().min(5).max(200).required().messages({
    'string.empty': 'Subject is required.',
    'string.min': 'Subject must be at least 5 characters long.',
    'any.required': 'Subject is required.',
  }),
  message: Joi.string().min(20).max(2000).required().messages({
    'string.empty': 'Message is required.',
    'string.min': 'Message must be at least 20 characters long.',
    'any.required': 'Message is required.',
  }),
});

const updateSupportTicketStatusSchema = Joi.object({
  status: Joi.string().valid('Open', 'Resolved', 'Closed').required().messages({
    'any.only': 'Invalid status for support ticket.',
    'any.required': 'Status is required.',
  }),
  adminNotes: Joi.string().max(1000).allow('').optional(),
});

export { submitSupportSchema, updateSupportTicketStatusSchema };