import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true, // Added index
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscountAmount: { // For percentage discounts, limit the max amount
    type: Number,
    default: null, // null means no max limit
    min: 0,
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true, // Added index
  },
  usageLimit: { // Total number of times this coupon can be used
    type: Number,
    default: null, // null means unlimited
    min: 1,
  },
  usedCount: { // How many times it has been used
    type: Number,
    default: 0,
    min: 0,
  },
  usedBy: [ // Array of user IDs who have used this coupon
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true, // Added index for users who used the coupon
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
    index: true, // Added index
  },
}, {
  timestamps: true,
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;