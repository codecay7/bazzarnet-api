import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// --- User Management ---

// @desc    Get all users (customers and vendors)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  let query = { role: { $ne: 'admin' } }; // Exclude admins from this list

  if (req.query.role && req.query.role !== 'all') {
    query.role = req.query.role;
  }
  if (req.query.status && req.query.status !== 'all') {
    query.isActive = req.query.status === 'active';
  }
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const count = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ users, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const { isActive } = req.body;

  if (user) {
    if (typeof isActive !== 'boolean') {
      res.status(400);
      throw new Error('isActive must be a boolean value.');
    }
    user.isActive = isActive;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      message: `User ${updatedUser.name} status updated to ${updatedUser.isActive ? 'active' : 'inactive'}.`
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === 'admin') {
      res.status(403);
      throw new Error('Cannot delete an admin user.');
    }

    if (user.role === 'vendor' && user.storeId) {
      await Product.deleteMany({ store: user.storeId });
      await Store.deleteOne({ _id: user.storeId });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User and associated data removed successfully' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- Product Management (Admin) ---

// @desc    Update any product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const adminUpdateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { name, description, price, originalPrice, stock, category, image, isActive } = req.body;
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
  product.stock = stock !== undefined ? stock : product.stock;
  product.category = category || product.category;
  product.image = image || product.image;
  product.isActive = isActive !== undefined ? isActive : product.isActive;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

// @desc    Delete any product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const adminDeleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed by admin' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// --- Store Management (Admin) ---

// @desc    Update any store (Admin)
// @route   PUT /api/admin/stores/:id
// @access  Private/Admin
const adminUpdateStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }
  
  const { name, description, category, address, phone, email, logo, isActive } = req.body;
  store.name = name || store.name;
  store.description = description || store.description;
  store.category = category || store.category;
  store.phone = phone || store.phone;
  store.email = email || store.email;
  store.logo = logo || store.logo;
  store.isActive = isActive !== undefined ? isActive : store.isActive;
  if (address) {
    store.address = { ...store.address, ...address };
  }

  const updatedStore = await store.save();
  res.json(updatedStore);
});

// @desc    Delete any store (Admin)
// @route   DELETE /api/admin/stores/:id
// @access  Private/Admin
const adminDeleteStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (store) {
    await Product.deleteMany({ store: store._id });
    await Store.deleteOne({ _id: store._id });
    // Note: This does not delete the owner user, only their store and products.
    res.json({ message: 'Store and its products removed by admin' });
  } else {
    res.status(404);
    throw new Error('Store not found');
  }
});

// --- Admin Order Management ---

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAdminOrders = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  let query = {};

  if (req.query.status && req.query.status !== 'all') {
    query.orderStatus = req.query.status;
  }
  if (req.query.search) {
    query.$or = [
      { _id: { $regex: req.query.search, $options: 'i' } },
      { customerName: { $regex: req.query.search, $options: 'i' } },
      { customerEmail: { $regex: req.query.search, $options: 'i' } },
      { 'items.name': { $regex: req.query.search, $options: 'i' } }, // Search within item names
    ];
  }

  const count = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email') // Populate customer info
    .populate('store', 'name') // Populate store info
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ orders, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Initiate a refund for an order (Admin)
// @route   POST /api/admin/orders/:id/refund
// @access  Private/Admin
const initiateRefund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // In a real application, this would involve:
  // 1. Interacting with a payment gateway to process the refund.
  // 2. Updating the order status to 'Refunded'.
  // 3. Creating a new Payment record with status 'Refunded' or updating an existing one.
  // 4. Notifying the customer and vendor.

  // For this demo, we'll just update the order status and send a success message.
  if (order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped') {
    // A refund might be possible even after delivery, depending on policy
    order.orderStatus = 'Refunded';
    await order.save();
    res.json({ message: `Refund initiated for order ${order._id}. Order status updated to Refunded.` });
  } else if (order.orderStatus === 'Cancelled') {
    res.status(400);
    throw new Error('Order is already cancelled, no refund needed.');
  } else {
    order.orderStatus = 'Cancelled'; // If not delivered/shipped, just cancel it
    await order.save();
    res.json({ message: `Order ${order._id} cancelled and refund initiated.` });
  }
});


// --- Admin Dashboard Stats ---

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const totalRevenueResult = await Order.aggregate([
    { $match: { orderStatus: 'Delivered' } }, // Only count delivered orders for revenue
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  const activeUsers = await User.countDocuments({ isActive: true, role: { $ne: 'admin' } });
  const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
  const inactiveUsers = totalUsers - activeUsers;

  const activeVendors = await User.countDocuments({ isActive: true, role: 'vendor' });
  const inactiveVendors = await User.countDocuments({ isActive: false, role: 'vendor' });
  const offlineVendors = await User.countDocuments({ role: 'vendor', isActive: false }); // Assuming 'offline' is a subset of inactive or a separate status

  const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
  const processingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
  const shippedOrders = await Order.countDocuments({ orderStatus: 'Shipped' });
  const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });
  const totalOrders = await Order.countDocuments();

  // Sales trend (e.g., last 7 days or monthly)
  const salesTrend = await Order.aggregate([
    { $match: { orderStatus: 'Delivered', createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } }, // Last 30 days
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: '$totalPrice' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // For simplicity, let's mock monthly/yearly sales trend data for now,
  // as aggregating complex time series data can be involved.
  const mockSalesTrend = [
    { name: 'Jan', sales: 200000 },
    { name: 'Feb', sales: 300000 },
    { name: 'Mar', sales: 500000 },
    { name: 'Apr', sales: 250000 },
    { name: 'May', sales: 400000 },
    { name: 'Jun', sales: 450000 },
    { name: 'Jul', sales: 520000 },
  ];


  res.json({
    totalRevenue,
    activeUsers,
    totalUsers,
    vendorStatus: [
      { name: 'Active', value: activeVendors, color: '#4CAF50' },
      { name: 'Inactive', value: inactiveVendors, color: '#FFC107' },
      { name: 'Offline', value: offlineVendors, color: '#F44336' }, // Adjust logic if 'offline' is distinct from 'inactive'
    ],
    userStatus: [
      { name: 'Active', value: activeUsers, color: '#2196F3' },
      { name: 'Inactive', value: inactiveUsers, color: '#607D8B' },
    ],
    orderCompletion: [
      { name: 'Pending', value: pendingOrders, color: '#FFC107' },
      { name: 'Processing', value: processingOrders, color: '#FFA500' },
      { name: 'Shipped', value: shippedOrders, color: '#2196F3' },
      { name: 'Delivered', value: deliveredOrders, color: '#4CAF50' },
      { name: 'Cancelled', value: cancelledOrders, color: '#F44336' },
    ],
    salesTrend: mockSalesTrend, // Using mock for now, replace with actual salesTrend if needed
  });
});


export {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUpdateStore,
  adminDeleteStore,
  getAdminOrders, // Export new function
  initiateRefund, // Export new function
  getAdminDashboardStats,
};