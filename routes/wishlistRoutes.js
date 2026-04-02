import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getWishlist, addItemToWishlist, removeItemFromWishlist } from '../controllers/wishlistController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { addItemToWishlistSchema } from '../validators/wishlistValidator.js'; // Import new schema

const router = express.Router();

router.route('/')
  .get(protect, getWishlist)
  .post(protect, validate(addItemToWishlistSchema), addItemToWishlist); // Apply validation

router.route('/:id')
  .delete(protect, removeItemFromWishlist);

export default router;