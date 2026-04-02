import asyncHandler from '../middleware/asyncHandler.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js'; // To link payments to orders

// @desc    Get all payments for a specific vendor
// @route   GET /api/payments/vendor/:vendorId
// @access  Private/Vendor
const getVendorPayments = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;
  const { status, search } = req.query;

  // Ensure the logged-in user is the vendor they are requesting payments for
  if (req.user._id.toString() !== vendorId) {
    res.status(403);
    throw new Error('Not authorized to view these payments.');
  }

  let query = { vendor: vendorId };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    // Search by transactionId or order ID (requires populate)
    // For simplicity, we'll search by transactionId directly for now.
    // A more complex search might involve populating order and then searching its ID.
    query.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      // Add more search fields if needed, e.g., customer name from populated order
    ];
  }

  const payments = await Payment.find(query)
    .populate('order', 'totalPrice customerName customerEmail') // Populate order details
    .populate('customer', 'name email') // Populate customer details
    .sort({ paymentDate: -1 }); // Sort by latest payments

  res.json(payments);
});

// @desc    Report an issue for a payment
// @route   POST /api/payments/:id/report-issue
// @access  Private/Vendor
const reportPaymentIssue = asyncHandler(async (req, res) => {
  const { id: paymentId } = req.params;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  // Ensure the logged-in user is the vendor associated with this payment
  if (req.user._id.toString() !== payment.vendor.toString()) {
    res.status(403);
    throw new Error('Not authorized to report issue for this payment.');
  }

  // In a real application, this would trigger an email to admin,
  // update a support ticket system, or change payment status to 'Disputed'.
  // For now, we'll just log and send a success message.
  console.log(`Vendor ${req.user.name} reported an issue for payment ${paymentId}`);
  res.json({ message: `Issue reported for payment ${paymentId}. Admin will contact you shortly.` });
});


export { getVendorPayments, reportPaymentIssue };