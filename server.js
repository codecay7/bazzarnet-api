import dotenv from 'dotenv'; // NEW: Import dotenv
dotenv.config(); // NEW: Load environment variables as early as possible

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import mongoSanitize from 'express-mongo-sanitize'; // New: Import mongoSanitize
import xss from 'xss-clean'; // New: Import xss-clean

import env from "./config/env.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import razorpayRoutes from "./routes/razorpayRoutes.js"; // NEW: Import Razorpay routes

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { authLimiter, passwordResetLimiter } from "./middleware/rateLimitMiddleware.js"; // New: Import rate limiters

// NEW: Import User model and importData from seeder
import User from './models/User.js';
import { importData } from './seeder.js';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Connect DB
// Only connect to DB if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// NEW: Auto-seed data if database is empty in development mode
const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Seeding initial data...');
      // Pass a flag to seeder.js to prevent process.exit() when imported
      await importData();
      console.log('Initial data seeded successfully.');
    } else {
      console.log('Database already contains data. Skipping seeding.');
    }
  } catch (error) {
    console.error('Error during auto-seeding:', error);
    // Do not exit process, let the server continue if possible
  }
};

// Run seeding logic immediately after DB connection in development
if (env.NODE_ENV === 'development') {
  seedDatabase();
}


// Middleware
app.use(express.json()); // Moved to be the very first middleware
app.use(cors());

// New: Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// New: Data sanitization against XSS
app.use(xss());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 BazzarNet Backend API is running...");
});

// Routes
app.use("/api/auth", authLimiter, authRoutes); // Apply authLimiter
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/password-reset", passwordResetLimiter, passwordResetRoutes); // Apply passwordResetLimiter
app.use("/api/support", supportRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/razorpay", razorpayRoutes); // NEW: Use Razorpay routes

// Serve static uploads (no longer needed if using Cloudinary, but kept for local fallback)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
// Only listen if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(
      `🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}\nAPI: http://localhost:${env.PORT}`
    );
  });
}

export default app; // Export the app for testing