import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Get vendor dashboard statistics
// @route   GET /api/vendors/:vendorId/dashboard/stats
// @access  Private/Vendor
const getVendorDashboardStats = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;

  // Ensure the logged-in user is the vendor they are requesting stats for
  if (req.user._id.toString() !== vendorId) {
    res.status(403);
    throw new Error('Not authorized to view these dashboard statistics.');
  }

  const storeId = req.user.storeId;

  // Total Revenue
  const totalRevenueResult = await Order.aggregate([
    { $match: { store: storeId, orderStatus: 'Delivered' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  // Total Orders
  const totalOrders = await Order.countDocuments({ store: storeId });

  // Unique Customers
  const uniqueCustomersResult = await Order.aggregate([
    { $match: { store: storeId } },
    { $group: { _id: '$user' } },
    { $count: 'count' },
  ]);
  const uniqueCustomers = uniqueCustomersResult.length > 0 ? uniqueCustomersResult[0].count : 0;

  // Total Products
  const totalProducts = await Product.countDocuments({ store: storeId });

  // Sales Trend (e.g., last 7 days or monthly)
  const salesTrend = await Order.aggregate([
    { $match: { store: storeId, orderStatus: 'Delivered', createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } }, // Last 30 days
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales: { $sum: '$totalPrice' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fast Selling Items (Top 5 products by quantity sold)
  const fastSellingItems = await Order.aggregate([
    { $match: { store: storeId, orderStatus: 'Delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantitySold: { $sum: '$items.quantity' },
        productName: { $first: '$items.name' },
        productImage: { $first: '$items.image' },
        productPrice: { $first: '$items.price' },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 1,
        name: '$productName',
        image: '$productImage',
        price: '$productPrice',
        sales: '$totalQuantitySold',
      },
    },
  ]);

  res.json({
    totalRevenue,
    totalOrders,
    uniqueCustomers,
    totalProducts,
    salesTrend,
    fastSellingItems,
  });
});

export { getVendorDashboardStats };