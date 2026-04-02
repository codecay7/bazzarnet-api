import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true, // One payment per order
  },
  vendor: { // The vendor who receives the payment
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'UPI', 'Cash on Delivery', 'UPI QR Payment', 'Razorpay'], // NEW: Added 'Razorpay'
    required: true,
  },
  transactionId: { // Unique ID from payment gateway or internal for COD (e.g., Razorpay Payment ID)
    type: String,
    required: true,
    unique: true,
  },
  razorpayOrderId: { // NEW: Store Razorpay Order ID
    type: String,
    sparse: true, // Only for Razorpay payments
  },
  razorpaySignature: { // NEW: Store Razorpay Signature for verification
    type: String,
    sparse: true, // Only for Razorpay payments
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
    default: 'Pending',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  // Reference to the customer who made the payment (via order)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;