import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true, // Added index
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: { // For discounts
    type: Number,
    min: 0,
    default: null,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  unit: { // New field for unit of measurement
    type: String,
    enum: ['pc', 'kg', 'g', 'L', 'ml', 'dozen', 'pack', 'set', 'pair', 'unit'], // Common units
    required: true,
    default: 'pc', // Default to 'piece'
  },
  category: {
    type: String,
    enum: ['Groceries', 'Bakery', 'Butcher', 'Cafe', 'Electronics', 'Furniture', 'Decor', 'Clothing', 'Other'],
    required: true,
    index: true, // Added index
  },
  image: { // URL to product image
    type: String,
    trim: true,
    default: 'https://via.placeholder.com/200?text=Product+Image',
  },
  store: { // Reference to the store that sells this product
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true, // Added index
  },
  rating: { // Average rating
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  numReviews: { // Number of reviews
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true, // Added index
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;