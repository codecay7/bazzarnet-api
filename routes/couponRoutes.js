import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/couponController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createCouponSchema, updateCouponSchema, validateCouponCodeSchema } from '../validators/couponValidator.js';

const router = express.Router();

// Public route to get active coupons (for listing)
router.get('/', protect, getCoupons); // Protected to ensure user is logged in, but not role-restricted for listing

// Protected route to validate a coupon code
router.post('/validate', protect, validate(validateCouponCodeSchema), validateCoupon);

// Admin-only routes for coupon management
router.use(protect, authorizeRoles('admin'));
router.route('/')
  .post(validate(createCouponSchema), createCoupon); // Admin creates coupon

router.route('/:id')
  .get(getCouponById)
  .put(validate(updateCouponSchema), updateCoupon)
  .delete(deleteCoupon);

export default router;