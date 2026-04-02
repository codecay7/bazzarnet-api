import express from 'express';
import { getMe, updateUserProfile, updateUserProfileImage, getPendingReviews, getMySupportTickets } from '../controllers/userController.js'; // Import getMySupportTickets
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { updateCustomerProfileSchema, updateVendorProfileSchema } from '../validators/userValidator.js';
import upload from '../middleware/uploadMiddleware.js'; // Import upload middleware

const router = express.Router();

// Protected route to get the authenticated user's profile
router.get('/me', protect, getMe);

// Protected route to update the authenticated user's profile
// The validation schema will be applied conditionally in the controller based on user role
router.put('/me', protect, updateUserProfile);

// Protected route to update user's profile image
router.put('/me/profile-image', protect, upload.single('image'), updateUserProfileImage); // New route for image upload

// Protected route to get products user has purchased and can review
router.get('/me/pending-reviews', protect, authorizeRoles('customer'), getPendingReviews); // New route

// NEW: Protected route to get support tickets submitted by the current user
router.get('/me/support-tickets', protect, getMySupportTickets);

export default router;