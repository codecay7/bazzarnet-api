import User from '../models/User.js';
import Store from '../models/Store.js';
import { generateToken } from '../utils/jwt.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendEmail } from '../services/emailService.js';
import env from '../config/env.js'; // Import env to use FRONTEND_URL

// @desc    Register a new customer user
// @route   POST /api/auth/register/customer
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    role: 'customer',
  });

  if (user) {
    // Send welcome email
    const welcomeEmailHtml = `
      <p>Hello ${user.name},</p>
      <p>Welcome to BazzarNet! We're excited to have you on board.</p>
      <p>You can now start exploring local stores and products.</p>
      <p>Visit your dashboard: <a href="${env.FRONTEND_URL}/dashboard">${env.FRONTEND_URL}/dashboard</a></p>
      <p>Happy shopping!</p>
      <p>The BazzarNet Team</p>
    `;
    await sendEmail(user.email, 'Welcome to BazzarNet!', 'Thank you for registering!', welcomeEmailHtml);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Register a new vendor user and their store
// @route   POST /api/auth/register/vendor
// @access  Public
const registerVendor = asyncHandler(async (req, res) => {
  console.log('Backend: registerVendor controller - req.body:', req.body); // NEW LOG
  const { fullName, email, password, businessName, businessDescription, category, phone, pan, gst, address } = req.body; // Changed to fullName and businessName

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const storeExists = await Store.findOne({ name: businessName }); // Check for businessName
  if (storeExists) {
    res.status(400);
    throw new Error('Store with this name already exists');
  }

  // Create the vendor user first
  const vendorUser = await User.create({
    name: fullName, // Use fullName for user's name
    email,
    password,
    phone,
    pan: pan || undefined, // Now optional
    gst: gst || undefined, // Now optional
    address: address || undefined, // Now optional
    description: businessDescription || undefined, // Now optional
    category: category || 'Other', // Now optional with default
    role: 'vendor',
  });

  if (vendorUser) {
    // Create the store and link it to the vendor user
    const store = await Store.create({
      name: businessName, // Use businessName for store's name
      description: businessDescription || 'A new store on BazzarNet.', // Now optional
      owner: vendorUser._id,
      category: category || 'Other', // Now optional with default
      address: address || { houseNo: '', landmark: '', city: '', state: '', pinCode: '', mobile: '' }, // Now optional
      phone: phone,
      email: email,
    });

    // Update the vendor user with store details
    vendorUser.storeId = store._id;
    vendorUser.store = store.name; // Use store.name (which is businessName)
    await vendorUser.save();

    // Send welcome email to vendor
    const vendorWelcomeEmailHtml = `
      <p>Hello ${vendorUser.name},</p>
      <p>Welcome to BazzarNet as a Vendor! Your store "${store.name}" is now live.</p>
      <p>You can now start managing your products and orders from your vendor dashboard.</p>
      <p>Visit your vendor dashboard: <a href="${env.FRONTEND_URL}/dashboard">${env.FRONTEND_URL}/dashboard</a></p>
      <p>The BazzarNet Team</p>
    `;
    await sendEmail(vendorUser.email, 'Welcome to BazzarNet Vendor!', 'Your store is now live!', vendorWelcomeEmailHtml);

    res.status(201).json({
      _id: vendorUser._id,
      name: vendorUser.name,
      email: vendorUser.email,
      role: vendorUser.role,
      storeId: store._id,
      storeName: store.name,
      token: generateToken(vendorUser._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid vendor registration data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (!user.isActive) {
      res.status(401);
      throw new Error('Account is inactive. Please contact support.');
    }

    let responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    };

    // If vendor, include store details
    if (user.role === 'vendor' && user.storeId) {
      const store = await Store.findById(user.storeId);
      responseData.storeId = store?._id;
      responseData.storeName = store?.name;
    }

    res.json(responseData);
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear token (client-side)
// @route   POST /api/auth/logout
// @access  Public (or Private if token invalidation is needed)
const logout = asyncHandler(async (req, res) => {
  // For JWTs stored client-side (e.g., localStorage), logout is primarily client-driven.
  // If using HTTP-only cookies, you would clear the cookie here.
  // For this setup, we simply confirm logout.
  res.status(200).json({ message: 'Logged out successfully' });
});

export { registerUser, registerVendor, login, logout };