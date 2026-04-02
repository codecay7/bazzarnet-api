import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js'; // Import Product model
import Store from '../models/Store.js'; // Import Store model
import Coupon from '../models/Coupon.js'; // New: Import Coupon model
import Payment from '../models/Payment.js'; // NEW: Import Payment model
import { generateOtp } from '../utils/helpers.js'; // Assuming a helper for OTP generation
import { sendEmail } from '../services/emailService.js';
import env from '../config/env.js'; // Import env to use FRONTEND_URL
import mongoose from 'mongoose'; // Import mongoose for transactions
import Razorpay from 'razorpay'; // NEW: Import Razorpay for verification
import crypto from 'crypto'; // NEW: Import crypto for signature verification

// Initialize Razorpay instance for server-side verification
const razorpayInstance = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// @desc    Place a new order (Customer)
// @route   POST /api/orders
// @access  Private/Customer
const placeOrder = asyncHandler(async (req, res) => {
  console.log('Backend: placeOrder controller reached.'); // NEW LOG
  const { items, shippingAddress, paymentMethod, totalPrice, appliedCoupon, transactionId, razorpayOrderId, razorpaySignature } = req.body; // New: Get appliedCoupon, transactionId, and Razorpay details
  console.log('Backend: Received items in req.body:', items); // ADDED LOG

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items in order.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let createdOrder; // Declare createdOrder outside try block to be accessible later

  try {
    // --- Razorpay Server-Side Verification (if paymentMethod is Razorpay) ---
    if (paymentMethod === 'Razorpay') {
      if (!razorpayOrderId || !transactionId || !razorpaySignature) {
        res.status(400);
        throw new Error('Razorpay payment details are missing for verification.');
      }

      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(razorpayOrderId + '|' + transactionId)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        res.status(400);
        throw new Error('Razorpay payment verification failed: Invalid signature.');
      }

      // Optionally, fetch payment details from Razorpay to confirm status
      // const paymentDetails = await razorpayInstance.payments.fetch(transactionId);
      // if (paymentDetails.status !== 'captured') {
      //   res.status(400);
      //   throw new Error('Razorpay payment not captured.');
      // }
      console.log('Backend: Razorpay payment verified successfully on server-side.');
    }
    // --- End Razorpay Server-Side Verification ---

    // Extract product IDs from the incoming items
    const productIds = items.map(item => item.product);

    // Fetch all products in one go to avoid N+1 queries
    // Use session for consistency
    const productsInOrder = await Product.find({ _id: { $in: productIds } }).session(session);

    // Create a map for quick lookup
    const productMap = new Map(productsInOrder.map(p => [p._id.toString(), p]));

    // Validate and get store ID from the first item
    const firstItemProduct = productMap.get(items[0].product);
    if (!firstItemProduct) {
      res.status(400);
      throw new Error('Product not found for the first item.');
    }
    const storeId = firstItemProduct.store;
    const store = await Store.findById(storeId).session(session);

    if (!store) {
      res.status(400);
      throw new Error('Store not found for the order.');
    }

    // NEW VALIDATION: Ensure customer's shipping pincode matches the store's pincode
    if (shippingAddress.pinCode !== store.address.pinCode) {
      res.status(400);
      throw new Error(`Cannot place order. Store is not available in your selected pincode (${shippingAddress.pinCode}). This store serves pincode ${store.address.pinCode}.`);
    }

    // --- Stock Validation and Decrement ---
    const productsToUpdate = [];
    for (const item of items) {
      const product = productMap.get(item.product); // Get product from map
      if (!product) {
        res.status(404);
        throw new Error(`Product with ID ${item.product} not found.`);
      }
      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(`Not enough stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`);
      }
      productsToUpdate.push({ product, quantity: item.quantity });
    }

    // Decrement stock for all products
    for (const { product, quantity } of productsToUpdate) {
      product.stock -= quantity;
      await product.save({ session }); // Save with session
    }
    // --- End Stock Validation and Decrement ---

    const orderItems = items.map(item => ({
      product: item.product,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit, // Include unit in order item
    }));

    const order = new Order({
      user: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      store: storeId,
      storeName: store.name,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      deliveryOtp: generateOtp(), // Generate OTP for delivery confirmation
      transactionId: transactionId || (paymentMethod === 'Cash on Delivery' ? `COD-${Date.now()}` : undefined), // Assign transactionId for UPI QR Payment/Razorpay or generate for COD
      razorpayOrderId: paymentMethod === 'Razorpay' ? razorpayOrderId : undefined, // NEW: Assign Razorpay Order ID
      razorpaySignature: paymentMethod === 'Razorpay' ? razorpaySignature : undefined, // NEW: Assign Razorpay Signature
      // New: Store coupon details if applied
      coupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discountAmount: appliedCoupon.discountAmount,
        discountType: appliedCoupon.discountType, // NEW: Added discountType
        discountValue: appliedCoupon.discountValue, // NEW: Added discountValue
      } : undefined,
    });

    createdOrder = await order.save({ session }); // Save with session

    // NEW: Create a Payment record
    const paymentStatus = (paymentMethod === 'Credit Card' || paymentMethod === 'UPI QR Payment' || paymentMethod === 'Razorpay') ? 'Paid' : 'Pending';
    const payment = new Payment({
      order: createdOrder._id,
      vendor: store.owner, // Link to the store owner (vendor)
      amount: totalPrice,
      paymentMethod: paymentMethod,
      transactionId: transactionId || `COD-${createdOrder._id}`, // Use transactionId or generate one for COD
      razorpayOrderId: paymentMethod === 'Razorpay' ? razorpayOrderId : undefined, // NEW: Assign Razorpay Order ID
      razorpaySignature: paymentMethod === 'Razorpay' ? razorpaySignature : undefined, // NEW: Assign Razorpay Signature
      status: paymentStatus,
      customer: req.user._id,
    });
    await payment.save({ session }); // Save payment within the transaction

    // New: Mark coupon as used if one was applied
    if (appliedCoupon) {
      const coupon = await Coupon.findById(appliedCoupon._id).session(session);
      if (coupon) {
        coupon.usedCount += 1;
        coupon.usedBy.push(req.user._id);
        await coupon.save({ session }); // Save with session
      }
    }

    await session.commitTransaction(); // Commit all changes if successful
    session.endSession();

    // Respond to the client immediately after successful transaction commit
    res.status(201).json(createdOrder);

  } catch (error) {
    await session.abortTransaction(); // Rollback any changes if an error occurred
    session.endSession();
    console.error('Transaction aborted:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Order placement failed due to a transaction error.');
  }

  // Send order confirmation email to customer (outside transaction)
  if (createdOrder) { // Only attempt to send email if order was successfully created
    const orderItemsHtml = createdOrder.items.map(item => `
      <li>${item.name} (Qty: ${item.quantity} ${item.unit}) - ₹${item.price.toFixed(2)}</li>
    `).join('');

    const orderConfirmationEmailHtml = `
      <p>Hello ${createdOrder.customerName},</p>
      <p>Thank you for your order from BazzarNet!</p>
      <p>Your order #${createdOrder._id} has been placed successfully and is being processed.</p>
      
      <h3>Order Summary:</h3>
      <ul>
        ${orderItemsHtml}
      </ul>
      <p><strong>Total Price:</strong> ₹${createdOrder.totalPrice.toFixed(2)}</p>
      ${createdOrder.coupon ? `<p><strong>Coupon Applied:</strong> ${createdOrder.coupon.code} (Discount: ₹${createdOrder.coupon.discountAmount.toFixed(2)})</p>` : ''}
      <p><strong>Payment Method:</strong> ${createdOrder.paymentMethod}</p>
      ${createdOrder.transactionId ? `<p><strong>Transaction ID:</strong> ${createdOrder.transactionId}</p>` : ''}
      <p><strong>Shipping Address:</strong></p>
      <p>
        ${createdOrder.shippingAddress.houseNo}, ${createdOrder.shippingAddress.landmark ? createdOrder.shippingAddress.landmark + ', ' : ''}
        ${createdOrder.shippingAddress.city}, ${createdOrder.shippingAddress.state} - ${createdOrder.shippingAddress.pinCode}
      </p>
      <p>Your delivery OTP is: <strong>${createdOrder.deliveryOtp}</strong>. Please provide this to the delivery person.</p>
      <p>You can track your order status here: <a href="${env.FRONTEND_URL}/my-orders/${createdOrder._id}">${env.FRONTEND_URL}/my-orders/${createdOrder._id}</a></p>
      <p>The BazzarNet Team</p>
    `;
    try {
      await sendEmail(createdOrder.customerEmail, `BazzarNet Order Confirmation #${createdOrder._id}`, 'Your order has been placed!', orderConfirmationEmailHtml);
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Log the email error but don't prevent the order from being placed successfully
    }
  }
});

// @desc    Get orders for a specific customer
// @route   GET /api/orders/user/:userId
// @access  Private/Customer
const getCustomerOrders = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  // Ensure the logged-in user is the customer they are requesting orders for
  if (req.user._id.toString() !== userId) {
    res.status(403);
    throw new Error('Not authorized to view these orders.');
  }

  let query = { user: userId };

  if (req.query.status && req.query.status !== 'all') {
    query.orderStatus = req.query.status;
  }
  if (req.query.search) {
    query.$or = [
      { _id: { $regex: req.query.search, $options: 'i' } },
      { 'items.name': { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const count = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('store', 'name')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ orders, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Get a single order by ID (Customer/Vendor/Admin)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  console.log(`Backend: getOrderById called for order ID: ${req.params.id}`);
  console.log(`Backend: Logged-in user (req.user): ID=${req.user._id}, Role=${req.user.role}, StoreID=${req.user.storeId}`);

  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('store', 'name');

  if (!order) {
    console.log(`Backend: Order ${req.params.id} not found.`);
    res.status(404);
    throw new Error('Order not found');
  }

  console.log(`Backend: Found order. Order user ID: ${order.user._id}, Order store ID: ${order.store._id}`);

  // Authorization: Only the customer who placed the order, the vendor of the store, or an admin can view
  if (
    req.user._id.toString() === order.user._id.toString() || // Customer
    (req.user.role === 'vendor' && req.user.storeId && order.store && req.user.storeId.toString() === order.store._id.toString()) || // Vendor
    req.user.role === 'admin' // Admin
  ) {
    console.log(`Backend: Authorization successful for user ${req.user._id} to view order ${req.params.id}.`);
    res.json(order);
  } else {
    console.log(`Backend: Authorization failed for user ${req.user._id} (role: ${req.user.role}) to view order ${req.params.id}.`);
    res.status(403);
    throw new Error('Not authorized to view this order.');
  }
});

// @desc    Get orders for a specific vendor's store
// @route   GET /api/orders/store/:storeId
// @access  Private/Vendor
const getVendorOrders = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;

  // Ensure the logged-in user is the owner of this store
  if (req.user.storeId.toString() !== storeId) {
    res.status(403);
    throw new Error('Not authorized to view orders for this store.');
  }

  let query = { store: storeId };

  if (req.query.status && req.query.status !== 'all') {
    query.orderStatus = req.query.status;
  }
  if (req.query.search) {
    query.$or = [
      { _id: { $regex: req.query.search, $options: 'i' } },
      { customerName: { $regex: req.query.search, $options: 'i' } },
      { customerEmail: { $regex: req.query.search, $options: 'i' } },
      { 'items.name': { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const count = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email') // Populate customer info
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ orders, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Update order status (Vendor/Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor, Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const { status } = req.body;

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Authorization: Only vendor owning the store or admin can update status
  if (req.user.role === 'vendor' && order.store.toString() !== req.user.storeId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this order status.');
  }
  if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update order status.');
  }

  order.orderStatus = status;
  if (status === 'Delivered' && !order.deliveredAt) {
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Confirm delivery with OTP (Vendor)
// @route   POST /api/orders/:id/confirm-delivery
// @access  Private/Vendor
const confirmDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const { otp } = req.body;

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Authorization: Only vendor owning the store can confirm delivery
  if (req.user.storeId.toString() !== order.store.toString()) {
    res.status(403);
    throw new Error('Not authorized to confirm delivery for this order.');
  }

  if (order.deliveryOtp !== otp) {
    res.status(400);
    throw new Error('Invalid OTP for delivery confirmation.');
  }

  order.orderStatus = 'Delivered';
  order.deliveredAt = Date.now();
  order.deliveryOtp = undefined; // Clear OTP after successful delivery

  const updatedOrder = await order.save();
  res.json({ message: 'Order delivered successfully!', order: updatedOrder });
});

export {
  placeOrder,
  getCustomerOrders,
  getOrderById, // Export new function
  getVendorOrders,
  updateOrderStatus,
  confirmDelivery,
};