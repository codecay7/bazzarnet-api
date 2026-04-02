import express from 'express';
import {
  getAllProducts,
  getProductById,
  getRecommendedProducts, // Import new function
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview, // Import new function
  getProductReviews, // Import new function
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createProductSchema, updateProductSchema } from '../validators/productValidator.js';
import { createProductReviewSchema } from '../validators/reviewValidator.js'; // Import new schema

const router = express.Router();

// Public routes
router.route('/').get(getAllProducts);
router.route('/recommended').get(getRecommendedProducts); // New route for recommended products
router.route('/:id').get(getProductById);

// Product Review routes
router.route('/:id/reviews')
  .post(protect, authorizeRoles('customer'), validate(createProductReviewSchema), createProductReview) // Customer can create review
  .get(getProductReviews); // Anyone can view reviews

// Vendor-only routes
router.post('/', protect, authorizeRoles('vendor'), validate(createProductSchema), createProduct);
router.put('/:id', protect, authorizeRoles('vendor'), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, authorizeRoles('vendor'), deleteProduct);

export default router;