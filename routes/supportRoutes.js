import express from 'express';
import { submitSupportRequest, getAllSupportRequests, updateSupportTicketStatus } from '../controllers/supportController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { submitSupportSchema, updateSupportTicketStatusSchema } from '../validators/supportValidator.js'; // Import new schema
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'; // Import auth middleware

const router = express.Router();

// Public route for submitting support requests
router.post('/submit', validate(submitSupportSchema), submitSupportRequest);

// Admin-only routes for support ticket management
router.route('/admin')
  .get(protect, authorizeRoles('admin'), getAllSupportRequests);

router.route('/admin/:id/status')
  .put(protect, authorizeRoles('admin'), validate(updateSupportTicketStatusSchema), updateSupportTicketStatus); // Apply validation

export default router;