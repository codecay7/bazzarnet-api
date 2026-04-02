import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Store from './models/Store.js';
import Product from './models/Product.js';
import connectDB from './config/db.js';
import env from './config/env.js'; // Import env for MONGO_URI

// Load environment variables only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

// Connect to DB
// This connectDB call is for when seeder.js is run directly.
// When imported, server.js will handle the DB connection.
// To avoid multiple connections, we can make connectDB idempotent or only call it if not already connected.
// For now, I'll keep it as is, assuming it's fine for a simple seeder.

const sampleCustomers = [
  {
    name: 'Alice Customer',
    email: 'alice@example.com',
    password: 'password123',
    role: 'customer',
    phone: '9876543210',
    address: {
      houseNo: '101, Green Street',
      landmark: 'Near Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      mobile: '9876543210', // NEW: Added mobile
    },
  },
  {
    name: 'Bob Customer',
    email: 'bob@example.com',
    password: 'password123',
    role: 'customer',
    phone: '9123456789',
    address: {
      houseNo: '202, Blue Avenue',
      landmark: 'Opposite Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      mobile: '9123456789', // NEW: Added mobile
    },
  },
  {
    name: 'Charlie Customer',
    email: 'charlie@example.com',
    password: 'password123',
    role: 'customer',
    phone: '9988776655',
    address: {
      houseNo: '303, Red Road',
      landmark: 'Near Temple',
      city: 'Delhi',
      state: 'Delhi',
      pinCode: '110001',
      mobile: '9988776655', // NEW: Added mobile
    },
  },
  {
    name: 'Diana Customer',
    email: 'diana@example.com',
    password: 'password123',
    role: 'customer',
    phone: '9001122334',
    address: {
      houseNo: '404, Yellow Lane',
      landmark: 'Beside School',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pinCode: '600001',
      mobile: '9001122334', // NEW: Added mobile
    },
  },
  {
    name: 'Eve Customer',
    email: 'eve@example.com',
    password: 'password123',
    role: 'customer',
    phone: '9554433221',
    address: {
      houseNo: '505, Purple Path',
      landmark: 'Near Lake',
      city: 'Kolkata',
      state: 'West Bengal',
      pinCode: '700001',
      mobile: '9554433221', // NEW: Added mobile
    },
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    phone: '9998887770',
    address: {
      houseNo: '999, Admin Tower',
      landmark: 'Central Office',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      mobile: '9998887770', // NEW: Added mobile
    },
  },
];

const sampleVendors = [
  {
    name: 'Vendor A (Groceries)',
    email: 'vendorA@example.com',
    password: 'password123',
    role: 'vendor',
    storeName: 'FreshMart Groceries',
    businessDescription: 'Your daily dose of fresh fruits, vegetables, and pantry staples.',
    category: 'Groceries',
    phone: '8001112223',
    pan: 'ABCDE1234F',
    gst: '27ABCDE1234F1Z5',
    address: {
      houseNo: '1, Market Road',
      landmark: 'Opposite Bus Stand',
      city: 'Bengaluru', // Changed state to match pincode region
      state: 'Jharkhand', // Changed state to match pincode region
      pinCode: '825301', // Updated pincode
      mobile: '8001112223', // NEW: Added mobile
    },
    profileImage: 'https://images.unsplash.com/photo-1542838132-925602678290?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    name: 'Vendor B (Bakery)',
    email: 'vendorB@example.com',
    password: 'password123',
    role: 'vendor',
    storeName: 'Sweet Delights Bakery',
    businessDescription: 'Artisan breads, delicious pastries, and custom cakes for every occasion.',
    category: 'Bakery',
    phone: '8002223334',
    pan: 'FGHIJ5678K',
    gst: '27FGHIJ5678K1Z6',
    address: {
      houseNo: '15, Bakery Lane',
      landmark: 'Next to Cafe',
      city: 'Ramgarh', // Changed city to match pincode region
      state: 'Jharkhand', // Changed state to match pincode region
      pinCode: '825301', // Updated pincode
      mobile: '8002223334', // NEW: Added mobile
    },
    profileImage: 'https://images.unsplash.com/photo-1587334175721-ad1e1071317e?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    name: 'Vendor C (Electronics)',
    email: 'vendorC@example.com',
    password: 'password123',
    role: 'vendor',
    storeName: 'TechGadget Hub',
    businessDescription: 'Latest electronics, gadgets, and accessories with expert advice.',
    category: 'Electronics',
    phone: '8003334445',
    pan: 'LMNOP9012Q',
    gst: '27LMNOP9012Q1Z7',
    address: {
      houseNo: '20, Tech Park',
      landmark: 'Near IT Tower',
      city: 'Hazaribagh', // Changed city to match pincode region
      state: 'Jharkhand', // Changed state to match pincode region
      pinCode: '825301', // Updated pincode
      mobile: '8003334445', // NEW: Added mobile
    },
    profileImage: 'https://images.unsplash.com/photo-1517336714730-49689c8a9680?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  {
    name: 'Vendor D (Clothing)',
    email: 'vendorD@example.com',
    password: 'password123',
    role: 'vendor',
    storeName: 'Fashion Trends Boutique',
    businessDescription: 'Trendy apparel for men and women, from casual wear to ethnic outfits.',
    category: 'Clothing',
    phone: '8004445556',
    pan: 'RSTUV3456W',
    gst: '27RSTUV3456W1Z8',
    address: {
      houseNo: '5, Fashion Street',
      landmark: 'Opposite Cinema',
      city: 'Bokaro', // Changed city to match pincode region
      state: 'Jharkhand', // Changed state to match pincode region
      pinCode: '825301', // Updated pincode
      mobile: '8004445556', // NEW: Added mobile
    },
    profileImage: 'https://images.unsplash.com/photo-1523381294911-8d3cead1858b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    name: 'Vendor E (Decor)',
    email: 'vendorE@example.com',
    password: 'password123',
    role: 'vendor',
    storeName: 'Home Decor Haven',
    businessDescription: 'Unique and stylish home decor items to beautify your living space.',
    category: 'Decor',
    phone: '8005556667',
    pan: 'XYZAB7890C',
    gst: '27XYZAB7890C1Z9',
    address: {
      houseNo: '12, Decor Avenue',
      landmark: 'Near Art Gallery',
      city: 'Dhanbad', // Changed city to match pincode region
      state: 'Jharkhand', // Changed state to match pincode region
      pinCode: '825301', // Updated pincode
      mobile: '8005556667', // NEW: Added mobile
    },
    profileImage: 'https://images.unsplash.com/photo-1563298723-dcfc10990f36?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

const productsData = {
  'FreshMart Groceries': [
    {
      name: 'Organic Apples',
      description: 'Fresh, crisp organic apples, perfect for a healthy snack.',
      price: 150,
      originalPrice: 180,
      stock: 100,
      unit: 'kg', // NEW: Added unit
      category: 'Groceries',
      image: 'https://images.unsplash.com/photo-1579613832107-c3018366a156?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Farm Fresh Milk',
      description: 'Pure and wholesome milk, delivered fresh from the farm.',
      price: 60,
      stock: 50,
      unit: 'L', // NEW: Added unit
      category: 'Groceries',
      image: 'https://images.unsplash.com/photo-1628088999033-211112111111?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Brown Bread',
      description: 'Healthy and delicious brown bread, baked fresh daily.',
      price: 40,
      stock: 70,
      unit: 'pc', // NEW: Added unit
      category: 'Groceries',
      image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ],
  'Sweet Delights Bakery': [
    {
      name: 'Chocolate Croissant',
      description: 'Flaky croissant filled with rich dark chocolate.',
      price: 80,
      stock: 40,
      unit: 'pc', // NEW: Added unit
      category: 'Bakery',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Sourdough Loaf',
      description: 'Artisan sourdough bread, perfect with any meal.',
      price: 180,
      stock: 20,
      unit: 'pc', // NEW: Added unit
      category: 'Bakery',
      image: 'https://images.unsplash.com/photo-1583339752135-c172740306f7?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ],
  'TechGadget Hub': [
    {
      name: 'Wireless Earbuds',
      description: 'High-quality wireless earbuds with noise cancellation.',
      price: 2500,
      originalPrice: 3000,
      stock: 30,
      unit: 'set', // NEW: Added unit
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1607863680198-a4319de6207e?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Smartwatch',
      description: 'Track your fitness and stay connected with this sleek smartwatch.',
      price: 7000,
      stock: 15,
      unit: 'pc', // NEW: Added unit
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ],
  'Fashion Trends Boutique': [
    {
      name: 'Denim Jeans',
      description: 'Comfortable and stylish denim jeans for everyday wear.',
      price: 1200,
      originalPrice: 1500,
      stock: 80,
      unit: 'pc', // NEW: Added unit
      category: 'Clothing',
      image: 'https://images.unsplash.com/photo-1541099649105-f69dbd582eed?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Cotton T-Shirt',
      description: 'Soft and breathable cotton t-shirt, available in various colors.',
      price: 450,
      stock: 150,
      unit: 'pc', // NEW: Added unit
      category: 'Clothing',
      image: 'https://images.unsplash.com/photo-1576566588028-cdfd73055780?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ],
  'Home Decor Haven': [
    {
      name: 'Ceramic Vase',
      description: 'Hand-painted ceramic vase, perfect for your living room.',
      price: 800,
      stock: 25,
      unit: 'pc', // NEW: Added unit
      category: 'Decor',
      image: 'https://images.unsplash.com/photo-1587334175721-ad1e1071317e?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Scented Candles',
      description: 'A set of aromatic scented candles to create a relaxing ambiance.',
      price: 350,
      stock: 60,
      unit: 'set', // NEW: Added unit
      category: 'Decor',
      image: 'https://images.unsplash.com/photo-1582794543139-c317030b6731?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ],
};

// Helper function to ensure image URLs are absolute
const ensureAbsoluteImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/200?text=Product+Image'; // Default if no URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads/')) {
    return url; // Already absolute or relative to server root
  }
  // If it's a partial placeholder, prepend the base
  if (url.startsWith('200?text=') || url.startsWith('150?text=')) { // Heuristic for placeholder
    return `https://via.placeholder.com/${url}`;
  }
  return url; // Return as is if not recognized, might be a different type of relative path
};


export const importData = async () => { // Exported
  try {
    // Ensure DB is connected before operations
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    await User.deleteMany();
    await Store.deleteMany();
    await Product.deleteMany();

    console.log('Existing data cleared!');

    // Iterate and create each customer and admin user individually
    const createdCustomersAndAdmin = [];
    for (const userData of sampleCustomers) {
      const user = await User.create(userData); // User.create triggers pre-save hook for hashing
      createdCustomersAndAdmin.push(user);
    }
    console.log(`${createdCustomersAndAdmin.length} customer and admin users created.`);

    const createdVendors = [];
    for (const vendorData of sampleVendors) {
      const user = await User.create({ // User.create triggers pre-save hook for hashing
        name: vendorData.name,
        email: vendorData.email,
        password: vendorData.password, // Password will be hashed by pre-save hook
        role: 'vendor',
        phone: vendorData.phone,
        address: vendorData.address,
        pan: vendorData.pan,
        gst: vendorData.gst,
        description: vendorData.businessDescription,
        category: vendorData.category,
        profileImage: ensureAbsoluteImageUrl(vendorData.profileImage), // Apply helper to vendor profile image
      });

      const store = await Store.create({
        name: vendorData.storeName,
        description: vendorData.businessDescription,
        owner: user._id,
        category: vendorData.category,
        address: vendorData.address,
        phone: vendorData.phone,
        email: vendorData.email,
        logo: ensureAbsoluteImageUrl(vendorData.profileImage), // Apply helper to store logo
      });

      user.storeId = store._id;
      user.store = store.name;
      await user.save();
      createdVendors.push(user);

      // Add products for this store
      const storeProducts = productsData[vendorData.storeName];
      if (storeProducts) {
        const productsWithStore = storeProducts.map(p => ({ 
          ...p, 
          store: store._id,
          image: ensureAbsoluteImageUrl(p.image), // Apply helper to product images
        }));
        await Product.insertMany(productsWithStore);
        console.log(`  ${productsWithStore.length} products added for ${store.name}.`);
      }
    }
    console.log(`${createdVendors.length} vendor users and stores created.`);

    console.log('Data Imported!');
    // Only exit if run directly, not when imported by server.js
    if (process.env.NODE_ENV !== 'test' && !process.argv.includes('--imported-by-server')) {
      process.exit();
    }
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    // Only exit if run directly, not when imported by server.js
    if (process.env.NODE_ENV !== 'test' && !process.argv.includes('--imported-by-server')) {
      process.exit(1);
    }
    throw error; // Re-throw for server.js to catch
  }
};

export const destroyData = async () => { // Exported
  try {
    // Ensure DB is connected before operations
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    await User.deleteMany();
    await Store.deleteMany();
    await Product.deleteMany();

    console.log('Data Destroyed!');
    // Only exit if run directly
    if (process.env.NODE_ENV !== 'test' && !process.argv.includes('--imported-by-server')) {
      process.exit();
    }
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`);
    // Only exit if run directly
    if (process.env.NODE_ENV !== 'test' && !process.argv.includes('--imported-by-server')) {
      process.exit(1);
    }
    throw error; // Re-throw for server.js to catch
  }
};

// This block only runs if seeder.js is executed directly
if (process.argv[2] === '-d') {
  destroyData();
} else if (process.argv[1].includes('seeder.js') && !process.argv.includes('--imported-by-server')) {
  // Only import data if seeder.js is run directly and not as an import
  importData();
}