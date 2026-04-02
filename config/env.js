import dotenv from 'dotenv';

// Load environment variables only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL, // New: Admin email for support requests
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID, // NEW: Razorpay Key ID
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET, // NEW: Razorpay Key Secret
  // NEW: Cloudinary Credentials
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

// Basic validation to ensure critical variables are set, but skip in test environment
if (env.NODE_ENV !== 'test') {
  const requiredEnvVars = [
    'MONGO_URI', 'JWT_SECRET', 'EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 
    'FRONTEND_URL', 'ADMIN_EMAIL', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET',
    'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET' // NEW: Add Cloudinary vars
  ];
  for (const key of requiredEnvVars) {
    if (!env[key]) {
      console.error(`Error: Environment variable ${key} is not set.`);
      process.exit(1); // Exit the process if a critical variable is missing
    }
  }
}

export default env;