import asyncHandler from '../middleware/asyncHandler.js';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items.product', 'name price image stock unit');

  if (wishlist) {
    res.json(wishlist.items);
  } else {
    res.json([]); // Return empty array if no wishlist exists
  }
});

// @desc    Add item to wishlist
// @route   POST /api/wishlist
// @access  Private
const addItemToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  console.log('Backend: addItemToWishlist - Received productId:', productId); // NEW LOG

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    // Create a new wishlist if one doesn't exist for the user
    wishlist = new Wishlist({ user: req.user._id, items: [] });
  }

  const existingItem = wishlist.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    res.status(400);
    throw new Error('Product already in wishlist');
  } else {
    wishlist.items.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
    });
  }

  await wishlist.save();
  const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.product', 'name price image stock unit');
  res.status(201).json(updatedWishlist.items);
});

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:id
// @access  Private
const removeItemFromWishlist = asyncHandler(async (req, res) => {
  const { id: productId } = req.params; // Product ID to remove
  console.log('Backend: removeItemFromWishlist - Received productId:', productId);

  // Validate productId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Invalid product ID format.');
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  console.log('Backend: removeItemFromWishlist - Current wishlist items before filter:', wishlist.items.map(item => item.product.toString()));

  const initialLength = wishlist.items.length;
  wishlist.items = wishlist.items.filter(
    (item) => {
      const itemProductId = item.product.toString();
      console.log(`  Comparing item.product (${itemProductId}) with received productId (${productId})`);
      return itemProductId !== productId;
    }
  );

  if (wishlist.items.length === initialLength) {
    res.status(404);
    throw new Error('Product not found in wishlist');
  }

  await wishlist.save();
  const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.product', 'name price image stock unit');
  res.json(updatedWishlist.items);
});

export { getWishlist, addItemToWishlist, removeItemFromWishlist };