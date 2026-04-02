import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Store from '../models/Store.js'; // Import Store model
import Order from '../models/Order.js'; // Import Order model
import Review from '../models/Review.js'; // Import Review model
import SupportTicket from '../models/SupportTicket.js'; // NEW: Import SupportTicket model
import { updateCustomerProfileSchema, updateVendorProfileSchema } from '../validators/userValidator.js'; // Import validators

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    let responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      address: user.address,
      phone: user.phone,
      upiId: user.upiId,
      cardDetails: user.cardDetails,
      profileImage: user.profileImage,
    };

    if (user.role === 'vendor' && user.storeId) {
      const store = await Store.findById(user.storeId);
      responseData.storeId = store?._id;
      responseData.store = store?.name;
      responseData.pan = user.pan;
      responseData.gst = user.gst;
      responseData.description = user.description;
      responseData.category = user.category;
      responseData.bankAccount = user.bankAccount;
      responseData.bankName = user.bankName;
      responseData.ifsc = user.ifsc;
    }

    res.json(responseData);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    let validatedData;
    if (user.role === 'customer') {
      const { error } = updateCustomerProfileSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
      if (error) {
        res.status(400);
        throw new Error(error.details.map(err => err.message).join(', '));
      }
      validatedData = req.body;
    } else if (user.role === 'vendor') {
      const { error } = updateVendorProfileSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
      if (error) {
        res.status(400);
        throw new Error(error.details.map(err => err.message).join(', '));
      }
      validatedData = req.body;
    } else {
      res.status(403);
      throw new Error('Admin profiles cannot be updated via this endpoint.');
    }

    // Update user fields
    user.name = validatedData.name || user.name;
    user.phone = validatedData.phone || user.phone;
    user.upiId = validatedData.upiId || user.upiId;
    // profileImage is handled by a separate endpoint, so don't update it here
    // user.profileImage = validatedData.profileImage || user.profileImage;

    // Update nested address fields
    if (validatedData.address) {
      user.address = { ...user.address, ...validatedData.address };
    }

    // Update nested cardDetails fields
    if (validatedData.cardDetails) {
      user.cardDetails = { ...user.cardDetails, ...validatedData.cardDetails };
    }

    // Update vendor-specific fields
    if (user.role === 'vendor') {
      user.pan = validatedData.pan || user.pan;
      user.gst = validatedData.gst || user.gst;
      user.description = validatedData.description || user.description;
      user.category = validatedData.category || user.category;
      user.bankAccount = validatedData.bankAccount || user.bankAccount;
      user.bankName = validatedData.bankName || user.bankName;
      user.ifsc = validatedData.ifsc || user.ifsc;

      // Also update the associated store if store-related fields are changed
      const store = await Store.findById(user.storeId);
      if (store) {
        store.description = validatedData.description || store.description;
        store.category = validatedData.category || store.category;
        store.phone = validatedData.phone || store.phone;
        if (validatedData.address) {
          store.address = { ...store.address, ...validatedData.address };
        }
        await store.save();
      }
    }

    const updatedUser = await user.save();

    let responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      address: updatedUser.address,
      phone: updatedUser.phone,
      upiId: updatedUser.upiId,
      cardDetails: updatedUser.cardDetails,
      profileImage: updatedUser.profileImage,
    };

    if (updatedUser.role === 'vendor' && updatedUser.storeId) {
      const store = await Store.findById(updatedUser.storeId);
      responseData.storeId = store?._id;
      responseData.store = store?.name;
      responseData.pan = updatedUser.pan;
      responseData.gst = updatedUser.gst;
      responseData.description = updatedUser.description;
      responseData.category = updatedUser.category;
      responseData.bankAccount = updatedUser.bankAccount;
      responseData.bankName = updatedUser.bankName;
      responseData.ifsc = updatedUser.ifsc;
    }

    res.json(responseData);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile image
// @route   PUT /api/users/me/profile-image
// @access  Private
const updateUserProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (req.file) {
    const filePath = `/uploads/${req.file.filename}`;
    user.profileImage = filePath;
    await user.save();

    // If the user is a vendor, also update their store's logo with the same image
    if (user.role === 'vendor' && user.storeId) {
      const store = await Store.findById(user.storeId);
      if (store) {
        store.logo = filePath;
        await store.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      message: 'Profile image updated successfully',
    });
  } else {
    res.status(400);
    throw new Error('No image file provided');
  }
});

// @desc    Get products user has purchased and can review
// @route   GET /api/users/me/pending-reviews
// @access  Private/Customer
const getPendingReviews = asyncHandler(async (req, res) => {
  // Find all delivered orders for the current user
  const deliveredOrders = await Order.find({
    user: req.user._id,
    orderStatus: 'Delivered',
  }).select('items.product items.name items.image items.unit');

  // Collect all unique product IDs from these orders
  const purchasedProductIds = new Set();
  deliveredOrders.forEach(order => {
    order.items.forEach(item => {
      purchasedProductIds.add(item.product.toString());
    });
  });

  // Find products that the user has already reviewed
  const reviewedProducts = await Review.find({
    user: req.user._id,
    product: { $in: Array.from(purchasedProductIds) },
  }).select('product');

  const reviewedProductIds = new Set(reviewedProducts.map(review => review.product.toString()));

  // Filter out products that have already been reviewed
  const productsToReview = [];
  deliveredOrders.forEach(order => {
    order.items.forEach(item => {
      if (!reviewedProductIds.has(item.product.toString())) {
        // Add product details to the list if not already reviewed
        // Ensure uniqueness in the final list, as a product might appear in multiple orders
        if (!productsToReview.some(p => p._id.toString() === item.product.toString())) {
          productsToReview.push({
            _id: item.product,
            name: item.name,
            image: item.image,
            unit: item.unit,
          });
        }
      }
    });
  });

  res.json(productsToReview);
});

// NEW: @desc    Get support tickets submitted by the current user
// NEW: @route   GET /api/users/me/support-tickets
// NEW: @access  Private
const getMySupportTickets = asyncHandler(async (req, res) => {
  // Find support tickets where the email matches the logged-in user's email
  // We use email because the support form allows guests to submit, and we link by email.
  const tickets = await SupportTicket.find({ email: req.user.email })
    .sort({ createdAt: -1 }); // Latest first

  res.json(tickets);
});


export { getMe, updateUserProfile, updateUserProfileImage, getPendingReviews, getMySupportTickets };