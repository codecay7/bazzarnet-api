import asyncHandler from '../middleware/asyncHandler.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js'; // Import Order model to check user's order history

// @desc    Get all coupons (Admin only, or public for listing active ones)
// @route   GET /api/coupons
// @access  Private (requires user to be logged in)
const getCoupons = asyncHandler(async (req, res) => {
  const { isActive, isNewUserOnly, search } = req.query;
  let query = {};

  // If not admin, only show active coupons.
  // New user only coupons will be filtered client-side based on user's order history.
  if (req.user?.role !== 'admin') {
    query.isActive = true;
  } else {
    // Admin can filter by isActive and isNewUserOnly
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (isNewUserOnly !== undefined) {
      query.isNewUserOnly = isNewUserOnly === 'true';
    }
  }

  if (search) {
    query.code = { $regex: search, $options: 'i' };
  }

  const coupons = await Coupon.find(query).sort({ createdAt: -1 });
  res.json(coupons);
});

// @desc    Get coupon by ID (Admin only)
// @route   GET /api/coupons/:id
// @access  Private/Admin
const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    res.json(coupon);
  } else {
    res.status(404);
    throw new Error('Coupon not found');
  }
});

// @desc    Create a new coupon (Admin only)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit, isActive, isNewUserOnly } = req.body;

  const couponExists = await Coupon.findOne({ code });
  if (couponExists) {
    res.status(400);
    throw new Error('Coupon with this code already exists');
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    expiryDate,
    usageLimit,
    isActive,
    isNewUserOnly,
  });

  res.status(201).json(coupon);
});

// @desc    Update a coupon (Admin only)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit, isActive, isNewUserOnly } = req.body;

  if (code && code !== coupon.code) {
    const codeExists = await Coupon.findOne({ code });
    if (codeExists) {
      res.status(400);
      throw new Error('Another coupon with this code already exists');
    }
  }

  coupon.code = code || coupon.code;
  coupon.discountType = discountType || coupon.discountType;
  coupon.discountValue = discountValue !== undefined ? discountValue : coupon.discountValue;
  coupon.minOrderAmount = minOrderAmount !== undefined ? minOrderAmount : coupon.minOrderAmount;
  coupon.maxDiscountAmount = maxDiscountAmount !== undefined ? maxDiscountAmount : coupon.maxDiscountAmount;
  coupon.expiryDate = expiryDate || coupon.expiryDate;
  coupon.usageLimit = usageLimit !== undefined ? usageLimit : coupon.usageLimit;
  coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
  coupon.isNewUserOnly = isNewUserOnly !== undefined ? isNewUserOnly : coupon.isNewUserOnly;

  const updatedCoupon = await coupon.save();
  res.json(updatedCoupon);
});

// @desc    Delete a coupon (Admin only)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    await Coupon.deleteOne({ _id: coupon._id });
    res.json({ message: 'Coupon removed' });
  } else {
    res.status(404);
    throw new Error('Coupon not found');
  }
});

// @desc    Validate and apply a coupon code
// @route   POST /api/coupons/validate
// @access  Private (requires user to be logged in to check usage history)
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, totalPrice } = req.body;
  const userId = req.user._id;

  const coupon = await Coupon.findOne({ code, isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid or inactive coupon code.');
  }

  // Check expiry date
  if (coupon.expiryDate < new Date()) {
    res.status(400);
    throw new Error('Coupon has expired.');
  }

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Coupon usage limit reached.');
  }

  // Check if user has already used this coupon
  if (coupon.usedBy.includes(userId)) {
    res.status(400);
    throw new Error('You have already used this coupon.');
  }

  // Check if new user only coupon
  if (coupon.isNewUserOnly) {
    const userOrdersCount = await Order.countDocuments({ user: userId });
    if (userOrdersCount > 0) {
      res.status(400);
      throw new Error('This coupon is for new users only.');
    }
  }

  // Check minimum order amount
  if (totalPrice < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount.toFixed(2)}.`);
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (totalPrice * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount !== null && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else { // fixed amount
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't make total price negative
  if (discountAmount > totalPrice) {
    discountAmount = totalPrice;
  }

  res.json({
    message: 'Coupon applied successfully!',
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discountAmount,
      isNewUserOnly: coupon.isNewUserOnly,
    },
  });
});

export {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};