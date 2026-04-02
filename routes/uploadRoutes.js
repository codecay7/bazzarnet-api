import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming uploads are protected

const router = express.Router();

// Route for image upload
// 'image' is the field name in the form data
router.post('/', protect, upload.single('image'), uploadImage);

export default router;