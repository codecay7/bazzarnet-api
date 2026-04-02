import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true, // Added index
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer',
    index: true, // Added index
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true, // Added index
  },
  // Customer-specific fields
  address: {
    houseNo: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pinCode: { type: String, trim: true, index: true }, // Added index
    mobile: { type: String, trim: true }, // NEW: Added mobile field
  },
  phone: {
    type: String,
    trim: true,
  },
  upiId: {
    type: String,
    trim: true,
  },
  cardDetails: { // Mock card details for customer
    cardNumber: { type: String, trim: true },
    expiry: { type: String, trim: true },
    cardHolder: { type: String, trim: true }
  },
  // Vendor-specific fields
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    sparse: true, // Allows multiple null values, useful if not all users are vendors
    index: true, // Added index
  },
  store: { // Store name for quick reference
    type: String,
    trim: true,
    sparse: true,
  },
  pan: { type: String, trim: true, uppercase: true, sparse: true },
  gst: { type: String, trim: true, uppercase: true, sparse: true },
  description: { type: String, trim: true, sparse: true },
  category: { type: String, trim: true, sparse: true },
  bankAccount: { type: String, trim: true, sparse: true },
  bankName: { type: String, trim: true, sparse: true },
  ifsc: { type: String, trim: true, uppercase: true, sparse: true },
  profileImage: { type: String, trim: true }, // URL to profile/store image
  // Password Reset Fields
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  return isMatch;
};

const User = mongoose.model('User', userSchema);

export default User;