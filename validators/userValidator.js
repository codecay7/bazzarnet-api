import Joi from 'joi';

const addressSchema = Joi.object({
  houseNo: Joi.string().trim().allow(''),
  landmark: Joi.string().trim().allow(''),
  city: Joi.string().trim().allow(''),
  state: Joi.string().trim().allow(''),
  pinCode: Joi.string().pattern(/^\d{6}$/).messages({
    'string.pattern.base': 'Pin Code must be 6 digits.',
  }).allow(''),
  mobile: Joi.string().pattern(/^\+?\d{10,15}$/).messages({ // NEW: Added mobile to address
    'string.pattern.base': 'Mobile number is invalid.',
  }).allow(''),
}).default({});

const cardDetailsSchema = Joi.object({
  cardNumber: Joi.string().trim().allow(''),
  expiry: Joi.string().trim().allow(''),
  cardHolder: Joi.string().trim().allow(''),
}).default({});

// Schema for updating customer profile
const updateCustomerProfileSchema = Joi.object({
  name: Joi.string().min(3).max(50).trim().messages({
    'string.min': 'Name must be at least 3 characters long.',
    'string.max': 'Name cannot exceed 50 characters.',
  }).allow(''),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).messages({
    'string.pattern.base': 'Phone number is invalid.',
  }).allow(''),
  address: addressSchema,
  upiId: Joi.string().trim().allow(''),
  cardDetails: cardDetailsSchema,
  profileImage: Joi.string().uri().allow(null, ''), // Allow empty string or valid URL, or null
});

// Schema for updating vendor profile
const updateVendorProfileSchema = Joi.object({
  name: Joi.string().min(3).max(50).trim().messages({
    'string.min': 'Full Name must be at least 3 characters long.',
    'string.max': 'Full Name cannot exceed 50 characters.',
  }).allow(''),
  phone: Joi.string().pattern(/^\+?\d{10,15}$/).messages({
    'string.pattern.base': 'Phone number is invalid.',
  }).allow(''),
  address: addressSchema,
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).messages({
    'string.pattern.base': 'Invalid PAN format.',
  }).allow(''),
  gst: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).messages({
    'string.pattern.base': 'Invalid GST format.',
  }).allow(''),
  category: Joi.string().valid('Groceries', 'Bakery', 'Butcher', 'Cafe', 'Electronics', 'Furniture', 'Decor', 'Clothing', 'Other').allow(''),
  description: Joi.string().min(10).max(500).messages({
    'string.min': 'Business Description must be at least 10 characters long.',
    'string.max': 'Business Description cannot exceed 500 characters.',
  }).allow(''),
  bankAccount: Joi.string().trim().allow(''),
  bankName: Joi.string().trim().allow(''),
  ifsc: Joi.string().trim().uppercase().allow(''),
  upiId: Joi.string().trim().allow(''),
  profileImage: Joi.string().uri().allow(null, ''), // Allow empty string or valid URL, or null
});

export { updateCustomerProfileSchema, updateVendorProfileSchema };