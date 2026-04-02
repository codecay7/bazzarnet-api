import express from 'express';
import {
  getAllStores,
  getStoreById,
  updateStore,
} from '../controllers/storeController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { updateStoreSchema } from '../validators/storeValidator.js';

const router = express.Router();

// Public routes
router.route('/').get(getAllStores);
router.route('/:id').get(getStoreById);

// Vendor-only route
router.put('/:id', protect, authorizeRoles('vendor'), validate(updateStoreSchema), updateStore);

export default router;