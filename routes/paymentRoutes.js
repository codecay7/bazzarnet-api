import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { getVendorPayments, reportPaymentIssue } from '../controllers/paymentController.js';

const router = express.Router();

// Vendor-specific payment routes
router.route('/vendor/:vendorId')
  .get(protect, authorizeRoles('vendor'), getVendorPayments);

router.route('/:id/report-issue')
  .post(protect, authorizeRoles('vendor'), reportPaymentIssue);

export default router;