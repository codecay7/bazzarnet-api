import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { getVendorDashboardStats } from '../controllers/vendorController.js';

const router = express.Router();

// All vendor dashboard routes are protected and restricted to vendor role
router.use(protect, authorizeRoles('vendor'));

router.get('/:vendorId/dashboard/stats', getVendorDashboardStats);

export default router;