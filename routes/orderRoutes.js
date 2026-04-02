import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  placeOrder,
  getCustomerOrders,
  getOrderById,
  getVendorOrders,
  updateOrderStatus,
  confirmDelivery,
} from '../controllers/orderController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { placeOrderSchema, updateOrderStatusSchema, confirmDeliverySchema } from '../validators/orderValidator.js'; // Import new schemas

const router = express.Router();

// Customer routes
router.post('/', protect, authorizeRoles('customer'), validate(placeOrderSchema), placeOrder); // Apply validation
router.get('/user/:userId', protect, authorizeRoles('customer'), getCustomerOrders);

// General order route (can be accessed by customer, vendor, admin for their respective orders)
router.get('/:id', protect, getOrderById);

// Vendor routes
router.get('/store/:storeId', protect, authorizeRoles('vendor'), getVendorOrders);
router.put('/:id/status', protect, authorizeRoles('vendor', 'admin'), validate(updateOrderStatusSchema), updateOrderStatus); // Apply validation
router.post('/:id/confirm-delivery', protect, authorizeRoles('vendor'), validate(confirmDeliverySchema), confirmDelivery); // Apply validation

export default router;