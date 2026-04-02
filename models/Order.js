import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: { type: String, required: true }, // New field for unit
});

const orderSchema = new mongoose.Schema({
  user: { // Customer who placed the order
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Added index
  },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  store: { // Store from which the order was placed (if single store order)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true, // Assuming orders are placed from a single store for simplicity
    index: true, // Added index
  },
  storeName: { type: String, required: true },
  items: [orderItemSchema], // Array of products in the order
  shippingAddress: {
    houseNo: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true }, // NEW: Added mobile field
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'UPI', 'Cash on Delivery', 'UPI QR Payment', 'Razorpay'], // NEW: Added 'Razorpay'
    required: true,
  },
  transactionId: { // For payment gateway reference (e.g., Razorpay Payment ID)
    type: String,
    sparse: true, // Not required for COD, but now required for UPI QR Payment and Razorpay
  },
  razorpayOrderId: { // NEW: Store Razorpay Order ID
    type: String,
    sparse: true,
  },
  razorpaySignature: { // NEW: Store Razorpay Signature for verification
    type: String,
    sparse: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'], // Added Refunded
    default: 'Pending',
    index: true, // Added index
  },
  deliveryOtp: { // OTP for delivery confirmation
    type: String,
    minlength: 6,
    maxlength: 6,
    sparse: true, // Only generated when order is ready for delivery
  },
  deliveredAt: {
    type: Date,
  },
  coupon: { // New: Store applied coupon details
    code: { type: String, trim: true },
    discountAmount: { type: Number, min: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed'] }, // Added discountType
    discountValue: { type: Number, min: 0 }, // Added discountValue
  },
}, {
  timestamps: true,
  indexes: [{ createdAt: -1 }], // Added index for sorting by creation date
});

const Order = mongoose.model('Order', orderSchema);

export default Order;