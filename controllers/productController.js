import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js'; // Import Review model
import Order from '../models/Order.js'; // Import Order model to check purchases
import Store from '../models/Store.js'; // NEW: Import Store model
import mongoose from 'mongoose'; // Import mongoose

// @desc    Fetch all products (public)
// @route   GET /api/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  console.log('Backend: Received request for all products.');
  const pageSize = Number(req.query.limit) || 10; // Default limit 10
  const page = Number(req.query.page) || 1; // Default page 1

  const keyword = req.query.search
    ? {
        name: {
          $regex: req.query.search,
          $options: 'i',
        },
      }
    : {};

  const categoryFilter = req.query.category && req.query.category !== 'all'
    ? { category: req.query.category }
    : {};

  let storeFilter = {};
  if (req.query.store && req.query.store !== 'all') {
    console.log('Backend: getAllProducts - Value of req.query.store:', req.query.store);
    // Validate if req.query.store is a valid ObjectId before using it in the query
    if (!mongoose.Types.ObjectId.isValid(req.query.store)) {
      res.status(400);
      throw new Error('Invalid store ID format provided.'); // More specific error
    }
    storeFilter = { store: req.query.store };
  } else {
    console.log('Backend: getAllProducts - Not filtering by store. req.query.store is:', req.query.store);
  }

  // NEW: Pincode filtering logic
  let pincodeStoreIds = [];
  if (req.query.pincode) {
    const storesInPincode = await Store.find({ 'address.pinCode': req.query.pincode, isActive: true }).select('_id');
    pincodeStoreIds = storesInPincode.map(store => store._id);
    
    if (pincodeStoreIds.length === 0) {
      // If no stores found for the pincode, return empty products array
      return res.json({ products: [], page: 1, pages: 0, count: 0 });
    }
  }

  const finalQuery = { ...keyword, ...categoryFilter, ...storeFilter };

  // Apply pincode filter if present
  if (req.query.pincode) {
    finalQuery.store = { $in: pincodeStoreIds };
  }

  console.log('Backend: getAllProducts - Final Query:', finalQuery);

  const count = await Product.countDocuments(finalQuery);
  const products = await Product.find(finalQuery)
    .populate('store', 'name') // Populate store name
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch a single product by ID (public)
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('store', 'name logo');
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get recommended products (public)
// @route   GET /api/products/recommended
// @access  Public
const getRecommendedProducts = asyncHandler(async (req, res) => {
  // NEW: Pincode filtering for recommended products
  let query = {};
  if (req.query.pincode) {
    const storesInPincode = await Store.find({ 'address.pinCode': req.query.pincode, isActive: true }).select('_id');
    const pincodeStoreIds = storesInPincode.map(store => store._id);
    if (pincodeStoreIds.length === 0) {
      return res.json([]); // No recommended products if no stores in pincode
    }
    query.store = { $in: pincodeStoreIds };
  }

  // For demo purposes, return a random selection of products
  // In a real app, this would involve recommendation logic
  const products = await Product.aggregate([
    { $match: query }, // Apply pincode filter here
    { $sample: { size: 6 } }, // Get 6 random products
    { $project: { name: 1, image: 1, price: 1, originalPrice: 1, store: 1, unit: 1, category: 1, rating: 1, numReviews: 1, stock: 1 } } // Select relevant fields including unit, review data, and STOCK
  ]);
  res.json(products);
});

// @desc    Create a new product (vendor)
// @route   POST /api/products
// @access  Private/Vendor
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, stock, category, image, unit } = req.body; // Include unit

  if (!req.user.storeId) {
    res.status(403);
    throw new Error('User is not a vendor or does not have an associated store.');
  }

  // NEW: Check if vendor profile is complete
  const vendorUser = await req.user.populate('storeId'); // Populate store details directly on user
  if (!vendorUser.description || !vendorUser.category || !vendorUser.phone || 
      !vendorUser.address?.houseNo || !vendorUser.address?.city || 
      !vendorUser.address?.state || !vendorUser.address?.pinCode || !vendorUser.address?.mobile) {
    res.status(400);
    throw new Error('Please complete your vendor profile (business description, category, contact phone, and full address including mobile) before adding products.');
  }

  const product = new Product({
    name,
    description,
    price,
    originalPrice,
    stock,
    category,
    image,
    unit, // Assign unit
    store: req.user.storeId, // Link product to the logged-in vendor's store
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product (vendor)
// @route   PUT /api/products/:id
// @access  Private/Vendor
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Authorization check: Ensure the vendor owns this product
  if (product.store.toString() !== req.user.storeId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this product.');
  }

  const { name, description, price, originalPrice, stock, category, image, isActive, unit } = req.body; // Include unit

  console.log('--- Product Update Request ---');
  console.log('Product ID:', req.params.id);
  console.log('Image received in req.body:', image);
  console.log('Current product image in DB (before update):', product.image);

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
  product.stock = stock !== undefined ? stock : product.stock;
  product.category = category || product.category;
  product.image = image || product.image;
  product.isActive = isActive !== undefined ? isActive : product.isActive;
  product.unit = unit || product.unit; // Update unit

  const updatedProduct = await product.save();
  console.log('Updated product image in DB (after save):', updatedProduct.image);
  console.log('--- End Product Update Request ---');

  res.json(updatedProduct);
});

// @desc    Delete a product (vendor)
// @route   DELETE /api/products/:id
// @access  Private/Vendor
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Authorization check
  if (product.store.toString() !== req.user.storeId.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this product.');
  }

  await Product.deleteOne({ _id: product._id });
  res.json({ message: 'Product removed' });
});

// @desc    Create new review for a product
// @route   POST /api/products/:id/reviews
// @access  Private/Customer
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { id: productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // 1. Check if user has purchased this product (from a delivered order)
  const hasPurchased = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'Delivered',
  });

  if (!hasPurchased) {
    res.status(403);
    throw new Error('You can only review products you have purchased and received.');
  }

  // 2. Check if user has already reviewed this product
  const alreadyReviewed = await Review.exists({
    user: req.user._id,
    product: productId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product.');
  }

  // 3. Create the new review
  const review = new Review({
    user: req.user._id,
    product: productId,
    rating,
    comment,
  });

  await review.save();

  // 4. Recalculate product's average rating and number of reviews
  const reviews = await Review.find({ product: productId });
  const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
  product.rating = totalRating / reviews.length;
  product.numReviews = reviews.length;

  await product.save();

  res.status(201).json({ message: 'Review added successfully', review });
});

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .populate('user', 'name profileImage') // Populate user's name and profile image
    .sort({ createdAt: -1 }); // Latest reviews first

  res.json(reviews);
});


export {
  getAllProducts,
  getProductById,
  getRecommendedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview, // Export new function
  getProductReviews, // Export new function
};