import asyncHandler from '../middleware/asyncHandler.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price image stock unit'); // NEW: Populate unit

  if (cart) {
    res.json(cart); // Return the full cart object, including items array
  } else {
    // If no cart exists, return an empty cart structure
    res.json({ user: req.user._id, items: [] });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, unit } = req.body; // NEW: Destructure unit

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.stock < quantity) {
    res.status(400);
    throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    // Create a new cart if one doesn't exist for the user
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    // If item exists, update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock < newQuantity) {
      res.status(400);
      throw new Error(`Adding ${quantity} more of ${product.name} would exceed available stock. Available: ${product.stock}, Current in cart: ${existingItem.quantity}`);
    }
    existingItem.quantity = newQuantity;
  } else {
    // Add new item to cart
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
      unit, // NEW: Add unit to cart item
    });
  }

  await cart.save();
  const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price image stock unit'); // NEW: Populate unit
  res.status(201).json(updatedCart);
});

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1. Use DELETE to remove item.');
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    if (product.stock < quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
    }
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price image stock unit'); // NEW: Populate unit
    res.json(updatedCart);
  } else {
    res.status(404);
    throw new Error('Item not found in cart');
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  console.log('Backend: removeItemFromCart - Received productId:', productId); // NEW LOG

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  if (cart.items.length === initialLength) {
    res.status(404);
    throw new Error('Product not found in cart');
  }

  await cart.save();
  const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price image stock unit'); // NEW: Populate unit
  res.json(updatedCart);
});

export { getCart, addItemToCart, updateCartItemQuantity, removeItemFromCart };