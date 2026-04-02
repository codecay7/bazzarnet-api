import asyncHandler from '../middleware/asyncHandler.js';
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary v2
import env from '../config/env.js'; // Import environment variables

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// @desc    Upload image file to Cloudinary
// @route   POST /api/upload
// @access  Private
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  // Check if the file buffer exists
  if (!req.file.buffer) {
    res.status(400);
    throw new Error('File buffer is missing. Ensure Multer is configured for memory storage.');
  }

  // Upload image to Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'bazzarnet' }, // Optional: specify a folder in Cloudinary
    async (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500);
        throw new Error('Image upload to Cloudinary failed.');
      }
      // result.secure_url contains the URL of the uploaded image
      res.json({ message: 'Image uploaded successfully', filePath: result.secure_url });
    }
  );

  // Pipe the buffer to the upload stream
  uploadStream.end(req.file.buffer);
});

export { uploadImage };