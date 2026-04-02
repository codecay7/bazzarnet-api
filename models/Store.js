import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true, // Added index
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Each store has one unique owner
    index: true, // Added index
  },
  category: {
    type: String,
    enum: ['Groceries', 'Bakery', 'Butcher', 'Cafe', 'Electronics', 'Furniture', 'Decor', 'Clothing', 'Other'],
    required: true,
    index: true, // Added index
  },
  address: {
    houseNo: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pinCode: { type: String, trim: true, index: true }, // Added index
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  logo: { // URL to store logo
    type: String,
    trim: true,
    default: 'https://via.placeholder.com/150?text=Store+Logo',
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true, // Added index
  },
}, {
  timestamps: true,
});

const Store = mongoose.model('Store', storeSchema);

export default Store;